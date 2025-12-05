// Vercel serverless function wrapper
const path = require('path');

// Import the built Express app
const app = require('../backend/dist/index.js');

// Export for Vercel
module.exports = app;
