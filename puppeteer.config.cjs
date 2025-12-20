const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Tells Puppeteer to install Chrome in a specific cache folder Render can access
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};