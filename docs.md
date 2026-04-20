# Bball AP - Documentation

## Overview
Bball AP is a web application for tracking and analyzing basketball team and player statistics. Upload Excel/CSV files containing player stats, organize teams (your team vs. opponents), search players, and add notes/comments to individual player entries.

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
│   │   ├── App.css      # Styling (basketball theme)
│   │   └── index.js    # React entry point
│   └── package.json
└── server/               # Express backend
    ├── index.js         # Server with team/player stats API
    ├── database.db    # SQLite database
    └── uploads/      # Uploaded files (temp)
```

## Database Schema

### Tables

**teams**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Team name (unique) |
| is_our_team | INTEGER | 1 if "our team", 0 otherwise |

**player_stats**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| team_id | INTEGER | Foreign key to teams |
| player_name | TEXT | Player name |
| games_played | INTEGER | GP (games played) |
| points_per_game | REAL | PPG |
| rebounds_per_game | REAL | RPG |
| assists_per_game | REAL | APG |
| fg_pct | REAL | FG% (field goal percentage) |
| three_pt_pct | REAL | 3P% (three-point percentage) |
| ft_pct | REAL | FT% (free throw percentage) |
| steals_per_game | REAL | SPG |
| blocks_per_game | REAL | BPG |
| minutes_per_game | REAL | MPG |
| row_data | TEXT | Full row data as JSON |

**comments**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| player_id | INTEGER | Foreign key to player_stats |
| comment | TEXT | Note text |
| created_at | TEXT | Timestamp |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|--------------|
| `/api/upload` | POST | Upload Excel file with team stats |
| `/api/teams` | GET | Get all teams |
| `/api/players` | GET | Get players (filter by `type`: our/other/all, `team` id, `search` text) |
| `/api/players/:id/comments` | GET | Get comments for a player |
| `/api/players/:id/comments` | POST | Add comment to player |
| `/api/comments/:id` | DELETE | Delete a comment |
| `/api/teams/:id/our-team` | PUT | Toggle "our team" status |

## Excel File Format

Expected columns (case-insensitive):
- **Player** - Player name
- **GP** - Games played
- **PPG** - Points per game
- **RPG** - Rebounds per game
- **APG** - Assists per game
- **FG%** - Field goal percentage
- **3P%** - Three-point percentage
- **FT%** - Free throw percentage
- **SPG** - Steals per game
- **BPG** - Blocks per game
- **MPG** - Minutes per game

## Frontend Features

### Tabs
- **Our Team** - Players from teams marked as "our team"
- **Other Teams** - Players from opponent teams
- **Overall Teams** - All players across all teams

### Search
Search by player name or team name.

### Upload Form
- Enter team name
- Check "Our Team" checkbox if uploading your own team
- Select Excel/CSV file
- Click "Upload Stats"

### Player Notes
Click any player row to view/add notes about that player.

### Teams Sidebar
Shows all teams with toggle to mark/unmark as "our team".

## UI Theme

**Colors**:
- Background: #0f0f23 (dark navy)
- Header: #1a1a2e to #16213e gradient
- Accent: #ff6b35 (orange - basketball color)
- Secondary: #4ecdc4 (teal)

**Stats Highlighting**:
- PPG: Orange (#ff6b35)
- FG%/3P%/FT%: Teal (#4ecdc4)

**Layout**:
- Dark theme with basketball court aesthetic
- Tabbed navigation for Our Team / Other Teams / Overall Teams
- Fixed sidebar showing all teams
- Split view: stats table + player notes panel

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