const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { synthesizeAudio } = require('../services/tts');

const CHAPTERS_PATH = path.join(__dirname, '..', 'db', 'chapters.json');

// Simple admin auth (for development)
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === process.env.ADMIN_TOKEN || process.env.NODE_ENV === 'development') {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

// Convert text to audio
router.post('/convert', isAdmin, async (req, res) => {
  try {
    const { chapterId, title, text, moduleId } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }
    
    console.log(`Converting chapter ${chapterId}: "${title}"`);
    
    // Generate audio
    const audioBuffer = await synthesizeAudio({
      text: text.substring(0, 4500), // Limit text length
      voiceName: 'en-US-Standard-C'
    });
    
    // Upload to Cloudinary
    const fileName = `varsity-${moduleId}-${chapterId}-${Date.now()}.mp3`;
    const folder = process.env.CLOUDINARY_FOLDER || 'varsity-audio';
    
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          public_id: `${folder}/${fileName}`,
          folder: folder,
          tags: [`module-${moduleId}`, `chapter-${chapterId}`]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(audioBuffer);
    });
    
    // Update chapters.json
    const chaptersData = await fs.readFile(CHAPTERS_PATH, 'utf-8');
    const chapters = JSON.parse(chaptersData);
    
    const chapterIndex = chapters.findIndex(ch => ch.id === chapterId);
    if (chapterIndex !== -1) {
      chapters[chapterIndex].audioUrl = uploadResult.secure_url;
      chapters[chapterIndex].updatedAt = new Date().toISOString();
      
      await fs.writeFile(CHAPTERS_PATH, JSON.stringify(chapters, null, 2));
    }
    
    res.json({
      success: true,
      audioUrl: uploadResult.secure_url,
      chapterId,
      message: 'Audio converted and uploaded successfully'
    });
    
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all chapters (admin view)
router.get('/chapters', isAdmin, async (req, res) => {
  try {
    const chaptersData = await fs.readFile(CHAPTERS_PATH, 'utf-8');
    const chapters = JSON.parse(chaptersData);
    
    const adminChapters = chapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      moduleId: ch.moduleId,
      moduleName: ch.moduleName,
      hasAudio: !!ch.audioUrl,
      audioUrl: ch.audioUrl,
      contentLength: ch.content ? ch.content.length : 0,
      createdAt: ch.createdAt,
      updatedAt: ch.updatedAt
    }));
    
    res.json({ success: true, chapters: adminChapters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
