// content.js

// 1. GLOBAL VARIABLES
let adminPhoneNumber = ""; 

// 2. INJECT THE UI
function injectAudioPlayer() {
  // Use a specific selector to find the correct header
  const header = document.querySelector('h1.chapter-title') || document.querySelector('h1');
  
  if (header && !document.getElementById('varsity-audio-btn')) {
    const btn = document.createElement('button');
    btn.id = 'varsity-audio-btn';
    btn.innerText = "⏳ Checking Audio...";
    btn.style.cssText = `
      display: inline-block; margin-top: 10px; padding: 10px 15px;
      background-color: #666; color: white; border: none;
      border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;
      transition: all 0.3s ease;
    `;
    
    header.parentNode.insertBefore(btn, header.nextSibling);
    
    // Start checking immediately
    checkAudioStatus();
  }
}

// 3. SCRAPE PAGE DATA
function getPageData() {
  const urlParts = window.location.pathname.split('/').filter(Boolean);
  const chapterId = urlParts[urlParts.length - 1]; 
  const title = document.querySelector('h1')?.innerText.trim() || "Unknown Chapter";
  
  // Try multiple selectors to find the content
  const contentEl = document.querySelector('.post-content') 
                 || document.querySelector('#content')
                 || document.querySelector('article')
                 || document.querySelector('main');
                 
  const text = contentEl ? contentEl.innerText.substring(0, 15000) : ""; 

  return { chapterId, title, text };
}

// 4. CHECK STATUS & UPDATE BUTTON
async function checkAudioStatus() {
  const btn = document.getElementById('varsity-audio-btn');
  // FIX: This line was missing in your previous code causing the ReferenceError
  const { chapterId } = getPageData(); 
  

  try {
    const response = await fetch('http://localhost:5010/api/check-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId })
    });

    const data = await response.json();

    // Store phone number if server sent it
    if (data.adminPhone) {
      adminPhoneNumber = data.adminPhone;
    }

    if (data.hasAudio) {
      setupPlayButton(btn, data.audioUrl);
    } else {
      setupGenerateButton(btn);
    }

  } catch (error) {
    console.error("Check failed:", error);
    btn.innerText = "❌ Server Offline";
    btn.style.backgroundColor = "#d32f2f";
  }
}

// 5. BUTTON STATES
function setupPlayButton(btn, url) {
  btn.innerText = "▶ Play Audio";
  btn.style.backgroundColor = "#377dff"; // Blue
  btn.onclick = () => {
    new Audio(url).play();
    btn.innerText = "🔊 Playing...";
  };
}

function setupGenerateButton(btn) {
  btn.innerText = "⚡ Generate Audio";
  btn.style.backgroundColor = "#ff9800"; // Orange
  btn.onclick = () => handleGenerate(btn);
}

// 6. HANDLE GENERATION & WHATSAPP FALLBACK
async function handleGenerate(btn) {
  const { chapterId, title, text } = getPageData();

  // If scraping fails, go straight to WhatsApp
  if (!text) {
    sendWhatsAppRequest(btn, title);
    return;
  }

  btn.innerText = "⚙️ Generating... (Please Wait)";
  btn.disabled = true;
  btn.style.backgroundColor = "#777";

  try {
    const response = await fetch('http://localhost:5010/api/admin/convert', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-admin-secret-123' 
      },
      body: JSON.stringify({ chapterId, title, text, moduleId: "3" })
    });

    const result = await response.json();

    if (result.success) {
      setupPlayButton(btn, result.audioUrl);
      btn.disabled = false;
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error("Generation error:", error);
    // On error, offer manual request
    sendWhatsAppRequest(btn, title);
  }
}

// 7. WHATSAPP HELPER
// content.js - Update this function

async function sendWhatsAppRequest(btn, title) {
  btn.innerText = "📨 Sending Request...";
  btn.disabled = true;
  btn.style.backgroundColor = "#777";

  try {
    const { chapterId } = getPageData(); // Ensure we get the ID

    // 1. Call your local backend
    const response = await fetch('http://localhost:5010/api/request-manual', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ...' // Add if you want security later
      },
      body: JSON.stringify({ 
        chapterId: chapterId,
        title: title,
        url: window.location.href
      })
    });

    const result = await response.json();

    if (result.success) {
      btn.innerText = "✅ Request Sent to Admin!";
      btn.style.backgroundColor = "#4caf50"; // Green
      btn.style.cursor = "default";
    } else {
      throw new Error(result.error || "Unknown Error");
    }

  } catch (error) {
    console.error("Notification failed:", error);
    btn.innerText = "❌ Failed. Retry?";
    btn.disabled = false;
    btn.style.backgroundColor = "#d32f2f";
    
    // Fallback: If API fails, you can still open the window manually
    btn.onclick = () => {
        const message = `Manual Request: ${title}\n${window.location.href}`;
        window.open(`https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };
  }
}

// Initialize
injectAudioPlayer();