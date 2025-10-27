import React from 'react';
import './Stats.css';

const Stats = ({ total, scanned, absent }) => {
  const remaining = total - scanned - absent;

  return (
    <div className="stats-container">
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <span className="stat-value">{total}</span>
          </div>
        </div>

        <div className="stat-card scanned">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Scanned</h3>
            <span className="stat-value">{scanned}</span>
          </div>
        </div>

        <div className="stat-card absent">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>Absent</h3>
            <span className="stat-value">{absent}</span>
          </div>
        </div>

        <div className="stat-card remaining">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Remaining</h3>
            <span className="stat-value">{remaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
