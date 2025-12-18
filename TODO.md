# Data Generation Workflow (Varsity Audio App)

This document outlines the step-by-step process to scrape, generate, and integrate data for the Varsity Audio App.

## 📂 Project Structure Assumed
- `scraper/` : Contains all Node.js scripts (`selectiveScraper.js`, `generate_app_data.js`, etc.)
- `frontend/` : The React application (`src/data/` is the target folder).

---

## 🚀 Phase 1: Update Link Database
*Goal: Ensure `chapterLinks.json` has the latest URLs for all modules (including Innerworth).*

1. **Check Existing Links:**
   - Open `chapterLinks.json` and ensure it is not empty.
   - Search for "Innerworth" (Module 12) or "Risk Management" (Module 9).

2. **Fetch Missing Links (If needed):**
   - If Innerworth is missing, run:
     ```bash
     node fetchInnerworth.js
     ```
   - If other standard modules are missing, check `fetchMissingLinks.js` or manually inject them (avoid running full `masterscraper.js` unless necessary to prevent IP bans).

---

## 🛠 Phase 2: Generate App Structure
*Goal: Create the `chapters.js` file that acts as the "Map" for the React app.*

1. **Run Generator:**
   ```bash
   node generate_app_data.js

2. Verify Output Format (Critical for React):

    Open the generated chapters.js (usually in scraper/src/data/ or root).

    Check: Does it start with export const chaptersData = ...?

    Fix: If it starts with module.exports = ..., change it to export const chaptersData = ... manually, or update generate_app_data.js to output ES6 syntax


## 📥 Phase 3: Scrape Content

*Goal: Download images, text, and tables for every chapter.*

    Prepare Network:

        Ensure stable internet.

        If you recently hit a 429 Error, switch to a mobile hotspot or wait 1 hour.

    Run Scraper:
    Bash

    >node selectiveScraper.js

    Note: This script runs in "Resume Mode". It will skip chapters already saved in chapterContent_selective.js.

    Tip: Adjust LONG_DELAY in the code if you need it to run faster (20s) or safer (5m).


## 📦 Phase 4: Integration (Move Files to Frontend)

*Goal: Move the generated data into the React app so the UI can read it.*

Run these commands from the scraper folder:

    Move Chapter List (The Map):
    Bash

cp src/data/chapters.js ../frontend/src/data/chapters.js

Move Content (The Data):
Bash

cp chapterContent_selective.js ../frontend/src/data/chapterContent.js    


## ✅ Phase 5: Verification

    Start Frontend:
    Bash

cd ../frontend
npm start

Check UI:

    Open Module 12.

    Verify that chapters appear in the list.

    Click a chapter and verify text/images load.