import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import { exportToCsv } from '../../utils/exportCsv';

const AdminFinesPage = () => {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, issuesRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/issues')
      ]);

      setStats(statsRes.data.stats);
      const fined = issuesRes.data.issues.filter(
        (i) => i.currentFine > 0 || i.fineAmount > 0 || i.isOverdue
      );
      setIssues(fined);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fine records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportFines = () => {
    if (!issues || !issues.length) {
      alert('No fine records available to export.');
      return;
    }
    const formatted = issues.map((i) => ({
      'Book Title': i.book?.title || '',
      'Borrower': i.student?.name || '',
      'Borrower ID': i.student?.studentId || '',
      'Fee Type': i.isOverdue ? 'Late Return' : 'Overdue',
      'Fine Amount (INR)': `₹${i.currentFine || i.fineAmount || 0}`,
      'Due Date': new Date(i.dueDate).toLocaleDateString(),
      'Status': i.finePaid ? 'Paid' : 'Unpaid'
    }));
    exportToCsv('library_fines_sheet', formatted);
  };

  if (loading) return <LoadingSpinner text="Loading fines..." />;

  const filteredIssues = issues.filter((i) => {
    const t = i.book?.title?.toLowerCase() || '';
    const s = i.student?.name?.toLowerCase() || '';
    const q = search.toLowerCase();
    return t.includes(q) || s.includes(q);
  });

  const totalOutstanding = issues
    .filter((i) => !i.finePaid)
    .reduce((sum, i) => sum + (i.currentFine || i.fineAmount || 0), 0);

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Fines & Penalties</h3>
          <p className="text-muted small mb-0">Overview of fine amounts, overdue penalties, and account statuses.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleExportFines}>
            <i className="bi bi-download me-1"></i> Export Sheet
          </button>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Fines</div>
            <div className="h3 fw-bold mb-0 text-dark">₹{totalOutstanding.toFixed(2)}</div>
            <small className="text-muted">Unpaid fine amount</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Collected Fines</div>
            <div className="h3 fw-bold mb-0 text-dark">₹{(stats?.totalCollectedFine || 0).toFixed(2)}</div>
            <small className="text-muted">Cleared fine records</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Fine Rate</div>
            <div className="h3 fw-bold mb-0 text-dark">₹5.00 / day</div>
            <small className="text-muted">Calculated per overdue day</small>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Transaction Tracking Sheet</span>
          <div className="input-group input-group-sm" style={{ maxWidth: '260px' }}>
            <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search title or borrower..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Fee Type</th>
                  <th className="fw-bold">Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((item) => {
                    const amount = item.currentFine || item.fineAmount || 0;
                    return (
                      <tr key={item._id}>
                        <td>
                          <div className="fw-semibold text-dark">{item.book?.title}</div>
                          <small className="text-muted">
                            Borrower: {item.student?.name} {item.student?.studentId ? `(${item.student.studentId})` : ''}
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {item.isOverdue ? 'Late Return' : 'Overdue'}
                          </span>
                        </td>
                        <td className="fw-bold fs-6 text-dark">
                          ₹{amount.toFixed(2)}
                        </td>
                        <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {item.finePaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No fine transactions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinesPage;
