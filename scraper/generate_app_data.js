const fs = require('fs');
const path = require('path');

// CONFIGURATION
const LINKS_FILE = 'chapterLinks.json'; 
const BASE_PATH = fs.existsSync('frontend/src/data') ? 'frontend/src/data' : 'src/data';
const OUTPUT_LIST_FILE = path.join(BASE_PATH, 'chapters.js'); 

// MAP ZERODHA URL SLUGS TO MODULE IDS
// Updated based on the specific URLs you provided
const MODULE_MAP = {
    "introduction-to-stock-markets": 1,
    "technical-analysis": 2,
    "fundamental-analysis": 3,
    "futures-trading": 4,
    "option-theory": 5,
    "option-strategies": 6,
    "markets-and-taxation": 7,
    "currency-commodity-government-securities": 8,
    
    // UPDATED: Matches https://zerodha.com/varsity/module/risk-management/
    "risk-management": 9,  

    "trading-systems": 10,
    "personal-finance": 11,
    
    // UPDATED: Matches https://zerodha.com/varsity/module/innerworth/
    "innerworth": 12       
};

function getModuleId(url) {
    if (!url) return 99;
    
    // 1. Clean the URL (remove trailing slash)
    const cleanUrl = url.replace(/\/$/, ''); 
    
    // 2. Get the last part (the slug)
    const parts = cleanUrl.split('/');
    const slug = parts[parts.length - 1]; 
    
    // 3. Check the map
    if (MODULE_MAP[slug]) {
        return MODULE_MAP[slug];
    }

    // 4. Fallback: Check if the URL *contains* the key (Partial match)
    // This catches cases like "innerworth-mind" vs "innerworth"
    for (const [key, id] of Object.entries(MODULE_MAP)) {
        if (cleanUrl.includes(key)) return id;
    }

    return 99;
}

function generate() {
    console.log("🚀 Generating chapters.js from chapterLinks.json...");

    if (!fs.existsSync(LINKS_FILE)) {
        console.error(`❌ Error: ${LINKS_FILE} not found. Run Master Scraper (Phase 1) first!`);
        return;
    }

    const rawLinks = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
    
    // Group by Module
    const moduleBuckets = {};

    rawLinks.forEach(linkObj => {
        const modId = getModuleId(linkObj.moduleUrl);
        
        // Log warnings for debugging (so you know if something is still missing)
        if (modId === 99) {
            // console.warn(`⚠ Unmapped URL: ${linkObj.moduleUrl}`);
        } else {
            if (!moduleBuckets[modId]) moduleBuckets[modId] = [];
            moduleBuckets[modId].push(linkObj);
        }
    });

    // Build final object
    const chaptersData = {};
    const sortedKeys = Object.keys(moduleBuckets).sort((a, b) => parseInt(a) - parseInt(b));

    sortedKeys.forEach(modId => {
        const chapters = moduleBuckets[modId];
        console.log(`   Mapped Module ${modId}: ${chapters.length} chapters`);

        chaptersData[modId] = chapters.map((chap, index) => ({
            id: index + 1,
            title: chap.title,
            description: `Read this chapter to learn about ${chap.title}`, 
            slug: `chapter-${index + 1}`,
            url: chap.url 
        }));
    });

    if (!fs.existsSync(BASE_PATH)){
        fs.mkdirSync(BASE_PATH, { recursive: true });
    }

    // Save as module.exports for Node usage
    const fileContent = `// Auto-generated for React
    export const chaptersData = ${JSON.stringify(chaptersData, null, 2)};
    `;

    fs.writeFileSync(OUTPUT_LIST_FILE, fileContent);
    console.log(`✅ Success! Updated chapters.js`);
}

generate();