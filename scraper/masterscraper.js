const puppeteer = require('puppeteer');
const fs = require('fs');

// FILES
const LINKS_FILE = 'chapterLinks.json';   // We save the URLs here
const CONTENT_FILE = 'chapterContent.json'; // We save the actual text here

// CONFIGURATION
const BASE_URL = 'https://zerodha.com/varsity/modules/';

// DELAYS (in milliseconds)
// Short delay for navigation (between modules)
const SHORT_DELAY = { min: 5000, max: 10000 }; 
// Long delay for reading chapters (The 5-10 minute safety buffer)
const LONG_DELAY = { min: 300000, max: 600000 }; 

const randomDelay = (min, max) => {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
};

async function scrape() {
  console.log("🚀 Starting Master Scraper...");
  
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // ============================================================
  // PHASE 1: GET ALL CHAPTER LINKS
  // ============================================================
  let allChapters = [];
  
  // Check if we already have the links file to skip Phase 1
  if (fs.existsSync(LINKS_FILE)) {
    console.log(`\n📂 Found existing ${LINKS_FILE}. Loading links...`);
    allChapters = JSON.parse(fs.readFileSync(LINKS_FILE));
  } else {
    console.log(`\nPhase 1: collecting Module URLs from ${BASE_URL}...`);
    
    // 1. Get List of Modules
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    const moduleUrls = await page.evaluate(() => {
        // Select the "View Module" links usually found in the grid
        const links = Array.from(document.querySelectorAll('a[href*="/module/"]'));
        return [...new Set(links.map(a => a.href))]; // Remove duplicates
    });
    console.log(`found ${moduleUrls.length} modules.`);

    // 2. Visit each Module and get Chapter URLs
    for (const modUrl of moduleUrls) {
        console.log(`   Visiting Module: ${modUrl}`);
        await page.goto(modUrl, { waitUntil: 'networkidle2' });
        
        // Extract Chapter Links using the HTML structure you provided
        const chapters = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('li.item h3.title a'));
            return items.map(a => ({
                title: a.innerText.trim(),
                url: a.href
            }));
        });

        // Add ID logic (e.g. create a unique ID based on the URL or index)
        chapters.forEach((chap, index) => {
            allChapters.push({
                // Create a temporary ID, we can refine this later
                id: `chap-${allChapters.length + 1}`,
                moduleUrl: modUrl,
                ...chap
            });
        });

        console.log(`   -> Found ${chapters.length} chapters.`);
        // Short wait between modules is fine
        await randomDelay(SHORT_DELAY.min, SHORT_DELAY.max);
    }

    // Save links to file
    fs.writeFileSync(LINKS_FILE, JSON.stringify(allChapters, null, 2));
    console.log(`\n✅ Phase 1 Complete. Saved ${allChapters.length} chapter links to ${LINKS_FILE}`);
  }

  // ============================================================
  // PHASE 2: SCRAPE CONTENT (The Slow Part)
  // ============================================================
  console.log(`\nPhase 2: Deep scraping content with human delays...`);
  
  let scrapedContent = {};
  if (fs.existsSync(CONTENT_FILE)) {
    scrapedContent = JSON.parse(fs.readFileSync(CONTENT_FILE));
  }

  for (let i = 0; i < allChapters.length; i++) {
    const chapter = allChapters[i];
    
    // Skip if already scraped
    if (scrapedContent[chapter.url]) {
        console.log(`Skipping [${i+1}/${allChapters.length}] (Already scraped)`);
        continue;
    }

    console.log(`\n📖 [${i+1}/${allChapters.length}] Scraping: ${chapter.title}`);
    
    try {
        await page.goto(chapter.url, { waitUntil: 'networkidle2', timeout: 90000 });

        const data = await page.evaluate(() => {
                    // 1. Get Title
                    // Try specific Varsity title class first, fallback to document title
                    const titleElement = document.querySelector('h1.large-title') || document.querySelector('h1'); 
                    const title = titleElement ? titleElement.innerText.trim() : document.title;

                    // 2. Get Content Container
                    // UPDATED SELECTOR: Based on your screenshot, content is in div.post
                    const contentContainer = document.querySelector('div.post'); 
                    
                    let blocks = [];

                    if (contentContainer) {
                        // UPDATED TAGS: Added 'h1', 'h2' and 'table' to ensure you don't miss headers or data
                        const elements = contentContainer.querySelectorAll('p, h1, h2, h3, h4, ul, ol, table');
                        
                        elements.forEach(el => {
                            const tag = el.tagName.toLowerCase();
                            const text = el.innerText.trim();
                            
                            // Only save if there is text (prevents empty lines)
                            if (text) {
                                blocks.push({ 
                                    type: tag, 
                                    text: text 
                                });
                            }
                        });
                    }
                    return { title, content: blocks };
                });

        // Save Data using URL as unique key to prevent duplicates
        scrapedContent[chapter.url] = {
            id: chapter.id,
            moduleUrl: chapter.moduleUrl,
            ...data
        };

        // Write immediately to save progress
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(scrapedContent, null, 2));
        console.log(`   -> Saved ${data.content.length} blocks.`);

    } catch (err) {
        console.error(`   ❌ Error scraping ${chapter.url}: ${err.message}`);
    }

    // THE BIG DELAY (5-10 Minutes)
    // Only wait if there are more chapters left
    if (i < allChapters.length - 1) {
        const waitTime = Math.floor(Math.random() * (LONG_DELAY.max - LONG_DELAY.min + 1)) + LONG_DELAY.min;
        const minutes = (waitTime / 60000).toFixed(1);
        console.log(`   ⏳ Sleeping for ${minutes} minutes...`);
        await new Promise(r => setTimeout(r, waitTime));
    }
  }

  await browser.close();
  console.log("\n🎉 All operations complete!");
}

scrape();