const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'database.db');
let db;

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS data_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (row_id) REFERENCES data_rows(id)
    );
  `);
  saveDb();
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    db.run('DELETE FROM comments');
    db.run('DELETE FROM data_rows');

    const stmt = db.prepare('INSERT INTO data_rows (row_data) VALUES (?)');
    for (const row of data) {
      stmt.run([JSON.stringify(row)]);
    }
    stmt.free();

    fs.unlinkSync(req.file.path);
    saveDb();

    res.json({ message: 'Data uploaded successfully', count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data', (req, res) => {
  try {
    const rows = db.exec('SELECT * FROM data_rows');
    if (rows.length === 0) {
      return res.json([]);
    }
    const columns = rows[0].columns;
    const values = rows[0].values;
    const data = values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return { id: obj.id, ...JSON.parse(obj.row_data) };
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data/:rowId/comments', (req, res) => {
  try {
    const rows = db.exec(
      `SELECT * FROM comments WHERE row_id = ${req.params.rowId} ORDER BY created_at DESC`
    );
    if (rows.length === 0) {
      return res.json([]);
    }
    const columns = rows[0].columns;
    const comments = rows[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data/:rowId/comments', (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }
    db.run(
      'INSERT INTO comments (row_id, comment) VALUES (?, ?)',
      [req.params.rowId, comment]
    );
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    saveDb();
    res.json({ id, row_id: req.params.rowId, comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/comments/:id', (req, res) => {
  try {
    db.run(`DELETE FROM comments WHERE id = ${req.params.id}`);
    saveDb();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});