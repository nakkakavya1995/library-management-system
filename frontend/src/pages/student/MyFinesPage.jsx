import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const MyFinesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchFines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues/my-borrowings');
      // Filter records that have a fine or late return
      const finedRecords = (res.data.issues || []).filter(
        (i) => i.currentFine > 0 || i.fineAmount > 0
      );
      setIssues(finedRecords);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch fine records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const totalUnpaidFine = issues
    .filter((i) => !i.finePaid)
    .reduce((sum, item) => sum + (item.currentFine || item.fineAmount || 0), 0);

  const totalPaidFine = issues
    .filter((i) => i.finePaid)
    .reduce((sum, item) => sum + (item.fineAmount || 0), 0);

  const filteredIssues = issues.filter((item) => {
    const t = item.book?.title?.toLowerCase() || '';
    const a = item.book?.author?.toLowerCase() || '';
    const s = search.toLowerCase();
    return t.includes(s) || a.includes(s);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Fines</h3>
          <p className="text-muted small mb-0">View late return fines on your account</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      {/* Summary Card */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-4">
          <div className="card bg-light border text-dark shadow-sm">
            <div className="card-body p-3 d-flex justify-content-between align-items-center">
              <div>
                <div className="small fw-semibold text-uppercase text-muted">Fines</div>
                <div className="h3 fw-bold mb-0">₹{totalUnpaidFine.toFixed(2)}</div>
                <small className="text-muted">Payable at the library circulation desk</small>
              </div>
              <i className="bi bi-cash-coin fs-2 text-muted"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="card shadow-sm border mb-4">
        <div className="card-body p-3">
          <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search fine records by book title or author..."
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

      {/* Fines Table Matching Reference Image Screen 6 */}
      <div className="card shadow-sm border mb-4">
        <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-receipt me-2"></i>Fines ({filteredIssues.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading fines and fees..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book Title & Author</th>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
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
                          <span className="badge bg-light text-dark border">Late Return</span>
                        </td>
                        <td className="fw-bold text-dark">
                          ₹{(item.currentFine || item.fineAmount || 0).toFixed(2)}
                        </td>
                        <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                        <td>
                          {item.returnDate
                            ? new Date(item.returnDate).toLocaleDateString()
                            : <span className="text-muted">Still Borrowed</span>}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {item.finePaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <i className="bi bi-check-circle fs-2 d-block mb-2 text-muted"></i>
                        No fines recorded on your account.
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

export default MyFinesPage;
