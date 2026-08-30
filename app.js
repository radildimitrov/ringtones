const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to load ringtones from JSON file
function loadRingtones() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = [
      { id: 1, name: "Synthwave Pulse", url: "https://www.zedge.net/ringtones", used: true, dateUsed: "2026-08-30" },
      { id: 2, name: "Acoustic Chill", url: "https://www.zedge.net/ringtones", used: false, dateUsed: "" }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Helper to save ringtones to JSON file
function saveRingtones(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API: Get all ringtones
app.get('/api/ringtones', (req, res) => {
  res.json(loadRingtones());
});

// API: Add new ringtone
app.post('/api/ringtones', (req, res) => {
  const ringtones = loadRingtones();
  const newEntry = {
    id: Date.now(),
    name: req.body.name || "Untitled Ringtone",
    url: req.body.url || "https://www.zedge.net/ringtones",
    used: req.body.used === true || req.body.used === "true",
    dateUsed: req.body.dateUsed || ""
  };
  ringtones.push(newEntry);
  saveRingtones(ringtones);
  res.json({ success: true, item: newEntry });
});

// API: Update an existing ringtone
app.put('/api/ringtones/:id', (req, res) => {
  const id = Number(req.params.id);
  let ringtones = loadRingtones();
  ringtones = ringtones.map(r => {
    if (r.id === id) {
      return {
        id: r.id,
        name: req.body.name ?? r.name,
        url: req.body.url ?? r.url,
        used: req.body.used ?? r.used,
        dateUsed: req.body.dateUsed ?? r.dateUsed
      };
    }
    return r;
  });
  saveRingtones(ringtones);
  res.json({ success: true });
});

// API: Delete a ringtone
app.delete('/api/ringtones/:id', (req, res) => {
  const id = Number(req.params.id);
  const ringtones = loadRingtones().filter(r => r.id !== id);
  saveRingtones(ringtones);
  res.json({ success: true });
});

// UI Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Daily Ringtone Tracker</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; max-width: 1000px; margin: 0 auto; }
        h1 { margin-bottom: 1.5rem; }
        .card { background: #1e293b; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #334155; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: left; }
        th { background-color: #334155; color: #94a3b8; }
        input[type="text"], input[type="date"], select {
          background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 10px; border-radius: 4px; width: 90%;
        }
        button { background: #0284c7; color: white; border: none; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        button:hover { background: #0369a1; }
        button.delete { background: #ef4444; }
        button.delete:hover { background: #dc2626; }
        .add-form { display: grid; grid-template-columns: 2fr 3fr 1fr 1fr auto; gap: 10px; align-items: center; }
        a.external { color: #38bdf8; text-decoration: none; margin-left: 5px; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <h1>🎵 Ringtone Manager</h1>

      <div class="card">
        <h3>Add New Ringtone</h3>
        <div class="add-form">
          <input type="text" id="newName" placeholder="Ringtone Name">
          <input type="text" id="newUrl" placeholder="Zedge Link (https://...)">
          <select id="newUsed">
            <option value="false">⏳ In Queue</option>
            <option value="true">✅ Used</option>
          </select>
          <input type="date" id="newDate">
          <button onclick="addRingtone()">Add</button>
        </div>
      </div>

      <div class="card">
        <h3>Saved Ringtones</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Zedge Link</th>
              <th>Status</th>
              <th>Date Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="ringtoneTable"></tbody>
        </table>
      </div>

      <script>
        async function fetchRingtones() {
          const res = await fetch('/api/ringtones');
          const data = await res.json();
          const tbody = document.getElementById('ringtoneTable');
          tbody.innerHTML = '';

          data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = \`
              <td><input type="text" value="\${item.name}" onchange="updateItem(\${item.id}, 'name', this.value)"></td>
              <td>
                <input type="text" value="\${item.url}" onchange="updateItem(\${item.id}, 'url', this.value)" style="width: 70%;">
                <a href="\${item.url}" target="_blank" class="external">🔗</a>
              </td>
              <td>
                <select onchange="updateItem(\${item.id}, 'used', this.value === 'true')">
                  <option value="false" \${!item.used ? 'selected' : ''}>⏳ In Queue</option>
                  <option value="true" \${item.used ? 'selected' : ''}>✅ Used</option>
                </select>
              </td>
              <td><input type="date" value="\${item.dateUsed || ''}" onchange="updateItem(\${item.id}, 'dateUsed', this.value)"></td>
              <td><button class="delete" onclick="deleteItem(\${item.id})">Delete</button></td>
            \`;
            tbody.appendChild(row);
          });
        }

        async function addRingtone() {
          const name = document.getElementById('newName').value;
          const url = document.getElementById('newUrl').value;
          const used = document.getElementById('newUsed').value;
          const dateUsed = document.getElementById('newDate').value;

          await fetch('/api/ringtones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url, used, dateUsed })
          });

          document.getElementById('newName').value = '';
          document.getElementById('newUrl').value = '';
          document.getElementById('newDate').value = '';
          fetchRingtones();
        }

        async function updateItem(id, field, value) {
          await fetch('/api/ringtones/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
          });
        }

        async function deleteItem(id) {
          if (confirm('Delete this ringtone?')) {
            await fetch('/api/ringtones/' + id, { method: 'DELETE' });
            fetchRingtones();
          }
        }

        fetchRingtones();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
