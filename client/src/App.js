import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

function App() {
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/data`);
      setData(res.data);
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

    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchData();
      setFile(null);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const fetchComments = async (rowId) => {
    try {
      const res = await axios.get(`${API_URL}/data/${rowId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    fetchComments(row.id);
    setShowComments(row.id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedRow) return;

    try {
      await axios.post(`${API_URL}/data/${selectedRow.id}/comments`, {
        comment: newComment
      });
      setNewComment('');
      fetchComments(selectedRow.id);
    } catch (err) {
      alert('Failed to add comment: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API_URL}/comments/${commentId}`);
      if (selectedRow) fetchComments(selectedRow.id);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id') : [];

  return (
    <div className="app">
      <header className="header">
        <h1>Bball AP</h1>
      </header>

      <div className="upload-section">
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button type="submit" disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload Excel'}
          </button>
        </form>
      </div>

      <div className="content">
        <div className="data-table">
          {data.length === 0 ? (
            <p className="empty">No data. Upload an Excel file to get started.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className={selectedRow?.id === row.id ? 'selected' : ''}
                  >
                    {columns.map(col => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="comments-panel">
          <h3>Comments</h3>
          {selectedRow ? (
            <>
              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                />
                <button type="submit">Add</button>
              </form>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="empty">No comments yet.</p>
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
            <p className="empty">Select a row to view/add comments.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;