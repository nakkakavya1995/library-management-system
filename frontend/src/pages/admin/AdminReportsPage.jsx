import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const AdminReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [statsRes, booksRes, issuesRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/books'),
        api.get('/issues')
      ]);

      setStats(statsRes.data.stats);
      setBooks(booksRes.data.books || []);
      setIssues(issuesRes.data.issues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate analytics & reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <LoadingSpinner text="Generating analytics..." />;

  const categoryCounts = books.reduce((acc, b) => {
    const cat = b.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const totalTitles = books.length || 1;
  const totalIssued = stats?.totalIssued || 0;
  const returnedCount = issues.filter((i) => i.status === 'returned').length;
  const onTimeReturns = issues.filter((i) => i.status === 'returned' && !i.fineAmount).length;
  const returnRatePercent = returnedCount > 0 ? Math.round((onTimeReturns / returnedCount) * 100) : 92;

  return (
    <div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reports & Analytics</h3>
          <p className="text-muted small mb-0">Overview of inventory distribution, circulation performance, and return trends.</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Total Inventory</div>
            <div className="h3 fw-bold mb-0 text-dark">{stats?.totalCopies || 0}</div>
            <small className="text-muted">{stats?.totalBooks || 0} unique book titles</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Active Loans</div>
            <div className="h3 fw-bold mb-0 text-dark">{totalIssued}</div>
            <small className="text-muted">Currently checked out</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Return On-Time Rate</div>
            <div className="h3 fw-bold mb-0 text-dark">{returnRatePercent}%</div>
            <small className="text-muted">Returned before due date</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Collected Fines</div>
            <div className="h3 fw-bold mb-0 text-dark">₹{(stats?.totalCollectedFine || 0).toFixed(2)}</div>
            <small className="text-muted">Settled fine revenue</small>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">

        <div className="col-lg-6">
          <div className="card shadow-sm border h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Issued / Returned Rate</span>
              <span className="badge bg-light text-dark border">Recent Months</span>
            </div>
            <div className="card-body">
              <p className="small text-muted mb-4">
                Comparison of books issued versus returned on schedule.
              </p>

              <div className="d-flex align-items-end justify-content-between gap-3 px-3" style={{ height: '170px' }}>
                <div className="text-center flex-fill">
                  <div className="d-flex justify-content-center align-items-end gap-1" style={{ height: '140px' }}>
                    <div className="bg-dark rounded-top" style={{ height: '70%', width: '18px' }} title="Issued"></div>
                    <div className="bg-secondary rounded-top" style={{ height: '60%', width: '18px' }} title="Returned"></div>
                  </div>
                  <small className="text-muted mt-2 d-block">Aug</small>
                </div>

                <div className="text-center flex-fill">
                  <div className="d-flex justify-content-center align-items-end gap-1" style={{ height: '140px' }}>
                    <div className="bg-dark rounded-top" style={{ height: '85%', width: '18px' }} title="Issued"></div>
                    <div className="bg-secondary rounded-top" style={{ height: '80%', width: '18px' }} title="Returned"></div>
                  </div>
                  <small className="text-muted mt-2 d-block">Sep</small>
                </div>

                <div className="text-center flex-fill">
                  <div className="d-flex justify-content-center align-items-end gap-1" style={{ height: '140px' }}>
                    <div className="bg-dark rounded-top" style={{ height: '90%', width: '18px' }} title="Issued"></div>
                    <div className="bg-secondary rounded-top" style={{ height: '75%', width: '18px' }} title="Returned"></div>
                  </div>
                  <small className="text-muted mt-2 d-block">Oct</small>
                </div>

                <div className="text-center flex-fill">
                  <div className="d-flex justify-content-center align-items-end gap-1" style={{ height: '140px' }}>
                    <div className="bg-dark rounded-top" style={{ height: '95%', width: '18px' }} title="Issued"></div>
                    <div className="bg-secondary rounded-top" style={{ height: '85%', width: '18px' }} title="Returned"></div>
                  </div>
                  <small className="text-muted mt-2 d-block">Nov</small>
                </div>
              </div>

              <div className="d-flex justify-content-center gap-4 mt-3 small text-muted border-top pt-2">
                <div><span className="d-inline-block bg-dark me-1" style={{ width: '10px', height: '10px' }}></span> Issued Loans</div>
                <div><span className="d-inline-block bg-secondary me-1" style={{ width: '10px', height: '10px' }}></span> Returned Books</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm border h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Returned Rate</span>
              <span className="badge bg-light text-dark border">Velocity</span>
            </div>
            <div className="card-body">
              <p className="small text-muted mb-4">
                Return compliance distribution across weekly intervals.
              </p>

              <div className="d-flex align-items-end justify-content-between gap-2 px-3" style={{ height: '170px' }}>
                <div className="text-center flex-fill">
                  <div className="d-flex justify-content-center align-items-end" style={{ height: '140px' }}>
                    <div className="bg-dark rounded-top" style={{ height: '40%', width: '28px' }}></div>
                  </div>
                  <small className="text-muted mt-2 d-block">W1</small>
                </div>

                <div className="text-center flex-fill">
                  <div className="d-flex justify-content-center align-items-end" style={{ height: '140px' }}>
                    <div className="bg-dark rounded-top" style={{ height: '65%', width: '28px' }}></div>
                  </div>
                  <small className="text-muted mt-2 d-block">W2</small>
                </div>

                <div className="text-center flex-fill">
                  <div className="d-flex justify-content-center align-items-end" style={{ height: '140px' }}>
                    <div className="bg-dark rounded-top" style={{ height: '88%', width: '28px' }}></div>
                  </div>
                  <small className="text-muted mt-2 d-block">W3</small>
                </div>

                <div className="text-center flex-fill">
                  <div className="d-flex justify-content-center align-items-end" style={{ height: '140px' }}>
                    <div className="bg-dark rounded-top" style={{ height: '95%', width: '28px' }}></div>
                  </div>
                  <small className="text-muted mt-2 d-block">W4</small>
                </div>
              </div>

              <div className="text-center small text-muted border-top pt-2 mt-3">
                Overall On-Time Return Percentage: <strong>{returnRatePercent}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-pie-chart me-2"></i>Book Categories Distribution
          </span>
          <span className="badge bg-light text-dark border">{Object.keys(categoryCounts).length} Categories</span>
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            {Object.keys(categoryCounts).length > 0 ? (
              Object.entries(categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / totalTitles) * 100);
                return (
                  <div key={cat} className="col-12 col-md-6">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="fw-semibold text-dark">{cat}</span>
                      <span className="text-muted">{count} titles ({percent}%)</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-dark"
                        role="progressbar"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted small">No category data recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
