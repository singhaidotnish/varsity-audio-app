require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 5010;

// Cloudinary config
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
}

// CORS
app.use(cors());
app.use(express.json());

// Data paths
const CHAPTERS_PATH = path.join(__dirname, 'db', 'chapters.json');

// Helper: Read chapters
async function readChapters() {
  try {
    const data = await fs.readFile(CHAPTERS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading chapters:', error);
    return [];
  }
}

// Helper: Write chapters
async function writeChapters(chapters) {
  try {
    await fs.writeFile(CHAPTERS_PATH, JSON.stringify(chapters, null, 2));
  } catch (error) {
    console.error('Error writing chapters:', error);
  }
}

// API Routes

// Get all modules with chapters
app.get('/api/modules', async (req, res) => {
  try {
    const chapters = await readChapters();
    
    // Group by module
    const modulesMap = {};
    
    chapters.forEach(chapter => {
      const moduleId = chapter.moduleId || 'general';
      const moduleName = chapter.moduleName || `Module ${moduleId}`;
      
      if (!modulesMap[moduleId]) {
        modulesMap[moduleId] = {
          id: moduleId,
          name: moduleName,
          description: chapter.moduleDescription || '',
          chapters: []
        };
      }
      
      modulesMap[moduleId].chapters.push({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || '',
        audioUrl: chapter.audioUrl || null,
        hasAudio: !!chapter.audioUrl,
        pageUrl: chapter.pageUrl || `https://zerodha.com/varsity/chapters/${chapter.id}`,
        tags: chapter.tags || []
      });
    });
    
    const modules = Object.values(modulesMap);
    res.json({ success: true, modules });
  } catch (error) {
    console.error('Error getting modules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get chapters for a specific module
app.get('/api/modules/:moduleId/chapters', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const chapters = await readChapters();
    
    const filteredChapters = chapters
      .filter(ch => ch.moduleId == moduleId)
      .map(ch => ({
        id: ch.id,
        title: ch.title,
        description: ch.description || '',
        content: ch.content || '',
        audioUrl: ch.audioUrl || null,
        hasAudio: !!ch.audioUrl,
        pageUrl: ch.pageUrl || `https://zerodha.com/varsity/chapters/${ch.id}`,
        tags: ch.tags || [],
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt
      }));
    
    res.json({ success: true, chapters: filteredChapters });
  } catch (error) {
    console.error('Error getting module chapters:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'varsity-audio-api',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api/modules`);
  console.log(`🔐 Admin: http://localhost:${PORT}/api/admin/`);
});
