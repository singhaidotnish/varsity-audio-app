// backend/controllers/adminController.js
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;
const ttsService = require('../services/tts');

const CHAPTERS_PATH = path.join(__dirname, '..', 'db', 'chapters.json');
const MODULES_PATH = path.join(__dirname, '..', 'db', 'modules.json');

// Helper functions
async function readChapters() {
  try {
    const data = await fs.readFile(CHAPTERS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading chapters:', error);
    return [];
  }
}

async function writeChapters(chapters) {
  try {
    await fs.writeFile(CHAPTERS_PATH, JSON.stringify(chapters, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing chapters:', error);
    return false;
  }
}

async function readModules() {
  try {
    const data = await fs.readFile(MODULES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If modules.json doesn't exist, create from chapters
    const chapters = await readChapters();
    const modulesMap = {};
    
    chapters.forEach(chapter => {
      if (!modulesMap[chapter.moduleId]) {
        modulesMap[chapter.moduleId] = {
          id: chapter.moduleId,
          name: chapter.moduleName,
          description: chapter.moduleDescription || '',
          color: getColorForModule(chapter.moduleId),
          createdAt: chapter.createdAt,
          updatedAt: new Date().toISOString(),
          chapterCount: 0
        };
      }
      modulesMap[chapter.moduleId].chapterCount++;
    });
    
    const modules = Object.values(modulesMap);
    await writeModules(modules);
    return modules;
  }
}

async function writeModules(modules) {
  try {
    await fs.writeFile(MODULES_PATH, JSON.stringify(modules, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing modules:', error);
    return false;
  }
}

function getColorForModule(moduleId) {
  const colors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
    '#E91E63', '#00BCD4', '#8BC34A', '#FF5722',
    '#3F51B5', '#009688', '#FFC107', '#795548'
  ];
  return colors[parseInt(moduleId) % colors.length];
}

// Generate unique ID
function generateId(title, moduleId) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  const cleanTitle = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substr(0, 20);
  return `${moduleId}__${cleanTitle}__${timestamp}${random}`;
}

// Controller Methods
const adminController = {
  // Dashboard Stats
  async getDashboardStats(req, res) {
    try {
      const chapters = await readChapters();
      const modules = await readModules();
      
      const stats = {
        totalModules: modules.length,
        totalChapters: chapters.length,
        convertedChapters: chapters.filter(c => c.audioStatus === 'converted').length,
        pendingChapters: chapters.filter(c => c.audioStatus === 'pending').length,
        processingChapters: chapters.filter(c => c.audioStatus === 'processing').length,
        recentActivity: chapters
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 10)
          .map(c => ({
            id: c.id,
            title: c.title,
            module: c.moduleName,
            status: c.audioStatus,
            updatedAt: c.updatedAt
          }))
      };
      
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Module Management
  async createModule(req, res) {
    try {
      const { name, description, color } = req.body;
      
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Module name is required' 
        });
      }
      
      const modules = await readModules();
      
      // Generate module ID
      const moduleId = modules.length > 0 
        ? Math.max(...modules.map(m => parseInt(m.id))) + 1
        : 1;
      
      const newModule = {
        id: moduleId.toString(),
        name,
        description: description || '',
        color: color || getColorForModule(moduleId),
        chapterCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      modules.push(newModule);
      await writeModules(modules);
      
      res.json({ 
        success: true, 
        message: 'Module created successfully',
        module: newModule
      });
    } catch (error) {
      console.error('Error creating module:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateModule(req, res) {
    try {
      const { moduleId } = req.params;
      const { name, description, color } = req.body;
      
      const modules = await readModules();
      const moduleIndex = modules.findIndex(m => m.id === moduleId);
      
      if (moduleIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Module not found' 
        });
      }
      
      // Update module
      modules[moduleIndex] = {
        ...modules[moduleIndex],
        name: name || modules[moduleIndex].name,
        description: description !== undefined ? description : modules[moduleIndex].description,
        color: color || modules[moduleIndex].color,
        updatedAt: new Date().toISOString()
      };
      
      // Update all chapters in this module
      const chapters = await readChapters();
      const updatedChapters = chapters.map(chapter => {
        if (chapter.moduleId === moduleId) {
          return {
            ...chapter,
            moduleName: name || chapter.moduleName,
            moduleDescription: description !== undefined ? description : chapter.moduleDescription,
            updatedAt: new Date().toISOString()
          };
        }
        return chapter;
      });
      
      await writeModules(modules);
      await writeChapters(updatedChapters);
      
      res.json({ 
        success: true, 
        message: 'Module updated successfully',
        module: modules[moduleIndex]
      });
    } catch (error) {
      console.error('Error updating module:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async deleteModule(req, res) {
    try {
      const { moduleId } = req.params;
      
      // Check if module has chapters
      const chapters = await readChapters();
      const moduleChapters = chapters.filter(c => c.moduleId === moduleId);
      
      if (moduleChapters.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete module with chapters. Delete chapters first.' 
        });
      }
      
      // Remove module
      const modules = await readModules();
      const filteredModules = modules.filter(m => m.id !== moduleId);
      
      await writeModules(filteredModules);
      
      res.json({ 
        success: true, 
        message: 'Module deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting module:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Chapter Management
  async createChapter(req, res) {
    try {
      const { 
        title, 
        description, 
        content, 
        moduleId,
        pageUrl,
        tags 
      } = req.body;
      
      if (!title || !content || !moduleId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Title, content, and moduleId are required' 
        });
      }
      
      // Check if module exists
      const modules = await readModules();
      const module = modules.find(m => m.id === moduleId);
      
      if (!module) {
        return res.status(404).json({ 
          success: false, 
          error: 'Module not found' 
        });
      }
      
      const chapters = await readChapters();
      const chapterId = generateId(title, moduleId);
      const now = new Date().toISOString();
      
      const newChapter = {
        id: chapterId,
        title,
        description: description || '',
        content,
        moduleId,
        moduleName: module.name,
        moduleDescription: module.description,
        audioUrl: null,
        audioStatus: 'pending',
        hasAudio: false,
        audioGenerated: false,
        audioDuration: null,
        lastUpdated: null,
        convertedAt: null,
        audioUpdatedAt: null,
        pageUrl: pageUrl || `https://zerodha.com/varsity/chapters/${chapterId}`,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [`module-${moduleId}`],
        createdAt: now,
        updatedAt: now
      };
      
      chapters.push(newChapter);
      await writeChapters(chapters);
      
      // Update module chapter count
      const moduleIndex = modules.findIndex(m => m.id === moduleId);
      if (moduleIndex !== -1) {
        modules[moduleIndex].chapterCount += 1;
        modules[moduleIndex].updatedAt = now;
        await writeModules(modules);
      }
      
      res.json({ 
        success: true, 
        message: 'Chapter created successfully',
        chapter: newChapter
      });
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateChapter(req, res) {
    try {
      const { chapterId } = req.params;
      const updates = req.body;
      
      const chapters = await readChapters();
      const chapterIndex = chapters.findIndex(c => c.id === chapterId);
      
      if (chapterIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Chapter not found' 
        });
      }
      
      // Update chapter
      const updatedChapter = {
        ...chapters[chapterIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // If module changed, update module references
      if (updates.moduleId && updates.moduleId !== chapters[chapterIndex].moduleId) {
        const modules = await readModules();
        const newModule = modules.find(m => m.id === updates.moduleId);
        
        if (newModule) {
          updatedChapter.moduleName = newModule.name;
          updatedChapter.moduleDescription = newModule.description;
        }
      }
      
      chapters[chapterIndex] = updatedChapter;
      await writeChapters(chapters);
      
      res.json({ 
        success: true, 
        message: 'Chapter updated successfully',
        chapter: updatedChapter
      });
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async deleteChapter(req, res) {
    try {
      const { chapterId } = req.params;
      
      const chapters = await readChapters();
      const chapterIndex = chapters.findIndex(c => c.id === chapterId);
      
      if (chapterIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Chapter not found' 
        });
      }
      
      const chapter = chapters[chapterIndex];
      const updatedChapters = chapters.filter(c => c.id !== chapterId);
      
      await writeChapters(updatedChapters);
      
      // Update module chapter count
      const modules = await readModules();
      const moduleIndex = modules.findIndex(m => m.id === chapter.moduleId);
      
      if (moduleIndex !== -1) {
        modules[moduleIndex].chapterCount = Math.max(0, modules[moduleIndex].chapterCount - 1);
        modules[moduleIndex].updatedAt = new Date().toISOString();
        await writeModules(modules);
      }
      
      res.json({ 
        success: true, 
        message: 'Chapter deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Audio Conversion
  async convertChapterToAudio(req, res) {
    try {
      const { chapterId } = req.params;
      
      const chapters = await readChapters();
      const chapterIndex = chapters.findIndex(c => c.id === chapterId);
      
      if (chapterIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Chapter not found' 
        });
      }
      
      const chapter = chapters[chapterIndex];
      
      // Update status to processing
      chapters[chapterIndex].audioStatus = 'processing';
      chapters[chapterIndex].audioUpdatedAt = new Date().toISOString();
      await writeChapters(chapters);
      
      // Convert text to speech
      const audioResult = await ttsService.convertTextToSpeech(
        chapter.content,
        chapter.id,
        chapter.title
      );
      
      // Update chapter with audio URL
      if (audioResult.success) {
        chapters[chapterIndex].audioUrl = audioResult.audioUrl;
        chapters[chapterIndex].audioStatus = 'converted';
        chapters[chapterIndex].hasAudio = true;
        chapters[chapterIndex].audioGenerated = true;
        chapters[chapterIndex].audioDuration = audioResult.duration;
        chapters[chapterIndex].convertedAt = new Date().toISOString();
        chapters[chapterIndex].lastUpdated = new Date().toISOString();
      } else {
        chapters[chapterIndex].audioStatus = 'error';
        chapters[chapterIndex].lastUpdated = new Date().toISOString();
      }
      
      await writeChapters(chapters);
      
      res.json({ 
        success: audioResult.success,
        message: audioResult.message,
        audioUrl: audioResult.audioUrl,
        chapter: chapters[chapterIndex]
      });
    } catch (error) {
      console.error('Error converting chapter to audio:', error);
      
      // Update chapter status to error
      const chapters = await readChapters();
      const chapterIndex = chapters.findIndex(c => c.id === req.params.chapterId);
      
      if (chapterIndex !== -1) {
        chapters[chapterIndex].audioStatus = 'error';
        chapters[chapterIndex].audioUpdatedAt = new Date().toISOString();
        await writeChapters(chapters);
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async bulkConvertChapters(req, res) {
    try {
      const { chapterIds } = req.body;
      
      if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'chapterIds array is required' 
        });
      }
      
      // Limit to 5 chapters at a time
      const idsToConvert = chapterIds.slice(0, 5);
      const results = [];
      
      for (const chapterId of idsToConvert) {
        try {
          // Simulate processing (in real app, this would be async/queue)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Call convert function
          const chapters = await readChapters();
          const chapter = chapters.find(c => c.id === chapterId);
          
          if (chapter) {
            results.push({
              chapterId,
              status: 'queued',
              message: 'Added to conversion queue'
            });
          } else {
            results.push({
              chapterId,
              status: 'error',
              message: 'Chapter not found'
            });
          }
        } catch (error) {
          results.push({
            chapterId,
            status: 'error',
            message: error.message
          });
        }
      }
      
      res.json({ 
        success: true, 
        message: 'Chapters queued for conversion',
        results
      });
    } catch (error) {
      console.error('Error in bulk conversion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Upload existing audio
  async uploadAudio(req, res) {
    try {
      const { chapterId } = req.params;
      
      if (!req.files || !req.files.audio) {
        return res.status(400).json({ 
          success: false, 
          error: 'Audio file is required' 
        });
      }
      
      const audioFile = req.files.audio;
      const chapters = await readChapters();
      const chapterIndex = chapters.findIndex(c => c.id === chapterId);
      
      if (chapterIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Chapter not found' 
        });
      }
      
      // Upload to Cloudinary
      const cloudinaryResult = await cloudinary.uploader.upload(audioFile.tempFilePath, {
        resource_type: 'video', // Cloudinary treats audio as video
        folder: process.env.CLOUDINARY_FOLDER || 'varsity-audio',
        public_id: chapterId,
        overwrite: true
      });
      
      // Update chapter
      chapters[chapterIndex].audioUrl = cloudinaryResult.secure_url;
      chapters[chapterIndex].audioStatus = 'converted';
      chapters[chapterIndex].hasAudio = true;
      chapters[chapterIndex].audioGenerated = true;
      chapters[chapterIndex].audioDuration = cloudinaryResult.duration;
      chapters[chapterIndex].convertedAt = new Date().toISOString();
      chapters[chapterIndex].audioUpdatedAt = new Date().toISOString();
      chapters[chapterIndex].lastUpdated = new Date().toISOString();
      
      await writeChapters(chapters);
      
      res.json({ 
        success: true, 
        message: 'Audio uploaded successfully',
        audioUrl: cloudinaryResult.secure_url,
        duration: cloudinaryResult.duration,
        chapter: chapters[chapterIndex]
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get all chapters with filters
  async getAllChapters(req, res) {
    try {
      const { 
        moduleId, 
        status, 
        search,
        page = 1,
        limit = 20 
      } = req.query;
      
      let chapters = await readChapters();
      
      // Apply filters
      if (moduleId) {
        chapters = chapters.filter(c => c.moduleId === moduleId);
      }
      
      if (status) {
        chapters = chapters.filter(c => c.audioStatus === status);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        chapters = chapters.filter(c => 
          c.title.toLowerCase().includes(searchLower) ||
          c.content.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedChapters = chapters.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        chapters: paginatedChapters,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: chapters.length,
          totalPages: Math.ceil(chapters.length / limit)
        }
      });
    } catch (error) {
      console.error('Error getting chapters:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = adminController;