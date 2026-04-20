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
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_our_team INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      games_played INTEGER,
      points_per_game REAL,
      rebounds_per_game REAL,
      assists_per_game REAL,
      fg_pct REAL,
      three_pt_pct REAL,
      ft_pct REAL,
      steals_per_game REAL,
      blocks_per_game REAL,
      minutes_per_game REAL,
      row_data TEXT NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES player_stats(id)
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
    db.run('DELETE FROM player_stats');
    db.run('DELETE FROM teams');

    const teamName = req.body.teamName || 'Unknown Team';
    const isOurTeam = req.body.isOurTeam === 'true' ? 1 : 0;

    db.run('INSERT INTO teams (name, is_our_team) VALUES (?, ?)', [teamName, isOurTeam]);
    const teamResult = db.exec('SELECT last_insert_rowid() as id');
    const teamId = teamResult[0].values[0][0];

    const columns = ['Player', 'GP', 'PPG', 'RPG', 'APG', 'FG%', '3P%', 'FT%', 'SPG', 'BPG', 'MPG'];
    const columnMap = {
      'Player': 'player_name',
      'GP': 'games_played',
      'PPG': 'points_per_game',
      'RPG': 'rebounds_per_game',
      'APG': 'assists_per_game',
      'FG%': 'fg_pct',
      '3P%': 'three_pt_pct',
      'FT%': 'ft_pct',
      'SPG': 'steals_per_game',
      'BPG': 'blocks_per_game',
      'MPG': 'minutes_per_game'
    };

    const stmt = db.prepare(`INSERT INTO player_stats 
      (team_id, player_name, games_played, points_per_game, rebounds_per_game, assists_per_game, 
       fg_pct, three_pt_pct, ft_pct, steals_per_game, blocks_per_game, minutes_per_game, row_data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const row of data) {
      const rowData = {};
      columns.forEach(col => {
        rowData[columnMap[col]] = row[col];
      });
      stmt.run([
        teamId,
        row['Player'] || '',
        row['GP'] || 0,
        row['PPG'] || 0,
        row['RPG'] || 0,
        row['APG'] || 0,
        row['FG%'] || 0,
        row['3P%'] || 0,
        row['FT%'] || 0,
        row['SPG'] || 0,
        row['BPG'] || 0,
        row['MPG'] || 0,
        JSON.stringify(row)
      ]);
    }
    stmt.free();

    fs.unlinkSync(req.file.path);
    saveDb();

    res.json({ message: 'Data uploaded successfully', teamId, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams', (req, res) => {
  try {
    const rows = db.exec('SELECT * FROM teams ORDER BY is_our_team DESC, name');
    if (rows.length === 0) {
      return res.json([]);
    }
    const columns = rows[0].columns;
    const teams = rows[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/players', (req, res) => {
  try {
    const { team, type, search } = req.query;
    let query = `
      SELECT ps.*, t.name as team_name, t.is_our_team 
      FROM player_stats ps 
      JOIN teams t ON ps.team_id = t.id 
      WHERE 1=1
    `;
    const params = [];

    if (type === 'our') {
      query += ' AND t.is_our_team = 1';
    } else if (type === 'other') {
      query += ' AND t.is_our_team = 0';
    } else if (team) {
      query += ' AND t.id = ?';
      params.push(team);
    }

    if (search) {
      query += ' AND (ps.player_name LIKE ? OR t.name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY ps.points_per_game DESC';

    const rows = db.exec(query, params);
    if (rows.length === 0) {
      return res.json([]);
    }
    const columns = rows[0].columns;
    const players = rows[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      obj.row_data = JSON.parse(obj.row_data || '{}');
      return obj;
    });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/players/:playerId/comments', (req, res) => {
  try {
    const rows = db.exec(
      `SELECT * FROM comments WHERE player_id = ${req.params.playerId} ORDER BY created_at DESC`
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

app.post('/api/players/:playerId/comments', (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }
    db.run(
      'INSERT INTO comments (player_id, comment) VALUES (?, ?)',
      [req.params.playerId, comment]
    );
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    saveDb();
    res.json({ id, player_id: req.params.playerId, comment });
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

app.put('/api/teams/:id/our-team', (req, res) => {
  try {
    const isOurTeam = req.body.isOurTeam ? 1 : 0;
    db.run('UPDATE teams SET is_our_team = ? WHERE id = ?', [isOurTeam, req.params.id]);
    saveDb();
    res.json({ message: 'Team updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});