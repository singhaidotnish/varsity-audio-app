// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { scrapeChapter } = require('../services/scraperService');
const { generateAndUploadAudio } = require('../services/audioGeneratr');

// ========== DASHBOARD ==========
router.get('/dashboard', adminController.getDashboardStats);

// ========== CHAPTERS ==========
router.get('/chapters', adminController.getAllChapters);

// ========== 🚀 THE AUDIO GENERATOR (The core feature) ==========
router.post('/generate-from-url', async (req, res) => {
  try {
    const { url } = req.body;
    // Basic validation
    if (!url) return res.status(400).json({ error: "URL is required" });
    if (!url.includes('zerodha.com/varsity')) {
        return res.status(400).json({ error: "Invalid URL. Must be a Zerodha Varsity link." });
    }

    console.log("🚀 Admin requested generation for:", url);

    // 1. Scrape Text
    const { chapterId, title, text } = await scrapeChapter(url);
    console.log(`✅ Scraped: ${title} (${text.length} chars)`);

    // 2. Generate Audio & Upload
    const { audioUrl, duration } = await generateAndUploadAudio(text, chapterId);
    console.log(`✅ Audio Generated: ${audioUrl}`);

    // 3. Update Database using the Helper Functions we fixed
    const chapters = await adminController.readChapters();
    const existingIndex = chapters.findIndex(c => c.id === chapterId);
    
    const newChapterData = {
        id: chapterId,
        title: title,
        pageUrl: url,
        hasAudio: true,
        audioUrl: audioUrl,
        audioDuration: duration,
        lastUpdated: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        chapters[existingIndex] = { ...chapters[existingIndex], ...newChapterData };
    } else {
        chapters.push(newChapterData);
    }

    await adminController.writeChapters(chapters);

    res.json({ success: true, audioUrl, title });

  } catch (error) {
    console.error("❌ Generation Failed:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;