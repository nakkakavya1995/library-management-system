import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const BorrowingHistoryPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/issues', { params });
      setIssues(res.data.issues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch borrowing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter]);

  const filteredIssues = issues.filter((i) => {
    const bookTitle = i.book?.title?.toLowerCase() || '';
    const studentName = i.student?.name?.toLowerCase() || '';
    const studentId = i.student?.studentId?.toLowerCase() || '';
    const s = search.toLowerCase();
    return bookTitle.includes(s) || studentName.includes(s) || studentId.includes(s);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Borrowing History</h3>
          <p className="text-muted small mb-0">Log of all book issues and returns</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      <div className="card mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by book title, student name, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="btn-group btn-group-sm w-100">
                <button
                  type="button"
                  className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('')}
                >
                  All Statuses
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === 'issued' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('issued')}
                >
                  Active Only
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === 'returned' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('returned')}
                >
                  Returned Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Retrieving borrowing records..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrower</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length > 0 ? (
                    filteredIssues.map((record) => (
                      <tr key={record._id}>
                        <td>
                          <div className="fw-semibold">{record.book?.title}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{record.student?.name}</div>
                          <small className="text-muted">
                            {record.student?.studentId} • {record.student?.email}
                          </small>
                        </td>
                        <td>{new Date(record.issueDate).toLocaleDateString()}</td>
                        <td>{new Date(record.dueDate).toLocaleDateString()}</td>
                        <td>
                          {record.returnDate
                            ? new Date(record.returnDate).toLocaleDateString()
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              record.status === 'issued' ? 'bg-primary' : 'bg-success'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td>
                          {record.currentFine > 0 || record.fineAmount > 0 ? (
                            <span className="text-danger fw-semibold">
                              ₹{record.currentFine || record.fineAmount}
                              {record.finePaid ? (
                                <span className="badge bg-success ms-1">Paid</span>
                              ) : (
                                <span className="badge bg-warning text-dark ms-1">Unpaid</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted small">₹0.00</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No transactions found.
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

export default BorrowingHistoryPage;
