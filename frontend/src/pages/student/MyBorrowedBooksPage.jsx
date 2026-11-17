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

  const fetchMyBorrowed = async (isBackground = false) => {
    try {
      if (!isBackground && issues.length === 0) {
        setLoading(true);
      }
      const res = await api.get('/issues/my-borrowings?status=issued');
      setIssues(res.data.issues || []);
    } catch (err) {
      if (err.response?.status === 401) return;
      setError(err.response?.data?.message || 'Failed to fetch borrowed books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBorrowed(false);

    // Auto-refresh silently when tab gains focus or becomes visible
    const handleSync = () => fetchMyBorrowed(true);
    window.addEventListener('focus', handleSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleSync();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Silent sync interval (10s)
    const interval = setInterval(handleSync, 10000);

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

      await api.post(`/issues/${issueId}/request-renewal`, { days: 14 });
      setSuccess('Renewal request for 14 days submitted! Awaiting librarian approval.');
      fetchMyBorrowed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request renewal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReturn = async (issueId, bookTitle) => {
    if (!window.confirm(`Do you want to submit a return request for "${bookTitle}" to the librarian?`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const res = await api.post(`/issues/${issueId}/request-return`);
      setSuccess(
        res.data.message ||
          `Return request submitted for "${bookTitle}"! The librarian will accept your return and restock the book.`
      );
      fetchMyBorrowed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnBook = async (issueId, bookTitle) => {
    if (!window.confirm(`Are you sure you want to return "${bookTitle}"?`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      await api.put(`/issues/${issueId}/return`, { finePaid: true });
      setSuccess(`"${bookTitle}" has been returned successfully! You can now borrow another book.`);
      fetchMyBorrowed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return book');
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
          {issues.length >= 3 && (
            <div className="alert alert-warning py-2 px-3 mt-3 mb-0 small d-flex align-items-center">
              <i className="bi bi-info-circle-fill me-2 text-warning fs-5"></i>
              <div>
                <strong>Limit Reached:</strong> You have 3 of 3 allowed books borrowed. Click <strong>Request Return</strong> on any book below. Once the librarian accepts, your slot is freed up to borrow another book!
              </div>
            </div>
          )}
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
                          {item.returnStatus === 'requested' ? (
                            <span className="badge bg-warning text-dark border">
                              <i className="bi bi-clock-history me-1"></i>Return Requested
                            </span>
                          ) : item.renewalStatus === 'none' ? (
                            <span className="badge bg-light text-dark border">
                              Available (0/1 used)
                            </span>
                          ) : item.renewalStatus === 'requested' ? (
                            <span className="badge bg-light text-dark border">
                              Renewal Pending
                            </span>
                          ) : item.renewalStatus === 'approved' ? (
                            <span className="badge bg-light text-dark border">
                              Renewed (+7 days)
                            </span>
                          ) : (
                            <span className="badge bg-light text-dark border">
                              Renewal Rejected
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end align-items-center gap-2">
                            {/* Extend / Renew button matching user styling */}
                            {item.renewalStatus === 'none' && !item.isOverdue && item.renewalCount < 1 ? (
                              <button
                                className="btn text-white btn-sm rounded-pill px-3 py-1 fw-medium text-nowrap"
                                style={{ backgroundColor: '#111827', border: '1px solid #4b5563' }}
                                onClick={() => handleRequestRenewal(item._id)}
                                disabled={actionLoading}
                                title="Request loan renewal (+14 days)"
                              >
                                Extend / Renew
                              </button>
                            ) : item.renewalStatus === 'requested' ? (
                              <span
                                className="badge rounded-pill bg-warning text-dark px-3 py-1 fw-semibold"
                                title="Renewal request pending librarian review"
                              >
                                <i className="bi bi-hourglass-split me-1"></i>Renewal Pending
                              </span>
                            ) : null}

                            {/* Request Return button matching user styling */}
                            {item.returnStatus === 'requested' ? (
                              <span
                                className="badge rounded-pill bg-warning text-dark px-3 py-1 fw-semibold shadow-sm"
                                title="Return request is awaiting librarian review"
                              >
                                <i className="bi bi-clock-history me-1"></i>Return Requested
                              </span>
                            ) : (
                              <button
                                className="btn text-white btn-sm rounded-pill px-3 py-1 fw-medium text-nowrap shadow-sm"
                                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                                onClick={() => handleRequestReturn(item._id, item.book?.title)}
                                disabled={actionLoading}
                                title="Request return: send request to librarian to accept return and restock book"
                              >
                                Request Return
                              </button>
                            )}
                          </div>
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
