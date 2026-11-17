import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const LibrarianReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [statsRes, actRes, booksRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/reports/activity'),
        api.get('/books')
      ]);

      setStats(statsRes.data.stats);
      setActivity(actRes.data);
      setBooks(booksRes.data.books || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const downloadCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header] ?? '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventoryCSV = () => {
    const data = books.map((b) => ({
      Title: b.title,
      Author: b.author,
      Category: b.category,
      TotalCopies: b.totalCopies,
      AvailableCopies: b.availableCopies,
      IssuedCopies: b.totalCopies - b.availableCopies,
      Price: b.price
    }));
    downloadCSV(data, `library-inventory-report-${Date.now()}.csv`);
  };

  const exportActivityCSV = () => {
    const list = activity?.recentIssues || [];
    const data = list.map((item) => ({
      Book: item.book?.title || '',
      Student: item.student?.name || '',
      StudentId: item.student?.studentId || '',
      IssueDate: item.issueDate ? new Date(item.issueDate).toLocaleDateString() : '',
      DueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '',
      Status: item.status || '',
      Fine: item.fineAmount || item.currentFine || 0
    }));
    downloadCSV(data, `circulation-activity-report-${Date.now()}.csv`);
  };

  if (loading) return <LoadingSpinner text="Generating Library Reports..." />;

  // Calculate category distribution
  const categoryCounts = books.reduce((acc, curr) => {
    const cat = curr.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reports & Analytics</h3>
          <p className="text-muted small mb-0">Library inventory performance, circulation metrics, and 1-click report exports</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      {/* KPI Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border p-3">
            <div className="small text-muted text-uppercase fw-semibold">Total Inventory Copies</div>
            <div className="h3 fw-bold mb-0 text-dark">{stats?.totalCopies || 0}</div>
            <small className="text-muted">{stats?.totalBooks || 0} unique book titles</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border p-3">
            <div className="small text-muted text-uppercase fw-semibold">Active Loan Copies</div>
            <div className="h3 fw-bold mb-0 text-dark">{stats?.totalIssued || 0}</div>
            <small className="text-muted">Currently in student hands</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border p-3">
            <div className="small text-muted text-uppercase fw-semibold">Overdue Loans</div>
            <div className="h3 fw-bold mb-0 text-dark">{stats?.overdueCount || 0}</div>
            <small className="text-muted">Requiring return or follow-up</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border p-3">
            <div className="small text-muted text-uppercase fw-semibold">Total Fines Collected</div>
            <div className="h3 fw-bold mb-0 text-dark">₹{(stats?.totalCollectedFine || 0).toFixed(2)}</div>
            <small className="text-muted">₹{(stats?.totalUnpaidFine || 0).toFixed(2)} pending unpaid</small>
          </div>
        </div>
      </div>

      {/* 2-Column Section Matching Reference Image Screen 7 */}
      <div className="row g-4 mb-4">
        {/* Left Column: Issued vs Returned Distribution & Category Breakdown */}
        <div className="col-lg-7">
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-light fw-bold text-dark">
              <i className="bi bi-pie-chart me-2"></i>Book Categories Breakdown
            </div>
            <div className="card-body p-4">
              <div className="d-flex flex-column gap-3">
                {Object.entries(categoryCounts).map(([category, count]) => {
                  const percent = Math.round((count / (books.length || 1)) * 100);
                  return (
                    <div key={category}>
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="fw-semibold text-dark">{category}</span>
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
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: One-Click Data Triggers Matching Reference Image Screen 7 */}
        <div className="col-lg-5">
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-light fw-bold text-dark">
              <i className="bi bi-download me-2"></i>One-Click Data Triggers
            </div>
            <div className="card-body p-4">
              <p className="text-muted small mb-3">
                Export complete audit logs and catalog sheets into Excel-compatible CSV files:
              </p>

              <div className="d-flex flex-column gap-3">
                <button
                  className="btn btn-dark btn-sm text-start p-3 d-flex align-items-center justify-content-between"
                  onClick={exportInventoryCSV}
                >
                  <div>
                    <div className="fw-semibold">Download Inventory Report (Excel / CSV)</div>
                    <small className="text-white-50">Complete book catalog with copies and availability</small>
                  </div>
                  <i className="bi bi-file-earmark-spreadsheet fs-4"></i>
                </button>

                <button
                  className="btn btn-outline-dark btn-sm text-start p-3 d-flex align-items-center justify-content-between"
                  onClick={exportActivityCSV}
                >
                  <div>
                    <div className="fw-semibold">Download Circulation & Fines Logs (Excel / CSV)</div>
                    <small className="text-muted">All active and recent loans, due dates, and fine records</small>
                  </div>
                  <i className="bi bi-clock-history fs-4"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibrarianReportsPage;

