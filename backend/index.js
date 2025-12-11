// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 5010;

// Cloudinary configuration - IMPORTANT!
if (process.env.CLOUDINARY_URL) {
  // Parse CLOUDINARY_URL or use separate env variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 
                process.env.CLOUDINARY_URL?.split('@')[1] ||
                'your-cloud-name',
    api_key: process.env.CLOUDINARY_API_KEY || 
             process.env.CLOUDINARY_URL?.split('://')[1]?.split(':')[0] ||
             'your-api-key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 
                process.env.CLOUDINARY_URL?.split(':')[2]?.split('@')[0] ||
                'your-api-secret',
    secure: true
  });
  console.log('☁️  Cloudinary configured');
} else {
  console.warn('⚠️  CLOUDINARY_URL not set. Audio uploads will fail.');
}

// CORS - configure properly for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    return true;
  } catch (error) {
    console.error('Error writing chapters:', error);
    return false;
  }
}

// Helper: Check audio status and get audio URL if exists
async function checkAudioStatus(chapterId, chapterTitle) {
  try {
    if (!process.env.CLOUDINARY_URL) {
      return { hasAudio: false, audioUrl: null, status: 'cloudinary_not_configured' };
    }

    // Search for audio in Cloudinary folder
    const folder = process.env.CLOUDINARY_FOLDER || 'varsity-audio';
    const searchQuery = `resource_type:audio AND folder:${folder} AND filename:${chapterId}`;
    
    const result = await cloudinary.search
      .expression(searchQuery)
      .execute();
    
    if (result.resources && result.resources.length > 0) {
      const audioResource = result.resources[0];
      return {
        hasAudio: true,
        audioUrl: audioResource.secure_url,
        duration: audioResource.duration,
        format: audioResource.format,
        size: audioResource.bytes,
        publicId: audioResource.public_id,
        uploadedAt: audioResource.created_at,
        status: 'converted'
      };
    }
    
    return { hasAudio: false, audioUrl: null, status: 'pending' };
  } catch (error) {
    console.error(`Error checking audio status for ${chapterId}:`, error);
    return { hasAudio: false, audioUrl: null, status: 'error', error: error.message };
  }
}

