import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const OverdueBooksPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues?status=issued');

      const overdues = res.data.issues.filter((i) => i.isOverdue || i.currentFine > 0);
      setIssues(overdues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fine records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleSendNotification = async (id, studentName) => {
    try {
      const res = await api.post(`/issues/${id}/notify`);
      setSuccess(
        res.data.message || `Overdue notification & email dispatched to ${studentName} via Nodemailer!`
      );
      fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    }
  };

  const totalOverdueFines = issues
    .filter((i) => !i.finePaid)
    .reduce((sum, item) => sum + (item.currentFine || 0), 0);

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
          <h3 className="fw-bold mb-1">Fines & Penalties</h3>
          <p className="text-muted small mb-0">Transaction tracking sheet for overdue books, penalty fees, and fee collections</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-4">
          <div className="card bg-light border text-dark shadow-sm">
            <div className="card-body d-flex align-items-center justify-content-between p-3">
              <div>
                <div className="small fw-semibold text-uppercase text-muted">Total Fines</div>
                <div className="h3 fw-bold mb-0">₹{totalOverdueFines.toFixed(2)}</div>
              </div>
              <i className="bi bi-cash-coin fs-2 text-muted"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border mb-4">
        <div className="card-body p-3">
          <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search fine records by student or book title..."
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

      <div className="card shadow-sm border mb-4">
        <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-receipt me-2"></i>Transaction Tracking Sheet ({filteredIssues.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading fine records..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Borrower</th>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Days Late</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length > 0 ? (
                    filteredIssues.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="fw-semibold text-dark">{item.book?.title}</div>
                          <small className="text-muted">by {item.book?.author}</small>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{item.student?.name}</div>
                          <small className="text-muted">
                            {item.student?.studentId} • {item.student?.email}
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">Late Return</span>
                        </td>
                        <td className="fw-bold text-dark">
                          ₹{item.currentFine}
                        </td>
                        <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {item.daysOverdue} days
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {item.finePaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <button
                              className="btn btn-sm btn-outline-dark"
                              title="Send Overdue Notice"
                              onClick={() => handleSendNotification(item._id, item.student?.name)}
                            >
                              <i className="bi bi-bell me-1"></i>
                              {item.overdueNotified ? 'Resend' : 'Notify'}
                            </button>
                            <Link to="/librarian/return" className="btn btn-outline-secondary btn-sm">
                              Return
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        <i className="bi bi-check-circle fs-2 d-block mb-2 text-muted"></i>
                        No overdue checkouts or unpaid fines found.
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

export default OverdueBooksPage;
