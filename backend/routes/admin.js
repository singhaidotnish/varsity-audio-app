// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const { adminAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const ttsService = require('../services/tts');

// Apply admin authentication to all routes
router.use(adminAuth);

// Enable file uploads
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  abortOnLimit: true,
  createParentPath: true
}));

// ========== DASHBOARD & STATS ==========
router.get('/dashboard', adminController.getDashboardStats);

// ========== MODULE MANAGEMENT ==========
router.post('/modules', adminController.createModule);
router.get('/modules', async (req, res) => {
  try {
    const modules = await adminController.readModules();
    res.json({ success: true, modules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.put('/modules/:moduleId', adminController.updateModule);
router.delete('/modules/:moduleId', adminController.deleteModule);

// ========== CHAPTER MANAGEMENT ==========
router.get('/chapters', adminController.getAllChapters);
router.get('/chapters/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapters = await adminController.readChapters();
    const chapter = chapters.find(c => c.id === chapterId);
    
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }
    
    res.json({ success: true, chapter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.post('/chapters', adminController.createChapter);
router.put('/chapters/:chapterId', adminController.updateChapter);
router.delete('/chapters/:chapterId', adminController.deleteChapter);

// ========== AUDIO CONVERSION ==========
// Legacy route for backward compatibility
router.post('/convert', async (req, res) => {
  try {
    const { chapterId, title, text, moduleId } = req.body;
    
    if (!text || !chapterId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text and chapterId are required' 
      });
    }
    
    const result = await ttsService.convertTextToSpeech(text, chapterId, title || 'Untitled');
    
    if (result.success) {
      // Update the chapter in database
      await adminController.updateChapterInDB(chapterId, {
        audioUrl: result.audioUrl,
        audioStatus: 'converted',
        hasAudio: true,
        audioGenerated: true,
        audioDuration: result.duration,
        convertedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      
      res.json({
        success: true,
        audioUrl: result.audioUrl,
        chapterId,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// New audio conversion routes
router.post('/chapters/:chapterId/convert', adminController.convertChapterToAudio);
router.post('/chapters/bulk-convert', adminController.bulkConvertChapters);
router.post('/chapters/:chapterId/upload-audio', adminController.uploadAudio);

// ========== TTS SERVICE STATUS ==========
router.get('/tts-status', async (req, res) => {
  try {
    const status = await ttsService.checkServiceStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== BULK OPERATIONS ==========
router.post('/bulk-actions', async (req, res) => {
  try {
    const { action, chapterIds } = req.body;
    
    if (!action || !Array.isArray(chapterIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Action and chapterIds array are required' 
      });
    }
    
    const chapters = await adminController.readChapters();
    let results = [];
    
    switch (action) {
      case 'delete':
        // Filter out selected chapters
        const remainingChapters = chapters.filter(ch => !chapterIds.includes(ch.id));
        await adminController.writeChapters(remainingChapters);
        results = chapterIds.map(id => ({ id, status: 'deleted' }));
        break;
        
      case 'mark-converted':
        const updatedChapters = chapters.map(ch => {
          if (chapterIds.includes(ch.id)) {
            return {
              ...ch,
              audioStatus: 'converted',
              hasAudio: true,
              updatedAt: new Date().toISOString()
            };
          }
          return ch;
        });
        await adminController.writeChapters(updatedChapters);
        results = chapterIds.map(id => ({ id, status: 'marked-converted' }));
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid action' 
        });
    }
    
    res.json({ 
      success: true, 
      message: `Bulk action '${action}' completed`,
      results 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== EXPORT/IMPORT ==========
router.get('/export', async (req, res) => {
  try {
    const chapters = await adminController.readChapters();
    const modules = await adminController.readModules();
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      modules,
      chapters: chapters.map(ch => ({
        id: ch.id,
        title: ch.title,
        content: ch.content,
        moduleId: ch.moduleId,
        description: ch.description,
        tags: ch.tags
      }))
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=varsity-audio-backup.json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    if (!req.files || !req.files.data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Import file is required' 
      });
    }
    
    const importData = JSON.parse(req.files.data.data.toString());
    
    // Validate import data
    if (!importData.modules || !importData.chapters) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid import format' 
      });
    }
    
    // Backup current data
    const currentChapters = await adminController.readChapters();
    const currentModules = await adminController.readModules();
    
    const backup = {
      backedUpAt: new Date().toISOString(),
      chapters: currentChapters,
      modules: currentModules
    };
    
    await require('fs').promises.writeFile(
      `backup-${Date.now()}.json`,
      JSON.stringify(backup, null, 2)
    );
    
    // Import new data
    await adminController.writeChapters(importData.chapters);
    await adminController.writeModules(importData.modules);
    
    res.json({ 
      success: true, 
      message: `Imported ${importData.chapters.length} chapters and ${importData.modules.length} modules`,
      backupCreated: true
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;