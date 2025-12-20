const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'backend/db/chapters.json');

console.log("🔍 Checking Database at:", DB_PATH);

try {
    if (!fs.existsSync(DB_PATH)) {
        console.error("❌ File not found!");
        process.exit(1);
    }

    const rawData = fs.readFileSync(DB_PATH, 'utf-8');
    const chapters = JSON.parse(rawData);

    console.log(`✅ JSON is valid.`);
    console.log(`📚 Total Chapters: ${chapters.length}`);

    // Check the first 3 chapters for required fields
    console.log("\n--- Sample Check (First 3) ---");
    chapters.slice(0, 3).forEach((chap, i) => {
        console.log(`[${i}] ID: ${chap.id}`);
        console.log(`    Title: ${chap.title}`);
        console.log(`    Content Length: ${chap.content ? chap.content.length : 0} chars`);
        
        if (!chap.id || !chap.content) {
            console.warn(`    ⚠️ WARNING: Missing ID or Content in chapter index ${i}`);
        }
    });

    console.log("\n✅ Database seems healthy.");

} catch (err) {
    console.error("❌ Error reading DB:", err.message);
}