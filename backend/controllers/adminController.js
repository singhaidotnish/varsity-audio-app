// backend/controllers/adminController.js
const fs = require('fs');
const path = require('path');

// Paths to your database files
const DB_DIR = path.join(__dirname, '../db');
const CHAPTERS_FILE = path.join(DB_DIR, 'chapters.json');
const MODULES_FILE = path.join(DB_DIR, 'modules.json');

// Ensure DB folder exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// ==========================================
// 🛠️ HELPER FUNCTIONS (These fix your error!)
// ==========================================

// Helper to read JSON safely
const readJson = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
        return [];
    }
};

// Helper to write JSON safely
const writeJson = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Error writing ${filePath}:`, err);
    }
};

// ==========================================
// 📤 EXPORTS
// ==========================================

// 1. Export the Helpers (This is what admin.js is looking for)
exports.readChapters = async () => readJson(CHAPTERS_FILE);
exports.writeChapters = async (data) => writeJson(CHAPTERS_FILE, data);
exports.readModules = async () => readJson(MODULES_FILE);
exports.writeModules = async (data) => writeJson(MODULES_FILE, data);


// 2. Export the API Controller Methods
exports.getDashboardStats = async (req, res) => {
    const chapters = readJson(CHAPTERS_FILE);
    const modules = readJson(MODULES_FILE);
    res.json({
        success: true,
        stats: {
            totalChapters: chapters.length,
            totalModules: modules.length,
            convertedCount: chapters.filter(c => c.hasAudio).length
        }
    });
};

exports.getAllChapters = async (req, res) => {
    const chapters = readJson(CHAPTERS_FILE);
    res.json({ success: true, chapters });
};

// Needed if you use the old routes
exports.createChapter = async (req, res) => {
    const chapters = readJson(CHAPTERS_FILE);
    const newChapter = { id: Date.now().toString(), ...req.body };
    chapters.push(newChapter);
    writeJson(CHAPTERS_FILE, chapters);
    res.json({ success: true, chapter: newChapter });
};

// Needed so the file doesn't crash on other imports
exports.updateChapterInDB = async (chapterId, updates) => {
    const chapters = readJson(CHAPTERS_FILE);
    const index = chapters.findIndex(c => c.id === chapterId);
    if (index !== -1) {
        chapters[index] = { ...chapters[index], ...updates };
        writeJson(CHAPTERS_FILE, chapters);
    }
};