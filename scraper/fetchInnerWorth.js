const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const LINKS_FILE = 'chapterLinks.json';
const INNERWORTH_URL = "https://zerodha.com/varsity/module/innerworth/";

async function fetchInnerworth() {
    console.log("🚀 Starting Specialized Innerworth Fetcher...");

    // 1. Load existing links so we don't lose data
    let allLinks = [];
    if (fs.existsSync(LINKS_FILE)) {
        allLinks = JSON.parse(fs.readFileSync(LINKS_FILE));
    }

    try {
        console.log(`Visiting: ${INNERWORTH_URL}`);
        
        // Fetch the HTML directly
        const { data } = await axios.get(INNERWORTH_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(data);
        const newChapters = [];

        // 2. TARGET THE SPECIFIC TABLE FROM YOUR SOURCE CODE
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
                        moduleUrl: INNERWORTH_URL
                    });
                }
            }
        });

        console.log(`\nFound ${newChapters.length} Innerworth chapters.`);

        // 3. Merge and Save (Prevent Duplicates)
        let addedCount = 0;
        newChapters.forEach(chap => {
            if (!allLinks.some(link => link.url === chap.url)) {
                allLinks.push(chap);
                addedCount++;
            }
        });

        fs.writeFileSync(LINKS_FILE, JSON.stringify(allLinks, null, 2));
        console.log(`✅ Success! Added ${addedCount} new chapters to ${LINKS_FILE}`);

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

fetchInnerworth();