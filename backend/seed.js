// backend/seed.js
const fs = require('fs').promises;
const path = require('path');

const CHAPTERS_PATH = path.join(__dirname, 'db', 'chapters.json');
const MODULES_PATH = path.join(__dirname, 'db', 'modules.json');

async function seedDatabase() {
  try {
    // Sample modules
    const modules = [
      {
        id: "1",
        name: "Getting Started with Stocks",
        description: "Begin your stock market journey with fundamental concepts",
        color: "#4CAF50",
        chapterCount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "4",
        name: "Technical Analysis",
        description: "Learn to read charts and identify trading opportunities",
        color: "#2196F3",
        chapterCount: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "12",
        name: "Trading Psychology",
        description: "Master the psychological aspects of trading",
        color: "#FF9800",
        chapterCount: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    await fs.writeFile(MODULES_PATH, JSON.stringify(modules, null, 2));
    console.log('✅ Modules seeded successfully');

    // Sample chapters
    const existingChapters = await fs.readFile(CHAPTERS_PATH, 'utf-8')
      .then(data => JSON.parse(data))
      .catch(() => []);

    // Update chapters with proper module references
    const updatedChapters = existingChapters.map(chapter => ({
      ...chapter,
      audioStatus: chapter.audioUrl ? 'converted' : 'pending',
      audioDuration: chapter.audioUrl ? 120 : null,
      audioUpdatedAt: new Date().toISOString(),
      moduleId: String(chapter.moduleId), // Ensure string type
      moduleDescription: chapter.moduleDescription || ''
    }));

    await fs.writeFile(CHAPTERS_PATH, JSON.stringify(updatedChapters, null, 2));
    console.log('✅ Chapters updated successfully');

    console.log('🎉 Database seeding complete!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

seedDatabase();