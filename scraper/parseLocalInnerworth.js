const cheerio = require('cheerio');
const fs = require('fs');

// FILES
const LINKS_FILE = 'chapterLinks.json';
const HTML_FILE = 'innerworth.html'; // Ensure your manual file is named this
const MODULE_URL = "https://zerodha.com/varsity/module/innerworth/";

function parseLocal() {
    console.log("🚀 Starting Offline Innerworth Parser...");

    // 1. Check if your manual HTML file exists
    if (!fs.existsSync(HTML_FILE)) {
        console.error(`❌ Error: '${HTML_FILE}' not found. Make sure you named the file correctly!`);
        return;
    }

    // 2. Load existing links
    let allLinks = [];
    if (fs.existsSync(LINKS_FILE)) {
        allLinks = JSON.parse(fs.readFileSync(LINKS_FILE));
    }

    // 3. Read the local HTML file
    console.log(`Reading local file: ${HTML_FILE}`);
    const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
    const $ = cheerio.load(htmlContent);
    const newChapters = [];

    // 4. Parse the specific table structure you shared
    // Structure: table.innerworth -> tbody -> tr -> td -> a
    $('table.innerworth tbody tr').each((i, row) => {
        const anchor = $(row).find('td a').first();
        
        if (anchor.length) {
            const title = anchor.text().trim();
            const url = anchor.attr('href');

            if (title && url) {
                newChapters.push({
                    title: title,
                    url: url,
                    moduleUrl: MODULE_URL
                });
            }
        }
    });

    console.log(`Found ${newChapters.length} Innerworth chapters in the file.`);

    // 5. Merge and Save (Prevent Duplicates)
    let addedCount = 0;
    newChapters.forEach(chap => {
        if (!allLinks.some(link => link.url === chap.url)) {
            allLinks.push(chap);
            addedCount++;
        }
    });

    fs.writeFileSync(LINKS_FILE, JSON.stringify(allLinks, null, 2));
    console.log(`✅ Success! Added ${addedCount} new chapters to ${LINKS_FILE}`);
}

parseLocal();