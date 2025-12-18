const puppeteer = require('puppeteer');
const fs = require('fs');

// The missing modules you need to add
const MISSING_MODULES = [
    "https://zerodha.com/varsity/module/innerworth/",
    "https://zerodha.com/varsity/module/risk-management/"
];

const LINKS_FILE = 'chapterLinks.json';

async function fetchMissing() {
    console.log("🚀 Starting Mini-Link Fetcher for missing modules...");
    
    // 1. Load existing links so we don't lose them
    let existingLinks = [];
    if (fs.existsSync(LINKS_FILE)) {
        existingLinks = JSON.parse(fs.readFileSync(LINKS_FILE));
        console.log(`Loaded ${existingLinks.length} existing links.`);
    }

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let newLinksCount = 0;

    for (const modUrl of MISSING_MODULES) {
        console.log(`\nVisiting: ${modUrl}`);
        try {
            await page.goto(modUrl, { waitUntil: 'networkidle2' });
            
            // Scrape the chapters from this module page
            const chapters = await page.evaluate((modUrl) => {
                const items = Array.from(document.querySelectorAll('a[href*="/chapter/"]'));
                // Filter to ensure we only get valid chapter links, not unrelated footer links
                const uniqueLinks = [];
                const seenUrls = new Set();

                items.forEach(a => {
                    const url = a.href;
                    // basic validation to ensure it's a chapter link
                    if (url.includes('/varsity/chapter/') && !seenUrls.has(url)) {
                        seenUrls.add(url);
                        uniqueLinks.push({
                            title: a.innerText.trim() || "Untitled Chapter",
                            url: url,
                            moduleUrl: modUrl // Important for the generator script
                        });
                    }
                });
                return uniqueLinks;
            }, modUrl);

            console.log(`   -> Found ${chapters.length} chapters.`);
            
            // Add to our master list (avoiding duplicates)
            chapters.forEach(chap => {
                const isDuplicate = existingLinks.some(el => el.url === chap.url);
                if (!isDuplicate) {
                    existingLinks.push(chap);
                    newLinksCount++;
                }
            });

        } catch (err) {
            console.error(`   ❌ Failed to load ${modUrl}: ${err.message}`);
        }
        
        // Short safety delay (10 seconds)
        await new Promise(r => setTimeout(r, 10000));
    }

    await browser.close();

    // 2. Save the updated file
    fs.writeFileSync(LINKS_FILE, JSON.stringify(existingLinks, null, 2));
    console.log(`\n✅ Success! Added ${newLinksCount} new links.`);
    console.log(`Total links in ${LINKS_FILE}: ${existingLinks.length}`);
}

fetchMissing();