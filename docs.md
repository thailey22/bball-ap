# Bball AP - Documentation

## Overview
Bball AP is a web application for tracking and analyzing basketball team game statistics. Upload Excel/CSV files containing team game stats, organize teams (your team vs. opponents), search games, and add notes/comments to individual game entries.

## Tech Stack
- **Frontend**: React (Create React App)
- **Backend**: Node.js + Express
- **Database**: SQLite (sql.js)
- **File Parsing**: xlsx library for Excel files

## Project Structure
```
bball-ap/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js        # Main application component
│   │   ├── App.css       # Styling (basketball theme)
│   │   └── index.js      # React entry point
│   └── package.json
└── server/               # Express backend
    ├── index.js          # Server with team/game stats API
    ├── database.db      # SQLite database
    └── uploads/         # Uploaded files (temp)
```

## Database Schema

### Tables

**teams**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Team name (unique) |
| is_our_team | INTEGER | 1 if "our team", 0 otherwise |

**game_stats**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| team_id | INTEGER | Foreign key to teams |
| game_date | TEXT | Date played |
| fg_pct | REAL | FG% (field goal percentage) |
| points_per_possession | REAL | Points per possession |
| points_allowed | REAL | Points allowed per game |
| row_data | TEXT | Full row data as JSON |

**comments**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| game_id | INTEGER | Foreign key to game_stats |
| comment | TEXT | Note text |
| created_at | TEXT | Timestamp |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|--------------|
| `/api/upload` | POST | Upload Excel file with team stats |
| `/api/teams` | GET | Get all teams |
| `/api/games` | GET | Get games (filter by `type`: our/other/all, `team` id, `search` text) |
| `/api/games/:id/comments` | GET | Get comments for a game |
| `/api/games/:id/comments` | POST | Add comment to game |
| `/api/comments/:id` | DELETE | Delete a comment |
| `/api/teams/:id/our-team` | PUT | Toggle "our team" status |

## Excel File Format

Expected columns (case-insensitive):
- **Team** - Team name (optional, if using upload form)
- **Date Played** / **Date** - Game date
- **FG%** / **fg** - Field goal percentage
- **Points Per Possession** / **PPP** / **Points Per Pos** - Points per possession
- **Points Allowed Per Game** / **Pts Allowed** / **Points Allowed** - Points allowed per game

## Frontend Features

### Tabs
- **Our Team** - Games from teams marked as "our team"
- **Other Teams** - Games from opponent teams
- **Overall Teams** - All games across all teams

### Search
Search by team name.

### Upload Form
- Enter team name
- Check "Our Team" checkbox if uploading your own team
- Select Excel/CSV file
- Click "Upload Stats"

### Game Notes
Click any game row to view/add notes about that game.

### Teams Sidebar
Shows all teams with toggle to mark/unmark as "our team".

## UI Theme

**Colors**:
- Background: #0f0f23 (dark navy)
- Header: #1a1a2e to #16213e gradient
- Accent: #ff6b35 (orange - basketball color)
- Secondary: #4ecdc4 (teal)

**Stats Highlighting**:
- FG%: Teal (#4ecdc4)
- Points/Pos: Orange (#ff6b35)
- Points Allowed: Red (#ff4444)

**Layout**:
- Dark theme with basketball court aesthetic
- Tabbed navigation for Our Team / Other Teams / Overall Teams
- Fixed sidebar showing all teams
- Split view: stats table + game notes panel

## Running the App

### Development (separate terminals)

**Terminal 1 (Server)**:
```bash
cd server
npm install
npm start
```

**Terminal 2 (Client)**:
```bash
cd client
npm install
npm start
```

Client runs on port 3000, server on port 5000.

### Windows Setup

Run both commands in separate terminals:
```bash
cd server
npm install
npm start
```

```bash
cd client
npm install
npm start
```

## Dependencies

### Client (package.json)
- react, react-dom
- react-scripts 5.0.1
- axios

### Server (package.json)
- express
- cors
- sql.js
- multer
- xlsx

## Updating the App

After making code changes, restart the server and client:
```bash
# Kill existing processes (Ctrl+C in each terminal)
# Then restart as shown above
```

## Data Reset

To clear all data and start fresh, delete the database file:
```bash
rm server/database.db
```
Then restart the server (it will recreate the database automatically).