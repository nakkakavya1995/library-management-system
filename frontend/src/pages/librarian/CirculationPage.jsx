import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const CirculationPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
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
      await api.put(`/issues/${issueId}/return`, { finePaid: true });
      setSuccess('Book successfully returned and restocked');
      fetchCirculationData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process return');
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

      {/* Search Bar */}
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
        /* Issued Books Table */
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
                          {item.returnStatus === 'requested' ? (
                            <span
                              className="badge text-white border-0 shadow-sm"
                              style={{ backgroundColor: '#059669' }}
                            >
                              <i className="bi bi-bell-fill me-1"></i>Return Requested
                            </span>
                          ) : (
                            <span className="badge bg-light text-dark border">
                              {item.isOverdue ? `Overdue (${item.daysOverdue}d)` : 'On time'}
                            </span>
                          )}
                        </td>
                        <td className="text-end">
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
                            title="Return Book"
                          >
                            {item.returnStatus === 'requested' ? 'Accept Return' : 'Return'}
                          </button>
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
