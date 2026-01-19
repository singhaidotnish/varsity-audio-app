// content.js

// ==========================================
// ⚙️ CONFIGURATION
// ==========================================

// OPTION 1: Development (Use this now while testing on your laptop)
const API_BASE_URL = "http://localhost:5010";

// OPTION 2: Production (Uncomment this later when you deploy to Render)
// const API_BASE_URL = "https://your-app-name.onrender.com";

// ==========================================

// 1. INJECT THE UI
function injectAudioPlayer() {
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

// 2. SCRAPE PAGE DATA
function getPageData() {
  const urlParts = window.location.pathname.split('/').filter(Boolean);
  const chapterId = urlParts[urlParts.length - 1]; 
  const title = document.querySelector('h1')?.innerText.trim() || "Unknown Chapter";
  
  const contentEl = document.querySelector('.post-content') 
                 || document.querySelector('#content')
                 || document.querySelector('article')
                 || document.querySelector('main');
                 
  const text = contentEl ? contentEl.innerText.substring(0, 15000) : ""; 

  return { chapterId, title, text };
}

// 3. CHECK STATUS
async function checkAudioStatus() {
  const btn = document.getElementById('varsity-audio-btn');
  const { chapterId } = getPageData(); 

  try {
    // Uses the API_BASE_URL defined at the top
    const response = await fetch(`${API_BASE_URL}/api/check-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId })
    });

    const data = await response.json();

    if (data.hasAudio) {
      setupPlayButton(btn, data.audioUrl);
    } else if (localStorage.getItem(`request_sent_${chapterId}`) === "true") {
      btn.innerText = "✅ Request Already Sent";
      btn.style.backgroundColor = "#4caf50";
      btn.disabled = true;
    } else {
      setupGenerateButton(btn);
    }
  } catch (error) {
    console.error("Check failed:", error);
    btn.innerText = "❌ Server Offline";
    btn.style.backgroundColor = "#d32f2f";
  }
}

// 4. BUTTON STATES
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

// 5. GENERATE HANDLER
async function handleGenerate(btn) {
  const { chapterId, title, text } = getPageData();

  // If scraping fails, notify admin via Telegram
  if (!text) {
    sendAdminRequest(btn, title); 
    return;
  }

  btn.innerText = "⚙️ Generating... (Please Wait)";
  btn.disabled = true;
  btn.style.backgroundColor = "#777";

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/convert`, {
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
    // If auto-generation fails, fallback to manual request
    sendAdminRequest(btn, title);
  }
}

// 6. MANUAL REQUEST HANDLER (Uses Telegram via Backend)
async function sendAdminRequest(btn, title) {
  btn.innerText = "📨 Notifying Admin...";
  btn.disabled = true;
  btn.style.backgroundColor = "#777";

  try {
    const { chapterId } = getPageData();

    // Sends signal to backend -> backend sends Telegram message
    console.log("+++ API base URL:", API_BASE_URL); // Debugging line    
    const response = await fetch(`${API_BASE_URL}/api/request-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chapterId: chapterId,
        title: title,
        url: window.location.href
      })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem(`request_sent_${chapterId}`, "true");
      btn.innerText = "✅ Admin Notified via Telegram!";
      btn.style.backgroundColor = "#4caf50"; // Green
      btn.style.cursor = "default";
    } else {
      throw new Error(result.error || "Unknown Error");
    }

  } catch (error) {
    console.error("Notification failed:", error);
    btn.innerText = "❌ Connection Failed";
    btn.disabled = false;
    btn.style.backgroundColor = "#d32f2f";
    
    // Since we are on Telegram now, we can't easily open a "wa.me" link.
    // Just showing the error state is safer.
  }
}

// Initialize
injectAudioPlayer();