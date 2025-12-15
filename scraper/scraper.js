const puppeteer = require('puppeteer');
const fs = require('fs');

// 1. Define the list of chapters you want to scrape
// (Ideally, you'd scrape the module page first to get these links, but here is a manual list for testing)
const chaptersToScrape = [
  {
    id: "7-1",
    url: "https://zerodha.com/varsity/chapter/introduction-setting-the-context/"
  },
  {
    id: "7-2",
    url: "https://zerodha.com/varsity/chapter/basics/"
  },
  // ... Add more URLs here
];

const OUTPUT_FILE = 'chapterContent.json';


async function scrape() {
  console.log("🚀 Starting scraper...");
  
  // Launch browser
  // 'headless: false' opens a visible window so you can see it working (and it looks more 'human' to some checks)
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();

  // Set a standard User Agent (Looks like Chrome on Windows)
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Load existing data if we are resuming
  let scrapedData = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    scrapedData = JSON.parse(fs.readFileSync(OUTPUT_FILE));
  }

  for (const chapter of chaptersToScrape) {
    if (scrapedData[chapter.id]) {
      console.log(`Skipping ${chapter.id} (Already scraped)`);
      continue;
    }

    console.log(`\n📖 Visiting: ${chapter.url}`);

    try {
      // Goto page and wait until network is idle (page fully loaded)
      await page.goto(chapter.url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Extract content
      const data = await page.evaluate(() => {
        const title = document.querySelector('h1.large-title')?.innerText.trim() || "Unknown Title";
        const moduleName = document.querySelector('.breadcrumbs a:nth-child(2)')?.innerText.trim() || "Unknown Module";
        
        // Varsity content is usually in 'div.single-post-content'
        const contentContainer = document.querySelector('.single-post-content');
        let blocks = [];

        if (contentContainer) {
          // Select all paragraphs, headers, and list items
          const elements = contentContainer.querySelectorAll('p, h3, ul, ol');
          
          elements.forEach(el => {
            const tag = el.tagName.toLowerCase();
            const text = el.innerText.trim();
            
            if (text) {
              blocks.push({ type: tag, text: text });
            }
          });
        }
        return { title, moduleName, content: blocks };
      });

      // Save to our object
      scrapedData[chapter.id] = {
        id: chapter.id,
        ...data
      };

      // Write to file immediately (so if it crashes, we don't lose progress)
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scrapedData, null, 2));
      console.log(`✅ Scraped: ${data.title} (${data.content.length} blocks)`);

    } catch (error) {
      console.error(`❌ Failed to scrape ${chapter.id}:`, error.message);
    }

    // HUMAN BEHAVIOR: Wait random time between 2 to 5 minutes
    // 2 minutes = 120,000 ms
    // 5 minutes = 300,000 ms
    const minTime = 120000; 
    const maxTime = 300000;
    const waitTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    
    // Convert to minutes for logging so you can track it easily
    const waitTimeInMinutes = (waitTime / 60000).toFixed(2);
    
    console.log(`⏳ Reading... (Sleeping for ${waitTimeInMinutes} minutes)`);
    
    // Pass the calculated waitTime to your delay function
    // Note: Ensure your randomDelay function (defined earlier in the script) uses this exact value or just use setTimeout directly here.
    await new Promise(resolve => setTimeout(resolve, waitTime));

  }

  await browser.close();
  console.log("\n🎉 Done! All chapters saved to", OUTPUT_FILE);
}

scrape();