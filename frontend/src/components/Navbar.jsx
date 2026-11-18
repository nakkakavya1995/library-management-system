import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = () => {
    return 'bg-light text-dark border';
  };

  return (
    <header className="dashboard-navbar">
      <div className="d-flex align-items-center">
        <h5 className="mb-0 fw-bold text-dark">
          <i className="bi bi-book-half me-2 text-primary"></i>
          Library Management System
        </h5>
      </div>

      <div className="d-flex align-items-center gap-3">
        {user && (
          <div className="d-flex align-items-center gap-2">
            <div className="text-end d-none d-sm-block">
              <div className="fw-semibold small">{user.name}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</div>
            </div>
            <span className={`badge ${getRoleBadgeClass(user.role)} text-capitalize px-2 py-1`}>
              {user.role}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          title="Sign out of the system"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span className="d-none d-md-inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
