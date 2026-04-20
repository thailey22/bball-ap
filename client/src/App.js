import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('our');
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [file, setFile] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [isOurTeam, setIsOurTeam] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [activeTab, search]);

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/teams`);
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlayers = async () => {
    try {
      const type = activeTab === 'all' ? 'all' : activeTab;
      const res = await axios.get(`${API_URL}/players`, {
        params: { type, search }
      });
      setPlayers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teamName', teamName || file.name.replace(/\.[^/.]+$/, ''));
    formData.append('isOurTeam', isOurTeam);

    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchTeams();
      await fetchPlayers();
      setFile(null);
      setTeamName('');
      setIsOurTeam(false);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPlayers();
  };

  const fetchComments = async (playerId) => {
    try {
      const res = await axios.get(`${API_URL}/players/${playerId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (player) => {
    setSelectedPlayer(player);
    fetchComments(player.id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPlayer) return;

    try {
      await axios.post(`${API_URL}/players/${selectedPlayer.id}/comments`, {
        comment: newComment
      });
      setNewComment('');
      fetchComments(selectedPlayer.id);
    } catch (err) {
      alert('Failed to add comment: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API_URL}/comments/${commentId}`);
      if (selectedPlayer) fetchComments(selectedPlayer.id);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleOurTeam = async (team) => {
    try {
      await axios.put(`${API_URL}/teams/${team.id}/our-team`, {
        isOurTeam: !team.is_our_team
      });
      await fetchTeams();
      await fetchPlayers();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = ['Player', 'GP', 'PPG', 'RPG', 'APG', 'FG%', '3P%', 'FT%', 'SPG', 'BPG', 'MPG'];

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="basketball-icon">🏀</span>
          <h1>Bball AP</h1>
        </div>
        <nav className="tabs">
          <button
            className={activeTab === 'our' ? 'active' : ''}
            onClick={() => setActiveTab('our')}
          >
            Our Team
          </button>
          <button
            className={activeTab === 'other' ? 'active' : ''}
            onClick={() => setActiveTab('other')}
          >
            Other Teams
          </button>
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            Overall Teams
          </button>
        </nav>
      </header>

      <div className="upload-section">
        <form onSubmit={handleUpload}>
          <input
            type="text"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isOurTeam}
              onChange={(e) => setIsOurTeam(e.target.checked)}
            />
            Our Team
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button type="submit" disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload Stats'}
          </button>
        </form>
      </div>

      <div className="search-section">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search player or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="content">
        <div className="data-table">
          {players.length === 0 ? (
            <p className="empty">No data. Upload team stats to get started.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  {columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr
                    key={player.id}
                    onClick={() => handleRowClick(player)}
                    className={selectedPlayer?.id === player.id ? 'selected' : ''}
                  >
                    <td className="team-name">
                      {player.team_name}
                      {player.is_our_team === 1 && <span className="badge">OUR</span>}
                    </td>
                    <td>{player.player_name}</td>
                    <td>{player.games_played}</td>
                    <td className="stat-ppg">{player.points_per_game?.toFixed(1)}</td>
                    <td>{player.rebounds_per_game?.toFixed(1)}</td>
                    <td>{player.assists_per_game?.toFixed(1)}</td>
                    <td className="stat-fg">{player.fg_pct?.toFixed(1)}%</td>
                    <td className="stat-fg">{player.three_pt_pct?.toFixed(1)}%</td>
                    <td className="stat-fg">{player.ft_pct?.toFixed(1)}%</td>
                    <td>{player.steals_per_game?.toFixed(1)}</td>
                    <td>{player.blocks_per_game?.toFixed(1)}</td>
                    <td>{player.minutes_per_game?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="comments-panel">
          <h3>Player Notes</h3>
          {selectedPlayer ? (
            <>
              <div className="player-info">
                <h4>{selectedPlayer.player_name}</h4>
                <p>{selectedPlayer.team_name} | {selectedPlayer.games_played} GP | {selectedPlayer.points_per_game?.toFixed(1)} PPG</p>
              </div>
              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a note about this player..."
                />
                <button type="submit">Add Note</button>
              </form>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="empty">No notes yet.</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <p>{comment.comment}</p>
                      <span className="date">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="empty">Select a player to view/add notes.</p>
          )}
        </div>
      </div>

      <div className="teams-sidebar">
        <h3>Teams</h3>
        <ul className="teams-list">
          {teams.map(team => (
            <li key={team.id} className={team.is_our_team ? 'our-team' : ''}>
              <span>{team.name}</span>
              <button
                onClick={() => toggleOurTeam(team)}
                className="toggle-btn"
              >
                {team.is_our_team ? '★' : '☆'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;