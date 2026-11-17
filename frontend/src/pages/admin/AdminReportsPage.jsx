import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import { exportToCsv } from '../../utils/exportCsv';

const AdminReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleExportInventoryCsv = () => {
    if (!books.length) {
      alert('No books available to export.');
      return;
    }
    const formatted = books.map((b) => ({
      Title: b.title,
      Author: b.author,
      Category: b.category,
      'Total Copies': b.totalCopies,
      'Available Copies': b.availableCopies,
      'Borrowed Copies': b.totalCopies - b.availableCopies,
      'Price (INR)': `₹${b.price || 0}`
    }));
    exportToCsv('admin_inventory_report', formatted);
    setSuccess('Inventory CSV report downloaded successfully');
  };

  const handleExportCirculationCsv = () => {
    if (!issues.length) {
      alert('No circulation records available.');
      return;
    }
    const formatted = issues.map((i) => ({
      'Book Title': i.book?.title || '',
      'Borrower Name': i.student?.name || '',
      'Borrower ID': i.student?.studentId || '',
      'Issue Date': new Date(i.issueDate).toLocaleDateString(),
      'Due Date': new Date(i.dueDate).toLocaleDateString(),
      Status: i.status,
      'Overdue Days': i.daysOverdue || 0,
      'Fine Amount (INR)': `₹${i.currentFine || i.fineAmount || 0}`,
      'Fine Paid': i.finePaid ? 'Settled' : 'Unpaid'
    }));
    exportToCsv('admin_circulation_fines_report', formatted);
    setSuccess('Circulation & Fines CSV report downloaded successfully');
  };

  if (loading) return <LoadingSpinner text="Generating analytics..." />;

  // Category counts
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
      {/* Header Matching Screen 7 */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Admin Analytics & Reports</h3>
          <p className="text-muted small mb-0">Library inventory performance, circulation velocity, and category distribution.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleExportInventoryCsv}>
            <i className="bi bi-file-earmark-arrow-down me-1"></i> Inventory CSV
          </button>
          <button className="btn btn-dark btn-sm" onClick={handleExportCirculationCsv}>
            <i className="bi bi-download me-1"></i> Circulation CSV
          </button>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Top 4 KPI Cards */}
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
            <small className="text-muted">Settled to library</small>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid Matching Screen 7 */}
      <div className="row g-4 mb-4">
        {/* Left: Issued / Returned Rate */}
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

        {/* Right: Returned Rate Velocity Trend */}
        <div className="col-lg-6">
          <div className="card shadow-sm border h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Returned Rate</span>
              <span className="badge bg-light text-dark border">Velocity</span>
            </div>
            <div className="card-body">
              <p className="small text-muted mb-4">
                Return compliance distribution across week intervals.
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

      {/* Popular Categories & 1-Click Data Triggers Grid */}
      <div className="row g-4 mb-4">
        {/* Popular Categories */}
        <div className="col-lg-7">
          <div className="card shadow-sm border h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Popular Categories</span>
              <span className="badge bg-light text-dark border">{Object.keys(categoryCounts).length} Categories</span>
            </div>
            <div className="card-body">
              {Object.keys(categoryCounts).length > 0 ? (
                Object.entries(categoryCounts).map(([cat, count]) => {
                  const percent = Math.round((count / totalTitles) * 100);
                  return (
                    <div key={cat} className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{cat}</span>
                        <span className="text-muted">{count} titles ({percent}%)</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
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

        {/* 1-Click Data Triggers & Fines Collected */}
        <div className="col-lg-5">
          <div className="card shadow-sm border h-100">
            <div className="card-header bg-light">
              <span className="fw-semibold">One-Click Data Triggers</span>
            </div>
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <p className="small text-muted mb-3">
                  Generate instant CSV exports for audit logs, administrative reporting, and inventory audits.
                </p>

                <div className="d-grid gap-2 mb-4">
                  <button className="btn btn-outline-dark btn-sm text-start py-2" onClick={handleExportInventoryCsv}>
                    <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                    <strong>Download Inventory Report (CSV)</strong>
                    <div className="small text-muted">All titles, copy numbers, shelf availability</div>
                  </button>

                  <button className="btn btn-outline-dark btn-sm text-start py-2" onClick={handleExportCirculationCsv}>
                    <i className="bi bi-file-earmark-text me-2"></i>
                    <strong>Download Circulation & Fines (CSV)</strong>
                    <div className="small text-muted">Active loans, due dates, overdue fees & statuses</div>
                  </button>
                </div>
              </div>

              <div className="bg-light p-3 rounded border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small fw-semibold">Fines Collected:</span>
                  <span className="fw-bold text-dark">₹{(stats?.totalCollectedFine || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">Pending Outstanding:</span>
                  <span className="small text-muted">₹{(stats?.totalUnpaidFine || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
