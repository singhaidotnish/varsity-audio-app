require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5010;
const PUBLIC_DIR = path.join(__dirname, 'public');
const CHAPTERS_PATH = path.join(__dirname, 'db', 'chapters.json');

// ========== FIXED CORS CONFIGURATION ==========
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5010',
      'https://varsity-audio-monorepo-cjpj.onrender.com',
      'https://zerodha.com',
      'https://varsity.zerodha.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Allow all origins in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Allowing non-whitelisted origin in dev: ${origin}`);
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

// ========== REST OF YOUR CONFIG ==========
app.use(express.json({ limit: '10mb' }));
app.use('/public', express.static(PUBLIC_DIR));

// Import admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Helper function
function readJsonSafe(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read JSON:', filePath, err);
    return fallback;
  }
}

// GET /api/chapters
app.get('/api/chapters', (req, res) => {
  const data = readJsonSafe(CHAPTERS_PATH, []);
  res.json({ ok: true, chapters: data });
});

// GET /api/modules
app.get('/api/modules', (req, res) => {
  const chapters = readJsonSafe(CHAPTERS_PATH, []);
  
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
});

// GET /api/audios
app.get('/api/audios', async (req, res) => {
  try {
    const chapters = readJsonSafe(CHAPTERS_PATH, []);
    const moduleFilter = req.query.module;
    
    let filteredChapters = chapters;
    if (moduleFilter) {
      filteredChapters = chapters.filter(ch => ch.moduleId == moduleFilter);
    }
    
    const items = filteredChapters.map((ch, i) => ({
      id: ch.id,
      filename: `${ch.id}.mp3`,
      title: ch.title || `Chapter ${ch.id}`,
      audioUrl: ch.audioUrl,
      hasAudio: !!ch.audioUrl,
      tags: ch.tags || [],
      description: ch.description || ''
    }));
    
    res.json({ ok: true, source: 'local', items });
  } catch (err) {
    console.error('Failed to list audios:', err);
    res.status(500).json({ ok: false, error: 'Failed to list audios' });
  }
});

// POST /api/check-audio
app.post('/api/check-audio', (req, res) => {
  const { chapterId } = req.body;
  const chapters = readJsonSafe(CHAPTERS_PATH, []);
  
  const chapter = chapters.find(ch => ch.id === chapterId);
  
  // Read phone from .env (fallback to empty string if missing)
  const adminPhone = process.env.ADMIN_PHONE || ""; 

  if (chapter && chapter.audioUrl) {
    return res.json({ 
      hasAudio: true, 
      audioUrl: chapter.audioUrl,
      adminPhone: adminPhone // <--- Sending it here
    });
  }

  // Even if no audio, send the phone number so the "WhatsApp" button works
  res.json({ 
    hasAudio: false, 
    adminPhone 
  });
});


// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    return res.json({ 
      ok: true, 
      isAdmin: true,
      message: 'Admin authenticated',
      token: process.env.ADMIN_TOKEN || 'test-admin-secret-123'
    });
  }
  
  return res.status(401).json({ 
    ok: false, 
    message: 'Invalid credentials' 
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'varsity-audio-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    allowedOrigins: ['http://localhost:5173', 'https://varsity-audio-monorepo-cjpj.onrender.com']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// index.js - Add this new route

app.post('/api/request-manual', async (req, res) => {
  const { title, url } = req.body;
  const adminPhone = process.env.ADMIN_PHONE; // Ensure this is in your .env

  console.log(`📩 Received manual request for: ${title}`);

  try {
    // === OPTION A: Using CallMeBot (Free for Personal Use) ===
    // 1. Add phone number "+34 644 66 32 62" to your contacts.
    // 2. Send the message "I allow callmebot" to that number via WhatsApp.
    // 3. It will give you an API KEY (e.g., 123456).
    // 4. Add CALLMEBOT_KEY=123456 to your .env file.
    
    const apiKey = process.env.CALLMEBOT_KEY; 
    
    if (apiKey && adminPhone) {
        const message = `Audio Request Needed:\n\nTitle: ${title}\nLink: ${url}`;
        const encodedMsg = encodeURIComponent(message);
        
        // Use standard fetch (requires Node 18+) or install 'node-fetch'
        await fetch(`https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${encodedMsg}&apikey=${apiKey}`);
        
        console.log("✅ WhatsApp message sent via CallMeBot");
    } else {
        console.log("⚠️ CallMeBot Key missing - Logged to console only.");
    }

    // === OPTION B: Telegram Bot (Recommended/More Reliable) ===
    // If you prefer Telegram, replace the block above with a Telegram API call.

    res.json({ success: true, message: "Admin notified" });

  } catch (error) {
    console.error("Failed to send notification:", error);
    res.status(500).json({ success: false, error: "Failed to send notification" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for:`);
  console.log(`   • http://localhost:5173 (Vite)`);
  console.log(`   • https://varsity-audio-monorepo-cjpj.onrender.com`);
  console.log(`📚 API Endpoints:`);
  console.log(`   • GET  /health`);
  console.log(`   • GET  /api/chapters`);
  console.log(`   • GET  /api/modules`);
  console.log(`   • GET  /api/audios?module=12`);
  console.log(`   • POST /api/admin/login`);
});
