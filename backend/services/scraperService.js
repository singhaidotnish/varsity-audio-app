// backend/services/scraperService.js
const puppeteer = require('puppeteer');

async function scrapeChapter(url) {
  console.log(`🕷️ Scraping URL: ${url}`);
  
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for Render/Linux
  });
  
  try {
    const page = await browser.newPage();
    // Set User Agent so Zerodha doesn't block us
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const data = await page.evaluate(() => {
      // 1. Get Title
      const titleEl = document.querySelector('h1.large-title') || document.querySelector('h1');
      const title = titleEl ? titleEl.innerText.trim() : document.title;

      // 2. Get Content
      // We grab all paragraphs from the post content div
      const contentContainer = document.querySelector('div.post') 
                            || document.querySelector('#content')
                            || document.querySelector('article');
      
      let text = "";
      if (contentContainer) {
          // Get all paragraphs and headers
          const elements = contentContainer.querySelectorAll('p, h1, h2, h3, li');
          elements.forEach(el => {
              if (el.innerText.trim()) {
                  text += el.innerText.trim() + ".\n\n"; // Add periods for better TTS pauses
              }
          });
      }
      
      return { title, text };
    });

    if (!data.text) throw new Error("No text found on this page!");

    // Generate a Chapter ID from the URL (e.g., "introduction-to-options")
    const urlParts = url.split('/').filter(Boolean);
    const chapterId = urlParts[urlParts.length - 1];

    return { 
        chapterId, 
        title: data.title, 
        text: data.text 
    };

  } finally {
    await browser.close();
  }
}

module.exports = { scrapeChapter };