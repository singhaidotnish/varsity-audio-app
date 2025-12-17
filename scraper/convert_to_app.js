const fs = require('fs');

// CONFIGURATION
const INPUT_FILE = 'chapterContent.json';
const OUTPUT_FILE = 'src/data/chapterContent.js'; // Adjust path to where your React app lives

// Helper: Turn "introduction-to-stock-markets" into "Introduction To Stock Markets"
function formatModuleName(url) {
    if (!url) return "General Module";
    try {
        const parts = url.split('/').filter(p => p.length > 0);
        const slug = parts[parts.length - 1]; // Get last part of URL
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    } catch (e) {
        return "Unknown Module";
    }
}

function convert() {
    console.log("🚀 Converting Scraped Data to React App Format...");

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ Error: ${INPUT_FILE} not found.`);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    const convertedData = {};

    Object.values(rawData).forEach((chapter) => {
        // Use the ID from scraper (chap-1, chap-2) as the key
        const key = chapter.id; 

        convertedData[key] = {
            title: chapter.title,
            moduleName: formatModuleName(chapter.moduleUrl),
            // Placeholder audio (since scraper doesn't get audio)
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
            content: chapter.content
        };
    });

    // Create the final JS string
    const fileContent = `// Auto-generated from scraper data
export const chapterContent = ${JSON.stringify(convertedData, null, 2)};
`;

    // Ensure directory exists before writing
    const dir = OUTPUT_FILE.substring(0, OUTPUT_FILE.lastIndexOf('/'));
    if (dir && !fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, fileContent);
    console.log(`✅ Success! Data written to: ${OUTPUT_FILE}`);
    console.log(`   Total Chapters: ${Object.keys(convertedData).length}`);
}

convert();