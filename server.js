require('dotenv').config();
const app = require('./src/app');
const https = require('https');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Self-ping mechanism to keep Render service alive
  // Only runs if RENDER_EXTERNAL_URL is available (provided by Render)
  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
      https.get(`${process.env.RENDER_EXTERNAL_URL}/`, (res) => {
        console.log(`[Self-Ping] Status: ${res.statusCode} at ${new Date().toISOString()}`);
      }).on('error', (err) => {
        console.error('[Self-Ping] Error:', err.message);
      });
    }, 10000); // Ping every 10 seconds
  }
});
