const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'ringtones_db.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable browser and server-side HTTP caching for all API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

function getRingtones() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveRingtones(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/list', (req, res) => {
  res.json(getRingtones());
});

app.post('/api/add', (req, res) => {
  try {
    const ringtones = getRingtones();
    const newItem = {
      id: Date.now(),
      name: req.body.name || "Untitled Ringtone",
      url: req.body.url || "https://www.zedge.net/ringtones",
      used: req.body.used === true || req.body.used === "true",
      dateUsed: req.body.dateUsed || ""
    };
    ringtones.push(newItem);
    saveRingtones(ringtones);
    res.json({ success: true, ringtones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/update', (req, res) => {
  try {
    const { id, field, value } = req.body;
    let ringtones = getRingtones();
    ringtones = ringtones.map(item => {
      if (item.id === Number(id)) {
        return { ...item, [field]: value };
      }
      return item;
    });
    saveRingtones(ringtones);
    res.json({ success: true, ringtones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/delete', (req, res) => {
  try {
    const id = Number(req.body.id);
    const ringtones = getRingtones().filter(item => item.id !== id);
    saveRingtones(ringtones);
    res.json({ success: true, ringtones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
          try {
            // Cache-busting timestamp query parameter
            const res = await fetch('/api/list?_t=' + Date.now(), { cache: 'no-store' });
            const data = await res.json();
            renderTable(data);
          } catch (err) {
            alert('Failed to load ringtones: ' + err.message);
          }
        }

        function renderTable(data) {
          const tbody = document.getElementById('ringtoneTable');
          tbody.innerHTML = '';

          if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No ringtones saved yet. Add one above!</td></tr>';
            return;
          }

          data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = \`
              <td><input type="text" value="\${item.name}" onblur="updateItem(\${item.id}, 'name', this.value)"></td>
              <td>
                <input type="text" value="\${item.url}" onblur="updateItem(\${item.id}, 'url', this.value)" style="width: 70%;">
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

          try {
            const res = await fetch('/api/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, url, used, dateUsed })
            });
            const result = await res.json();
            if (result.error) throw new Error(result.error);

            document.getElementById('newName').value = '';
            document.getElementById('newUrl').value = '';
            document.getElementById('newDate').value = '';
            renderTable(result.ringtones);
          } catch (err) {
            alert('Error adding ringtone: ' + err.message);
          }
        }

        async function updateItem(id, field, value) {
          try {
            const res = await fetch('/api/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, field, value })
            });
            const result = await res.json();
            if (result.error) throw new Error(result.error);
          } catch (err) {
            alert('Error updating item: ' + err.message);
          }
        }

        async function deleteItem(id) {
          if (!confirm('Delete this ringtone?')) return;

          try {
            const res = await fetch('/api/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id })
            });
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            renderTable(result.ringtones);
          } catch (err) {
            alert('Error deleting item: ' + err.message);
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
