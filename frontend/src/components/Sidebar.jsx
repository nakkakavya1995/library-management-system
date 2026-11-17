import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [usersMenuOpen, setUsersMenuOpen] = useState(false);
  const [booksMenuOpen, setBooksMenuOpen] = useState(false);

  // Automatically keep submenus open if we are on those paths
  useEffect(() => {
    if (
      location.pathname.startsWith('/admin/users') ||
      location.pathname.startsWith('/admin/librarians') ||
      location.pathname.startsWith('/admin/students')
    ) {
      setUsersMenuOpen(true);
    }
  }, [location.pathname]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isUsersActive =
    location.pathname === '/admin/users' ||
    location.pathname === '/admin/librarians' ||
    location.pathname === '/admin/students';

  const isBooksActive =
    location.pathname === '/admin/books';

  // Admin Navigation strictly matching reference design
  const renderAdminNav = () => (
    <>
      <div className="sidebar-menu-list">
        {/* 1. Dashboard */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-item-icon">
            <i className="bi bi-house-door-fill"></i>
          </span>
          <span className="sidebar-item-text">Dashboard</span>
        </NavLink>

        {/* 2. Books */}
        <div>
          <div
            className={`sidebar-pill-item ${isBooksActive ? 'active' : ''}`}
            onClick={() => {
              navigate('/admin/books');
              setBooksMenuOpen(!booksMenuOpen);
            }}
            role="button"
            tabIndex={0}
          >
            <span className="sidebar-item-icon">
              <i className="bi bi-book-half"></i>
            </span>
            <span className="sidebar-item-text">Books</span>
            <i
              className={`bi bi-chevron-right sidebar-chevron ${booksMenuOpen ? 'chevron-rotated' : ''
                }`}
            ></i>
          </div>
        </div>

        {/* 3. Users */}
        <div>
          <div
            className={`sidebar-pill-item ${isUsersActive ? 'active' : ''}`}
            onClick={() => {
              navigate('/admin/users');
              setUsersMenuOpen(!usersMenuOpen);
            }}
            role="button"
            tabIndex={0}
          >
            <span className="sidebar-item-icon">
              <i className="bi bi-people-fill"></i>
            </span>
            <span className="sidebar-item-text">Users</span>
            <i
              className={`bi bi-chevron-right sidebar-chevron ${usersMenuOpen ? 'chevron-rotated' : ''
                }`}
            ></i>
          </div>

          {/* Submenu for Users */}
          {usersMenuOpen && (
            <div className="sidebar-submenu">
              <NavLink
                to="/admin/users"
                end
                className={({ isActive }) =>
                  `sidebar-sublink ${isActive ? 'sub-active' : ''}`
                }
              >
                <i className="bi bi-dot me-1"></i> All Users
              </NavLink>
              <NavLink
                to="/admin/librarians"
                className={({ isActive }) =>
                  `sidebar-sublink ${isActive ? 'sub-active' : ''}`
                }
              >
                <i className="bi bi-dot me-1"></i> Manage Librarians
              </NavLink>
              <NavLink
                to="/admin/students"
                className={({ isActive }) =>
                  `sidebar-sublink ${isActive ? 'sub-active' : ''}`
                }
              >
                <i className="bi bi-dot me-1"></i> Manage Students
              </NavLink>
            </div>
          )}
        </div>

        {/* 4. Reservations */}
        <NavLink
          to="/admin/reservations"
          className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-item-icon">
            <i className="bi bi-bookmark-fill"></i>
          </span>
          <span className="sidebar-item-text">Reservations</span>
        </NavLink>

        {/* 6. Fines */}
        <NavLink
          to="/admin/fines"
          className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-item-icon fs-5 fw-bold" style={{ lineHeight: 1 }}>
            ₹
          </span>
          <span className="sidebar-item-text">Fines</span>
        </NavLink>

        {/* 7. Reports */}
        <NavLink
          to="/admin/reports"
          className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-item-icon">
            <i className="bi bi-bar-chart-fill"></i>
          </span>
          <span className="sidebar-item-text">Reports</span>
        </NavLink>

        {/* 9. Settings */}
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-item-icon">
            <i className="bi bi-gear-fill"></i>
          </span>
          <span className="sidebar-item-text">Settings</span>
        </NavLink>
      </div>

      {/* 10. Logout at bottom */}
      <div className="sidebar-bottom-action">
        <button
          onClick={handleLogout}
          className="sidebar-pill-item sidebar-logout-btn w-100"
        >
          <span className="sidebar-item-icon">
            <i className="bi bi-box-arrow-right"></i>
          </span>
          <span className="sidebar-item-text">Logout</span>
        </button>
      </div>
    </>
  );

  // Librarian Navigation matching reference design
  const renderLibrarianNav = () => (
    <>
      <div className="sidebar-menu-list">
        <NavLink to="/librarian" end className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-house-door-fill"></i></span>
          <span className="sidebar-item-text">Dashboard</span>
        </NavLink>
        <NavLink to="/librarian/books" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-book-half"></i></span>
          <span className="sidebar-item-text">Book Management</span>
        </NavLink>
        <NavLink to="/librarian/circulation" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-arrow-left-right"></i></span>
          <span className="sidebar-item-text">Issue & Return</span>
        </NavLink>
        <NavLink to="/librarian/reservations" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-bookmark-fill"></i></span>
          <span className="sidebar-item-text">Reservations</span>
        </NavLink>
        <NavLink to="/librarian/renewals" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-arrow-repeat"></i></span>
          <span className="sidebar-item-text">Renewal Requests</span>
        </NavLink>
        <NavLink to="/librarian/users" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-people-fill"></i></span>
          <span className="sidebar-item-text">User Management</span>
        </NavLink>
        <NavLink to="/librarian/fines" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon fs-5 fw-bold" style={{ lineHeight: 1 }}>₹</span>
          <span className="sidebar-item-text">Fines & Penalties</span>
        </NavLink>
        <NavLink to="/librarian/settings" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-gear-fill"></i></span>
          <span className="sidebar-item-text">Settings</span>
        </NavLink>
      </div>

      <div className="sidebar-bottom-action">
        <button onClick={handleLogout} className="sidebar-pill-item sidebar-logout-btn w-100">
          <span className="sidebar-item-icon"><i className="bi bi-box-arrow-right"></i></span>
          <span className="sidebar-item-text">Logout</span>
        </button>
      </div>
    </>
  );

  // Student Navigation strictly matching reference design
  const renderStudentNav = () => (
    <>
      <div className="sidebar-menu-list">
        <NavLink to="/student" end className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-house-door-fill"></i></span>
          <span className="sidebar-item-text">Dashboard</span>
        </NavLink>
        <NavLink to="/student/catalog" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-book-half"></i></span>
          <span className="sidebar-item-text">Book Catalog</span>
        </NavLink>
        <NavLink to="/student/borrowed" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-journal-bookmark-fill"></i></span>
          <span className="sidebar-item-text">Borrowed Books</span>
        </NavLink>
        <NavLink to="/student/reservations" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-bookmark-fill"></i></span>
          <span className="sidebar-item-text">Reservations</span>
        </NavLink>
        <NavLink to="/student/fines" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon fs-5 fw-bold" style={{ lineHeight: 1 }}>₹</span>
          <span className="sidebar-item-text">Fines & Fees</span>
        </NavLink>
        <NavLink to="/student/history" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-clock-history"></i></span>
          <span className="sidebar-item-text">Borrowing History</span>
        </NavLink>
        <NavLink to="/student/reviews" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-chat-text-fill"></i></span>
          <span className="sidebar-item-text">Book Reviews</span>
        </NavLink>
        <NavLink to="/student/settings" className={({ isActive }) => `sidebar-pill-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><i className="bi bi-gear-fill"></i></span>
          <span className="sidebar-item-text">Settings</span>
        </NavLink>
      </div>

      <div className="sidebar-bottom-action">
        <button onClick={handleLogout} className="sidebar-pill-item sidebar-logout-btn w-100">
          <span className="sidebar-item-icon"><i className="bi bi-box-arrow-right"></i></span>
          <span className="sidebar-item-text">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <aside className="custom-theme-sidebar">
      {/* Brand Logo Header */}
      <div className="sidebar-brand-container">
        <div className="sidebar-brand-icon">
          <i className="bi bi-book-half"></i>
        </div>
        <div className="sidebar-brand-text">
          <h4 className="sidebar-brand-title">Library</h4>
          <span className="sidebar-brand-sub">Management System</span>
        </div>
      </div>

      {/* Navigation Body */}
      <nav className="sidebar-nav-container">
        {user.role === 'admin' && renderAdminNav()}
        {user.role === 'librarian' && renderLibrarianNav()}
        {user.role === 'student' && renderStudentNav()}
      </nav>
    </aside>
  );
};

export default Sidebar;
