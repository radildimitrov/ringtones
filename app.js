const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Temporary sample data for your Zedge ringtones
const ringtones = [
  { name: "Synthwave Pulse", url: "https://www.zedge.net/ringtones", dateUsed: "2026-08-30", used: true },
  { name: "Acoustic Chill", url: "https://www.zedge.net/ringtones", dateUsed: null, used: false }
];

app.get('/', (req, res) => {
  const rows = ringtones.map(r => `
    <tr>
      <td><strong>${r.name}</strong></td>
      <td><a href="${r.url}" target="_blank">View on Zedge</a></td>
      <td>${r.used ? '✅ Used' : '⏳ In Queue'}</td>
      <td>${r.dateUsed || '—'}</td>
    </tr>
  `).join('');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Daily Ringtone Tracker</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; }
        table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px 16px; border-bottom: 1px solid #334155; text-align: left; }
        th { background-color: #334155; }
        a { color: #38bdf8; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>🎵 Daily Ringtone Tracker</h1>
      <table>
        <tr><th>Ringtone Name</th><th>Zedge Link</th><th>Status</th><th>Date Used</th></tr>
        ${rows}
      </table>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server active on port ${PORT}`);
});
