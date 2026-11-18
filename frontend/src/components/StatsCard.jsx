import React from 'react';

const StatsCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  return (
    <div className="stat-card h-100">
      <div>
        <div className="text-muted small text-uppercase fw-semibold mb-1">{title}</div>
        <div className="h3 mb-0 fw-bold">{value}</div>
        {subtitle && <small className="text-muted">{subtitle}</small>}
      </div>
      <div className="stat-icon-wrapper bg-light text-dark border">
        <i className={`bi ${icon}`}></i>
      </div>
    </div>
  );
};

export default StatsCard;
