import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const CirculationPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const fetchCirculationData = async () => {
    try {
      setLoading(true);
      const issuesRes = await api.get('/issues?status=issued');
      setIssues(issuesRes.data.issues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load circulation records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculationData();
  }, []);

  const handleReturn = async (issueId) => {
    try {
      setReturningId(issueId);
      setError('');
      setSuccess('');
      const res = await api.put(`/issues/${issueId}/return`, { finePaid: true });
      setError('');
      setSuccess(res.data?.message || 'Book successfully returned and restocked');
      fetchCirculationData();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('already been returned')) {
        setError('');
        setSuccess('Book successfully returned and restocked');
        fetchCirculationData();
      } else {
        setSuccess('');
        setError(msg || 'Failed to process return');
      }
    } finally {
      setReturningId(null);
    }
  };

  const handleAcceptRenewal = async (issueId, days = 14) => {
    try {
      await api.put(`/issues/${issueId}/handle-renewal`, { action: 'approve', days });
      setSuccess('Renewal request accepted! Loan extended by 14 days.');
      fetchCirculationData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept renewal');
    }
  };

  const filteredIssues = issues.filter((i) => {
    const t = i.book?.title?.toLowerCase() || '';
    const s = i.student?.name?.toLowerCase() || '';
    const id = i.student?.studentId?.toLowerCase() || '';
    const q = search.toLowerCase();
    return t.includes(q) || s.includes(q) || id.includes(q);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Issue & Return</h3>
          <p className="text-muted small mb-0">Unified desk for managing book issues, loan requests, and returns</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/librarian/issue" className="btn btn-dark btn-sm">
            <i className="bi bi-journal-plus me-1"></i> Issue Book
          </Link>
          <Link to="/librarian/return" className="btn btn-outline-dark btn-sm">
            <i className="bi bi-box-arrow-in-left me-1"></i> Return Counter
          </Link>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card shadow-sm border mb-4">
        <div className="card-body p-3">
          <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by book title or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading circulation data..." />
      ) : (

        <div className="card shadow-sm border">
          <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-journal-check me-2"></i>Issued Books ({filteredIssues.length})
            </span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Book Details</th>
                    <th>Borrowing Student</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length > 0 ? (
                    filteredIssues.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '38px', height: '46px' }}
                          >
                            <i className="bi bi-book fs-5"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{item.book?.title}</div>
                          <small className="text-muted">by {item.book?.author}</small>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{item.student?.name}</div>
                          <small className="text-muted">{item.student?.studentId || item.student?.email}</small>
                        </td>
                        <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                        <td>
                          <span className="fw-semibold">
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {item.returnStatus === 'requested' && (
                              <span
                                className="badge text-white border-0 shadow-sm"
                                style={{ backgroundColor: '#059669' }}
                              >
                                <i className="bi bi-box-arrow-in-left me-1"></i>Return Requested
                              </span>
                            )}
                            {item.renewalStatus === 'requested' && (
                              <span
                                className="badge bg-warning text-dark border-0 shadow-sm"
                              >
                                <i className="bi bi-clock-history me-1"></i>Renewal Requested (+14d)
                              </span>
                            )}
                            <span className="badge bg-light text-dark border">
                              {item.isOverdue ? `Overdue (${item.daysOverdue}d)` : 'On time'}
                            </span>
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end align-items-center gap-2">
                            {item.renewalStatus === 'requested' && (
                              <button
                                className="btn btn-sm btn-success fw-semibold shadow-sm rounded-pill px-3"
                                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                                onClick={() => handleAcceptRenewal(item._id)}
                                title="Accept Renewal: Extend loan by 14 days"
                              >
                                <i className="bi bi-arrow-repeat me-1"></i>Accept Renewal
                              </button>
                            )}
                            <button
                              className={`btn btn-sm ${
                                item.returnStatus === 'requested'
                                  ? 'btn-success fw-semibold shadow-sm rounded-pill px-3'
                                  : 'btn-dark'
                              }`}
                              style={
                                item.returnStatus === 'requested'
                                  ? { backgroundColor: '#059669', borderColor: '#059669' }
                                  : {}
                              }
                              onClick={() => handleReturn(item._id)}
                              disabled={returningId === item._id}
                              title="Return Book"
                            >
                              {returningId === item._id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                  Returning...
                                </>
                              ) : item.returnStatus === 'requested' ? (
                                'Accept Return'
                              ) : (
                                'Return'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No active checkouts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CirculationPage;
