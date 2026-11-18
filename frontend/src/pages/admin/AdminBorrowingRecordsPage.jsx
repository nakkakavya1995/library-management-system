import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const AdminBorrowingRecordsPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/issues', { params });
      setIssues(res.data.issues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch borrowing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Borrowing Records</h3>
          <p className="text-muted small mb-0">View all issued, returned, and late books</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setStatusFilter('')}
        >
          All Records
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'issued' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setStatusFilter('issued')}
        >
          Currently Issued
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'returned' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setStatusFilter('returned')}
        >
          Returned
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading records..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Student</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Overdue / Fine</th>
                    <th>Issued By</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.length > 0 ? (
                    issues.map((record) => (
                      <tr key={record._id}>
                        <td>
                          <div className="fw-semibold">{record.book?.title}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{record.student?.name}</div>
                          <small className="text-muted">{record.student?.email} ({record.student?.studentId})</small>
                        </td>
                        <td>{new Date(record.issueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={record.isOverdue && record.status === 'issued' ? 'text-danger fw-bold' : ''}>
                            {new Date(record.dueDate).toLocaleDateString()}
                          </span>
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
                          {record.isOverdue ? (
                            <div>
                              <span className="badge bg-danger">
                                Overdue ({record.daysOverdue} days)
                              </span>
                              <div className="small text-danger fw-bold mt-1">
                                Fine: ₹{record.currentFine || record.fineAmount}
                                {record.finePaid ? (
                                  <span className="badge bg-success ms-1">Paid</span>
                                ) : (
                                  <span className="badge bg-warning text-dark ms-1">Unpaid</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted small">No Fine</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">{record.issuedBy?.name || 'Staff'}</small>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No borrowing records found.
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

export default AdminBorrowingRecordsPage;
