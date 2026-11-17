import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const MyBorrowedBooksPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMyBorrowed = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues/my-borrowings?status=issued');
      setIssues(res.data.issues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch borrowed books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBorrowed();

    // Auto-refresh when tab gains focus or becomes visible
    const handleSync = () => fetchMyBorrowed();
    window.addEventListener('focus', handleSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleSync();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Auto-sync interval to catch new issues in real-time
    const interval = setInterval(handleSync, 5000);

    return () => {
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const handleRequestRenewal = async (issueId) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      await api.post(`/issues/${issueId}/request-renewal`);
      setSuccess('Renewal request submitted! Awaiting librarian approval.');
      fetchMyBorrowed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request renewal');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (item) => {
    if (item.isOverdue) {
      return (
        <span className="badge bg-light text-dark border">
          Overdue ({item.daysOverdue} days)
        </span>
      );
    }
    const diff = new Date(item.dueDate).getTime() - new Date().getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) {
      return (
        <span className="badge bg-light text-dark border">
          Due Soon ({daysLeft <= 0 ? 'Today' : `${daysLeft}d`})
        </span>
      );
    }
    return (
      <span className="badge bg-light text-dark border">
        Active (On time)
      </span>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Borrowed Books</h3>
          <p className="text-muted small mb-0">View your active book loans, track due dates, and request loan renewals</p>
        </div>
        <Link to="/student/catalog" className="btn btn-dark btn-sm">
          <i className="bi bi-search me-1"></i> Browse More Books
        </Link>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Borrowing Limit Meter Card */}
      <div className="card shadow-sm border mb-4 bg-white">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="small fw-bold text-dark">
              Books Borrowed: {issues.length} of 3 Allowed
            </span>
            <span className="small text-muted">
              {Math.max(0, 3 - issues.length)} more allowed
            </span>
          </div>
          <div className="progress" style={{ height: '6px' }}>
            <div
              className="progress-bar bg-dark"
              role="progressbar"
              style={{ width: `${Math.min(100, (issues.length / 3) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Borrowed Books Table Matching Reference Image Screen 3 */}
      <div className="card shadow-sm border">
        <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-journal-check me-2"></i>Active Loans ({issues.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading borrowed books..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Title & Author</th>
                    <th>Checkout Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Late Fine</th>
                    <th>Renewal Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.length > 0 ? (
                    issues.map((item) => (
                      <tr key={item._id}>
                        {/* Cover thumbnail */}
                        <td>
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '40px', height: '48px' }}
                          >
                            <i className="bi bi-book fs-5"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{item.book?.title}</div>
                          <small className="text-muted">by {item.book?.author} • {item.book?.category}</small>
                        </td>
                        <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                        <td>
                          <span className="fw-semibold text-dark">
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>{getStatusBadge(item)}</td>
                        <td>
                          <span className="fw-bold text-dark">
                            {item.isOverdue ? `₹${item.currentFine}` : '₹0.00'}
                          </span>
                        </td>
                        <td>
                          {item.renewalStatus === 'none' && (
                            <span className="badge bg-light text-dark border">
                              Available (0/1 used)
                            </span>
                          )}
                          {item.renewalStatus === 'requested' && (
                            <span className="badge bg-light text-dark border">
                              Request Pending
                            </span>
                          )}
                          {item.renewalStatus === 'approved' && (
                            <span className="badge bg-light text-dark border">
                              Renewed (+7 days)
                            </span>
                          )}
                          {item.renewalStatus === 'rejected' && (
                            <span className="badge bg-light text-dark border">
                              Renewal Rejected
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          {item.renewalStatus === 'none' && !item.isOverdue && item.renewalCount < 1 ? (
                            <button
                              className="btn btn-outline-dark btn-sm text-nowrap"
                              onClick={() => handleRequestRenewal(item._id)}
                              disabled={actionLoading}
                            >
                              <i className="bi bi-arrow-repeat me-1"></i> Extend / Renew
                            </button>
                          ) : item.isOverdue ? (
                            <span className="small text-muted">Return to clear fine</span>
                          ) : (
                            <span className="small text-muted">Limit reached</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        <i className="bi bi-journal-x fs-2 d-block mb-2 text-muted"></i>
                        You do not have any borrowed books at the moment.
                        <div className="mt-3">
                          <Link to="/student/catalog" className="btn btn-dark btn-sm">
                            Browse Book Catalog
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBorrowedBooksPage;
