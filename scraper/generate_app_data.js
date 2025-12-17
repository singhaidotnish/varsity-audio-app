const fs = require('fs');
const path = require('path');

// CONFIGURATION
const INPUT_FILE = 'chapterContent.json';
// We try to detect if you are in the root or inside frontend
const BASE_PATH = fs.existsSync('frontend/src/data') ? 'frontend/src/data' : 'src/data';

// OUTPUT FILES (Exact names your components import)
const OUTPUT_LIST_FILE = path.join(BASE_PATH, 'chapters.js');        // For ModuleDetailPage
const OUTPUT_CONTENT_FILE = path.join(BASE_PATH, 'chapterContent.js'); // For ChapterPage

// MAP ZERODHA URL SLUGS TO MODULE IDS
const MODULE_MAP = {
    "introduction-to-stock-markets": 1,
    "technical-analysis": 2,
    "fundamental-analysis": 3,
    "futures-trading": 4,
    "option-theory": 5,
    "option-strategies": 6,
    "markets-and-taxation": 7,
    "currency-commodity-government-securities": 8,
    "risk-management-trading-psychology": 9,
    "trading-systems": 10,
    "personal-finance": 11,
    "innerworth": 12
};

function getModuleId(url) {
    if (!url) return 99;
    const parts = url.split('/').filter(p => p.length > 0);
    const slug = parts[parts.length - 1]; 
    return MODULE_MAP[slug] || 99;
}

function generate() {
    console.log("🚀 Starting Data Generation for React App...");

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ Error: ${INPUT_FILE} not found. Run the scraper first!`);
        return;
    }

    // 1. Read Raw Data
    const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    // 2. Group Chapters by Module
    // Structure: { 1: [chapObj, chapObj], 2: [chapObj] ... }
    const moduleBuckets = {};

    Object.values(rawData).forEach(chapter => {
        const modId = getModuleId(chapter.moduleUrl);
        if (!moduleBuckets[modId]) moduleBuckets[modId] = [];
        moduleBuckets[modId].push(chapter);
    });

    // 3. Prepare the two data structures
    const chaptersData = {};   // For chapters.js
    const chapterContent = {}; // For chapterContent.js

    Object.keys(moduleBuckets).forEach(modId => {
        // Sort chapters (optional, but good if scraper grabbed them out of order)
        // Assuming scraper grabbed in order, we just map them.
        const chapters = moduleBuckets[modId];

        // A. Build the List for ModuleDetailPage
        chaptersData[modId] = chapters.map((chap, index) => ({
            id: index + 1, // This creates the '1', '2', '3' chapter index
            title: chap.title,
            description: "Read this chapter to learn about " + chap.title, // Placeholder description
            slug: `chapter-${index + 1}`
        }));

        // B. Build the Content for ChapterPage (Key format: "ModuleID-ChapterIndex")
        chapters.map((chap, index) => {
            const key = `${modId}-${index + 1}`; // e.g., "1-1"
            
            chapterContent[key] = {
                title: chap.title,
                moduleName: `Module ${modId}`, 
                audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                content: chap.content
            };
        });
    });

    // 4. Ensure Directory Exists
    if (!fs.existsSync(BASE_PATH)){
        fs.mkdirSync(BASE_PATH, { recursive: true });
        console.log(`📂 Created directory: ${BASE_PATH}`);
    }

    // 5. Write "chapters.js"
    const listContent = `// Auto-generated for ModuleDetailPage.jsx
export const chaptersData = ${JSON.stringify(chaptersData, null, 2)};
`;
    fs.writeFileSync(OUTPUT_LIST_FILE, listContent);
    console.log(`✅ Created: ${OUTPUT_LIST_FILE}`);

    // 6. Write "chapterContent.js"
    const detailContent = `// Auto-generated for ChapterPage.jsx
export const chapterContent = ${JSON.stringify(chapterContent, null, 2)};
`;
    fs.writeFileSync(OUTPUT_CONTENT_FILE, detailContent);
    console.log(`✅ Created: ${OUTPUT_CONTENT_FILE}`);
}

generate();