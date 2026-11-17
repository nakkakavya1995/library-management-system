import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async (isBackground = false) => {
    try {
      if (!isBackground && !stats) {
        setLoading(true);
      }
      const [statsRes, issuesRes, resRes] = await Promise.all([
        api.get('/reports/stats').catch((err) => {
          console.warn('[StudentDashboard] stats fetch notice:', err.message);
          return { data: { stats: null } };
        }),
        api.get('/issues/my-borrowings?status=issued').catch((err) => {
          console.warn('[StudentDashboard] borrowings fetch notice:', err.message);
          return { data: { issues: [] } };
        }),
        api.get('/reservations/my-reservations').catch((err) => {
          console.warn('[StudentDashboard] reservations fetch notice:', err.message);
          return { data: { reservations: [] } };
        })
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (issuesRes.data?.issues !== undefined) setBorrowedBooks(issuesRes.data.issues || []);
      if (resRes.data?.reservations !== undefined) setReservations(resRes.data.reservations || []);
    } catch (err) {
      if (err.response?.status === 401) return;
      setError(err.response?.data?.message || 'Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Safety fallback: Never keep student dashboard locked on full-screen loading spinner
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    fetchDashboardData(false);

    // Auto-refresh silently when student tab gains focus or becomes visible
    const handleSync = () => fetchDashboardData(true);
    window.addEventListener('focus', handleSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleSync();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Silent background sync interval (15s) without tearing down dashboard with a spinner
    const interval = setInterval(handleSync, 15000);

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const handleCancelReservation = async (id) => {
    try {
      await api.put(`/reservations/${id}/cancel`);
      setSuccess('Reservation cancelled successfully');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/student/catalog');
    }
  };

  const activeReservations = reservations.filter((r) => ['pending', 'approved'].includes(r.status));
  const dueSoonCount = borrowedBooks.filter((b) => {
    if (b.isOverdue) return true;
    const diff = new Date(b.dueDate).getTime() - new Date().getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return daysLeft <= 2;
  }).length;

  const totalUnpaidFine = borrowedBooks.reduce((sum, b) => sum + (b.isOverdue ? b.currentFine || 0 : 0), 0);

  // Only show full-page loading spinner on initial load before any data is available
  if (loading && !stats && borrowedBooks.length === 0 && reservations.length === 0) {
    return <LoadingSpinner text="Loading Student Dashboard..." />;
  }

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Student Dashboard</h3>
          <p className="text-muted small mb-0">Overview of your borrowed books, reservations, fines, and catalog</p>
        </div>
        <Link to="/student/catalog" className="btn btn-dark btn-sm">
          <i className="bi bi-search me-1"></i> Book Catalog
        </Link>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Top 4 Summary Cards - Matching Reference Image */}
      <div className="row g-3 mb-4">
        {/* 1. Borrowed Books */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Borrowed Books"
            value={`${borrowedBooks.length} Books`}
            icon="bi-journal-bookmark"
            color="primary"
            subtitle="Limit: 3 books allowed"
          />
        </div>

        {/* 2. Due Soon / Overdue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Due Soon / Overdue"
            value={`${dueSoonCount} Book${dueSoonCount === 1 ? '' : 's'}`}
            icon="bi-clock-history"
            color="warning"
            subtitle={stats?.myOverdueCount > 0 ? `${stats.myOverdueCount} overdue` : 'On track'}
          />
        </div>

        {/* 3. Active Reservations */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Active Reservations"
            value={`${activeReservations.length} Book${activeReservations.length === 1 ? '' : 's'}`}
            icon="bi-bookmark-check"
            color="info"
          />
        </div>

        {/* 4. Overdue Fines */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Overdue Fines"
            value={`₹${totalUnpaidFine.toFixed(2)}`}
            icon="bi-cash-coin"
            color="danger"
            subtitle="Rate: ₹5.00 / overdue day"
          />
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="card shadow-sm border mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleQuickSearch} className="d-flex gap-2">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search books by title, author, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-dark btn-sm text-nowrap">
              Search Catalog
            </button>
          </form>
        </div>
      </div>

      {/* Main 2-Column Section Matching Reference Image (Recently Borrowed & Active Reservations) */}
      <div className="row g-4 mb-4">
        {/* Left Card: Recently Borrowed Books */}
        <div className="col-lg-6">
          <div className="card shadow-sm border h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">
                <i className="bi bi-journal-check me-2"></i>Recently Borrowed ({borrowedBooks.length})
              </span>
              <Link to="/student/borrowed" className="btn btn-link btn-sm text-decoration-none p-0 text-dark">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {borrowedBooks.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {borrowedBooks.map((item) => (
                    <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                          style={{ width: '42px', height: '48px', flexShrink: 0 }}
                        >
                          <i className="bi bi-book fs-4"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{item.book?.title}</div>
                          <small className="text-muted">by {item.book?.author} • {item.book?.category}</small>
                          <div className="small text-muted">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                            {item.isOverdue && (
                              <span className="ms-2 badge bg-light text-dark border">
                                Overdue ({item.daysOverdue}d)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link to="/student/borrowed" className="btn btn-outline-dark btn-sm text-nowrap">
                        Details
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-journal-x fs-2 d-block mb-2 text-muted"></i>
                  <p className="mb-2">You have no borrowed books right now.</p>
                  <Link to="/student/catalog" className="btn btn-outline-dark btn-sm">
                    Browse Book Catalog
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Active Reservations */}
        <div className="col-lg-6">
          <div className="card shadow-sm border h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">
                <i className="bi bi-bookmark-fill me-2"></i>Active Reservations ({activeReservations.length})
              </span>
              <Link to="/student/reservations" className="btn btn-link btn-sm text-decoration-none p-0 text-dark">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {activeReservations.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {activeReservations.map((res) => (
                    <li key={res._id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                          style={{ width: '42px', height: '48px', flexShrink: 0 }}
                        >
                          <i className="bi bi-bookmark fs-4"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{res.book?.title}</div>
                          <small className="text-muted">by {res.book?.author}</small>
                          <div>
                            {res.status === 'approved' && (
                              <span className="badge bg-light text-dark border me-2">
                                Approved & Borrowed
                              </span>
                            )}
                            <small className="text-muted">
                              Requested: {new Date(res.requestDate || res.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </div>
                      {res.status === 'pending' ? (
                        <button
                          className="btn btn-outline-secondary btn-sm text-nowrap"
                          onClick={() => handleCancelReservation(res._id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <Link to="/student/reservations" className="btn btn-outline-dark btn-sm text-nowrap">
                          View
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-bookmark-x fs-2 d-block mb-2 text-muted"></i>
                  <p className="mb-2">No active book reservations.</p>
                  <Link to="/student/catalog" className="btn btn-outline-dark btn-sm">
                    Search & Reserve Books
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Shortcuts / Links */}
      <div className="row g-3">
        <div className="col-md-3">
          <Link to="/student/catalog" className="card p-3 border shadow-sm text-decoration-none text-dark h-100 hover-card">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-book fs-3 text-muted"></i>
              <div>
                <div className="fw-bold">Book Catalog</div>
                <small className="text-muted">Search and explore books</small>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/student/fines" className="card p-3 border shadow-sm text-decoration-none text-dark h-100 hover-card">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-receipt fs-3 text-muted"></i>
              <div>
                <div className="fw-bold">Fines & Fees</div>
                <small className="text-muted">Check late fine details</small>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/student/history" className="card p-3 border shadow-sm text-decoration-none text-dark h-100 hover-card">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-clock-history fs-3 text-muted"></i>
              <div>
                <div className="fw-bold">Borrowing History</div>
                <small className="text-muted">Past loans and reviews</small>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/student/settings" className="card p-3 border shadow-sm text-decoration-none text-dark h-100 hover-card">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-gear fs-3 text-muted"></i>
              <div>
                <div className="fw-bold">Settings</div>
                <small className="text-muted">Notification preferences</small>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