// Helper: Update chapter with audio status
async function updateChapterAudioStatus(chapterId, audioData) {
  try {
    const chapters = await readChapters();
    const chapterIndex = chapters.findIndex(ch => ch.id === chapterId);
    
    if (chapterIndex !== -1) {
      chapters[chapterIndex].audioStatus = audioData.status;
      chapters[chapterIndex].audioUrl = audioData.audioUrl || null;
      chapters[chapterIndex].audioDuration = audioData.duration;
      chapters[chapterIndex].audioUpdatedAt = new Date().toISOString();
      
      if (audioData.hasAudio) {
        chapters[chapterIndex].convertedAt = audioData.uploadedAt || new Date().toISOString();
      }
      
      await writeChapters(chapters);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating audio status for ${chapterId}:`, error);
    return false;
  }
}

// API Routes

// Get all modules with chapters - WITH AUDIO STATUS CHECK
app.get('/api/modules', async (req, res) => {
  try {
    const chapters = await readChapters();
    const isAdmin = req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN}`;
    
    // Group by module
    const modulesMap = {};
    
    // Process chapters in batches to avoid overwhelming Cloudinary API
    for (const chapter of chapters) {
      const moduleId = chapter.moduleId || 'general';
      const moduleName = chapter.moduleName || `Module ${moduleId}`;
      
      if (!modulesMap[moduleId]) {
        modulesMap[moduleId] = {
          id: moduleId,
          name: moduleName,
          description: chapter.moduleDescription || '',
          totalChapters: 0,
          convertedChapters: 0,
          chapters: []
        };
      }
      
      // Check audio status (only for non-admin users if not already cached)
      let audioStatus = chapter.audioStatus || 'pending';
      let audioUrl = chapter.audioUrl || null;
      
      if (!isAdmin && (!chapter.audioStatus || chapter.audioStatus === 'pending')) {
        // For regular users, check if audio exists
        const audioCheck = await checkAudioStatus(chapter.id, chapter.title);
        audioStatus = audioCheck.status;
        audioUrl = audioCheck.audioUrl;
        
        // Update cache in database
        if (audioStatus !== chapter.audioStatus) {
          await updateChapterAudioStatus(chapter.id, audioCheck);
        }
      }
      
      modulesMap[moduleId].chapters.push({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || '',
        audioUrl: audioUrl,
        hasAudio: audioStatus === 'converted',
        audioStatus: audioStatus, // 'pending', 'converted', 'processing', 'error'
        audioDuration: chapter.audioDuration,
        pageUrl: chapter.pageUrl || `https://zerodha.com/varsity/chapters/${chapter.id}`,
        tags: chapter.tags || [],
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        convertedAt: chapter.convertedAt,
        // Show different buttons based on user type
        showRequestButton: !isAdmin && audioStatus !== 'converted',
        showConvertButton: isAdmin && audioStatus !== 'converted'
      });
      
      modulesMap[moduleId].totalChapters++;
      if (audioStatus === 'converted') {
        modulesMap[moduleId].convertedChapters++;
      }
    }
    
    const modules = Object.values(modulesMap);
    
    // Calculate conversion percentage for each module
    modules.forEach(module => {
      module.conversionPercentage = module.totalChapters > 0 
        ? Math.round((module.convertedChapters / module.totalChapters) * 100) 
        : 0;
    });
    
    res.json({ 
      success: true, 
      modules,
      stats: {
        totalModules: modules.length,
        totalChapters: chapters.length,
        totalConverted: modules.reduce((sum, mod) => sum + mod.convertedChapters, 0),
        overallPercentage: chapters.length > 0 
          ? Math.round((modules.reduce((sum, mod) => sum + mod.convertedChapters, 0) / chapters.length) * 100)
          : 0
      }
    });
  } catch (error) {
    console.error('Error getting modules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get chapters for a specific module - WITH AUDIO STATUS
app.get('/api/modules/:moduleId/chapters', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const isAdmin = req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN}`;
    const chapters = await readChapters();
    
    const filteredChapters = [];
    
    for (const chapter of chapters.filter(ch => ch.moduleId == moduleId)) {
      // Check audio status if not cached or if admin
      let audioStatus = chapter.audioStatus || 'pending';
      let audioUrl = chapter.audioUrl || null;
      
      if (!chapter.audioStatus || chapter.audioStatus === 'pending' || isAdmin) {
        const audioCheck = await checkAudioStatus(chapter.id, chapter.title);
        audioStatus = audioCheck.status;
        audioUrl = audioCheck.audioUrl;
        
        // Update cache
        await updateChapterAudioStatus(chapter.id, audioCheck);
      }
      
      filteredChapters.push({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || '',
        content: chapter.content || '',
        audioUrl: audioUrl,
        hasAudio: audioStatus === 'converted',
        audioStatus: audioStatus,
        audioDuration: chapter.audioDuration,
        pageUrl: chapter.pageUrl || `https://zerodha.com/varsity/chapters/${chapter.id}`,
        tags: chapter.tags || [],
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        convertedAt: chapter.convertedAt,
        showRequestButton: !isAdmin && audioStatus !== 'converted',
        showConvertButton: isAdmin && audioStatus !== 'converted'
      });
    }
    
    res.json({ success: true, chapters: filteredChapters });
  } catch (error) {
    console.error('Error getting module chapters:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quick audio status check endpoint (for polling)
app.get('/api/chapters/:chapterId/audio-status', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapters = await readChapters();
    const chapter = chapters.find(ch => ch.id === chapterId);
    
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }
    
    const audioCheck = await checkAudioStatus(chapterId, chapter.title);
    
    // Update cache
    await updateChapterAudioStatus(chapterId, audioCheck);
    
    res.json({
      success: true,
      chapterId,
      hasAudio: audioCheck.hasAudio,
      audioUrl: audioCheck.audioUrl,
      status: audioCheck.status,
      duration: audioCheck.duration
    });
  } catch (error) {
    console.error('Error checking audio status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk audio status check
app.post('/api/chapters/bulk-audio-status', async (req, res) => {
  try {
    const { chapterIds } = req.body;
    const results = {};
    
    // Check status for multiple chapters (limited to 10 at a time)
    const idsToCheck = chapterIds.slice(0, 10);
    
    for (const chapterId of idsToCheck) {
      const audioCheck = await checkAudioStatus(chapterId, '');
      results[chapterId] = {
        hasAudio: audioCheck.hasAudio,
        status: audioCheck.status,
        audioUrl: audioCheck.audioUrl
      };
      
      // Update cache
      const chapters = await readChapters();
      const chapter = chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        await updateChapterAudioStatus(chapterId, audioCheck);
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error in bulk audio status check:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Health check with Cloudinary status
app.get('/health', async (req, res) => {
  try {
    const cloudinaryStatus = process.env.CLOUDINARY_URL ? 'configured' : 'not_configured';
    
    // Test Cloudinary connection
    let cloudinaryTest = { status: 'not_tested' };
    if (process.env.CLOUDINARY_URL) {
      try {
        await cloudinary.api.ping();
        cloudinaryTest.status = 'connected';
      } catch (error) {
        cloudinaryTest.status = 'error';
        cloudinaryTest.error = error.message;
      }
    }
    
    res.json({ 
      status: 'ok', 
      service: 'varsity-audio-api',
      timestamp: new Date().toISOString(),
      cloudinary: cloudinaryStatus,
      cloudinaryTest,
      chaptersCount: (await readChapters()).length
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api/modules`);
  console.log(`🔐 Admin: http://localhost:${PORT}/api/admin/`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_URL ? 'Configured' : 'Not configured'}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});