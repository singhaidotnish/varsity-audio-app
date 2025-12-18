const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 1. IMPORT DATA
const { chaptersData } = require('./src/data/chapters'); 

// 2. PRIORITY LIST
const PRIORITY_MODULES = ["12", "10", "9", "6", "5", "4", "3", "2", "1"];

// 3. NEW FASTER DELAY: 20 to 40 seconds
// (This is usually safe if you aren't doing thousands of pages at once)
const LONG_DELAY = { min: 30000, max: 50000 }; 

let selectiveContent = {};

// Helper: Random Delay
const randomDelay = (min, max) => {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
};

// Helper: Image Extractor
function getBestImage($, imgElement) {
    const srcset = $(imgElement).attr('srcset');
    if (srcset) {
        const candidates = srcset.split(',').map(entry => {
            const parts = entry.trim().split(/\s+/);
            return { url: parts[0], width: parts[1] ? parseInt(parts[1]) : 0 };
        });
        candidates.sort((a, b) => b.width - a.width);
        return candidates[0].url;
    }
    return $(imgElement).attr('src');
}

async function scrapeSelective() {
    console.log(`Starting Selective Scrape (Resume Mode)...`);

    // 1. LOAD EXISTING PROGRESS
    // We try to load the file we've been writing to.
    if (fs.existsSync('chapterContent_selective.js')) {
        const raw = fs.readFileSync('chapterContent_selective.js', 'utf8');
        // Extract the JSON part from the "export const..." string
        const jsonStr = raw.replace('export const chapterContent = ', '').replace(';', '');
        try {
            selectiveContent = JSON.parse(jsonStr);
            console.log(`Loaded ${Object.keys(selectiveContent).length} existing chapters. Resuming...`);
        } catch (e) {
            console.log("Could not parse existing file, starting fresh (or backup corrupted).");
        }
    }

    for (const moduleId of PRIORITY_MODULES) {
        const chapters = chaptersData[moduleId];
        if (!chapters) continue;

        console.log(`\n--- Module ${moduleId} ---`);

        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            const uniqueId = `${moduleId}-${chapter.id}`;
            const url = chapter.url; 

            // --- RESUME LOGIC: SKIP IF EXISTS ---
            if (selectiveContent[uniqueId]) {
                console.log(`   ⏭ Skipping ${uniqueId} (Already scraped)`);
                continue;
            }

            if (!url) {
                console.log(`   ⚠ No URL for ${uniqueId}`);
                continue;
            }

            console.log(`   📖 Scraping ${uniqueId}: ${chapter.title}`);

            try {
                // 1. Fetch Page with User-Agent
                const { data } = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    }
                });

                const $ = cheerio.load(data);
                const contentContainer = $('.post, .chapter-body, .single-chapter'); 
                const blocks = [];

                if (contentContainer.length) {
                    contentContainer.children().each((idx, el) => {
                        const element = $(el);
                        
                        // Images
                        const imgTag = element.find('img').length ? element.find('img') : (element.is('img') ? element : null);
                        if (imgTag && imgTag.length) {
                            const bestSrc = getBestImage($, imgTag);
                            if (bestSrc) blocks.push({ type: 'image', src: bestSrc, alt: imgTag.attr('alt') || 'image' });
                        }
                        // Tables
                        else if (element.is('table') || element.find('table').length) {
                            const tableEl = element.is('table') ? element : element.find('table');
                            blocks.push({ type: 'table', html: $.html(tableEl) });
                        }
                        // Headers
                        else if (['h1', 'h2', 'h3', 'h4'].includes(element[0].name)) {
                            blocks.push({ type: element[0].name, text: element.text().trim() });
                        }
                        // Text
                        else {
                            const text = element.text().trim();
                            if (text.length > 2 && !text.toLowerCase().includes('chapter')) {
                                blocks.push({ type: 'p', text: text });
                            }
                        }
                    });

                    // Store Data
                    selectiveContent[uniqueId] = {
                        title: chapter.title,
                        moduleName: `Module ${moduleId}`,
                        content: blocks
                    };

                    // Save Immediately
                    const output = `export const chapterContent = ${JSON.stringify(selectiveContent, null, 2)};`;
                    fs.writeFileSync('chapterContent_selective.js', output);
                    console.log(`      ✔ Saved (Blocks: ${blocks.length})`);
                }

            } catch (err) {
                if (err.response && err.response.status === 429) {
                     console.error(`      ❌ 429 Rate Limited. Waiting 2 minutes...`);
                     await randomDelay(120000, 120000); // Wait 2 mins if blocked
                } else {
                     console.error(`      ❌ Error: ${err.message}`);
                }
            }
            
            // --- DELAY LOGIC (20-40 Seconds) ---
            if (i < chapters.length - 1) {
                const waitTime = Math.floor(Math.random() * (LONG_DELAY.max - LONG_DELAY.min + 1)) + LONG_DELAY.min;
                const sec = (waitTime / 1000).toFixed(0);
                console.log(`   ⏳ Sleeping for ${sec} seconds...`);
                await new Promise(r => setTimeout(r, waitTime));
            }
        }
    }
    console.log(`\n🎉 All Done!`);
}

scrapeSelective();