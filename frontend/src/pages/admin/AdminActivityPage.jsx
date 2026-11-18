import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const AdminActivityPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const issuesRes = await api.get('/issues?status=issued');
      setIssues(issuesRes.data.issues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch circulation records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReturnBook = async (issueId) => {
    try {
      const res = await api.put(`/issues/${issueId}/return`, {
        condition: 'good',
        notes: 'Returned at admin desk'
      });
      setSuccess(`Book returned successfully. Fine charged: ₹${res.data.issue?.fineAmount || 0}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return book');
    }
  };

  const currentCheckouts = issues.filter((i) => i.status === 'issued');

  const filteredCheckouts = currentCheckouts.filter((i) => {
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
          <p className="text-muted small mb-0">Monitor active loans, countdown due dates, and manage book returns.</p>
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
              placeholder="Search by book title or borrower..."
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
              <i className="bi bi-journal-check me-2"></i>Issued Books ({filteredCheckouts.length})
            </span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Book Details</th>
                    <th>Borrower</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Countdown / Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCheckouts.length > 0 ? (
                    filteredCheckouts.map((item) => {
                      const diff = new Date(item.dueDate).getTime() - new Date().getTime();
                      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={item._id}>
                          <td>
                            <div
                              className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                              style={{ width: '38px', height: '46px', flexShrink: 0 }}
                            >
                              <i className="bi bi-book"></i>
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">{item.book?.title}</div>
                            <small className="text-muted">{item.book?.category}</small>
                          </td>
                          <td>
                            <div className="fw-semibold">{item.student?.name}</div>
                            <small className="text-muted">{item.student?.studentId || item.student?.email}</small>
                          </td>
                          <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                          <td>
                            <span className={item.isOverdue ? 'fw-bold text-danger' : ''}>
                              {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            {item.isOverdue ? (
                              <span className="badge bg-light text-dark border">
                                Overdue ({item.daysOverdue}d) • Fine: ₹{item.currentFine || item.fineAmount}
                              </span>
                            ) : (
                              <span className="badge bg-light text-dark border">
                                {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining
                              </span>
                            )}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => handleReturnBook(item._id)}
                            >
                              Return Book
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
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

export default AdminActivityPage;
