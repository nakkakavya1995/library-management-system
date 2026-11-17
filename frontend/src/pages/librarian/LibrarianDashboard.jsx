import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const LibrarianDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingReservations, setPendingReservations] = useState([]);
  const [pendingRenewals, setPendingRenewals] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Quick Issue state
  const [quickBookId, setQuickBookId] = useState('');
  const [quickStudentId, setQuickStudentId] = useState('');
  const [issuing, setIssuing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, resRes, issuesRes, activityRes, booksRes, usersRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/reservations?status=pending'),
        api.get('/issues?status=issued'),
        api.get('/reports/activity'),
        api.get('/books'),
        api.get('/users?role=student')
      ]);

      setStats(statsRes.data.stats);
      setActivity(activityRes.data);
      setBooks(booksRes.data.books || []);
      setStudents(usersRes.data.users || []);
      setPendingReservations(resRes.data.reservations?.slice(0, 5) || []);

      const activeIssues = issuesRes.data.issues || [];
      const renewals = activeIssues.filter((i) => i.renewalStatus === 'requested');
      const overdues = activeIssues.filter((i) => i.isOverdue);

      setPendingRenewals(renewals.slice(0, 5));
      setOverdueList(overdues.slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load librarian dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickIssue = async (e) => {
    e.preventDefault();
    if (!quickBookId || !quickStudentId) {
      setError('Please select both a book and a student');
      return;
    }

    try {
      setIssuing(true);
      setError('');
      const res = await api.post('/issues', {
        bookId: quickBookId,
        studentId: quickStudentId
      });

      setSuccess(`Book successfully issued to ${res.data.issue?.student?.name || 'student'}!`);
      setQuickBookId('');
      setQuickStudentId('');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  };

  const handleQuickApproveReservation = async (reservationId) => {
    try {
      await api.put(`/reservations/${reservationId}/status`, { status: 'approved' });
      setSuccess('Reservation approved successfully');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving reservation');
    }
  };

  const handleQuickApproveRenewal = async (issueId) => {
    try {
      await api.put(`/issues/${issueId}/handle-renewal`, { action: 'approve' });
      setSuccess('Renewal approved successfully (extended by 7 days)');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving renewal');
    }
  };

  if (loading) return <LoadingSpinner text="Loading Librarian Dashboard..." />;

  const recentTransactions = activity?.recentIssues?.slice(0, 6) || [];
  const availableBooks = books.filter((b) => b.availableCopies > 0);

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Dashboard</h3>
          <p className="text-muted small mb-0">Overview of circulation, inventory, member activity, and transactions</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/librarian/circulation" className="btn btn-dark btn-sm">
            <i className="bi bi-arrow-left-right me-1"></i> Circulation Desk
          </Link>
          <Link to="/librarian/books" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-plus-circle me-1"></i> Manage Books
          </Link>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Top 4 Metric Cards - Matching Reference Image Screen 1 */}
      <div className="row g-3 mb-4">
        {/* 1. Total Users */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Users"
            value={stats?.totalStudents || students.length || 0}
            icon="bi-people"
            color="primary"
            subtitle="Registered students"
          />
        </div>

        {/* 2. Active Checkouts */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Active Checkouts"
            value={`${stats?.totalIssued || 0} Books`}
            icon="bi-journal-arrow-up"
            color="warning"
            subtitle={`${overdueList.length} past due`}
          />
        </div>

        {/* 3. Overdue Fines */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Overdue Fines"
            value={`₹${(stats?.totalUnpaidFine || 0).toFixed(2)}`}
            icon="bi-cash-coin"
            color="danger"
            subtitle="₹5.00 / overdue day"
          />
        </div>

        {/* 4. Total Inventory */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Inventory"
            value={`${stats?.totalCopies || 0} Copies`}
            icon="bi-book"
            color="info"
            subtitle={`${stats?.totalBooks || books.length} book titles`}
          />
        </div>
      </div>

      {/* Main 2-Column Split Matching Reference Image */}
      <div className="row g-4 mb-4">
        {/* Left Column: Admin Analytics & Activity Log */}
        <div className="col-lg-7">
          <div className="card shadow-sm border h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">
                <i className="bi bi-clock-history me-2"></i>Library Analytics & Activity Log
              </span>
              <span className="badge bg-light text-dark border">Live Log</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Activity Event</th>
                      <th>Member</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                                style={{ width: '32px', height: '36px', flexShrink: 0 }}
                              >
                                <i className="bi bi-book"></i>
                              </div>
                              <div>
                                <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                                  {item.book?.title}
                                </div>
                                <small className="text-muted">{item.book?.category}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>{item.student?.name}</div>
                            <small className="text-muted">{item.student?.studentId || item.student?.email}</small>
                          </td>
                          <td>
                            <div className="small">{new Date(item.issueDate).toLocaleDateString()}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {item.status === 'issued' ? (item.isOverdue ? 'Overdue' : 'Issued') : 'Returned'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">
                          No recent transactions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Quick Summary Counts at Bottom of Table */}
              <div className="p-3 bg-light border-top d-flex justify-content-between text-muted small">
                <span>Total Titles: <strong>{stats?.totalBooks || 0}</strong></span>
                <span>Active Loans: <strong>{stats?.totalIssued || 0}</strong></span>
                <span>Pending Reservations: <strong>{pendingReservations.length}</strong></span>
                <span>Late Books: <strong>{overdueList.length}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Analytics & Quick Issue */}
        <div className="col-lg-5">
          {/* Quick Issue Box Matching Reference Image */}
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">
                <i className="bi bi-lightning-charge me-2"></i>Quick Issue
              </span>
              <small className="text-muted">Instant Checkout</small>
            </div>
            <div className="card-body p-3">
              <form onSubmit={handleQuickIssue}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Book *</label>
                  <select
                    className="form-select form-select-sm"
                    value={quickBookId}
                    onChange={(e) => setQuickBookId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Available Book --</option>
                    {availableBooks.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.title} by {b.author} ({b.availableCopies} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Student *</label>
                  <select
                    className="form-select form-select-sm"
                    value={quickStudentId}
                    onChange={(e) => setQuickStudentId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.studentId || s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-dark btn-sm w-100"
                  disabled={issuing || !quickBookId || !quickStudentId}
                >
                  {issuing ? 'Issuing...' : 'Quick Issue Book (14 Days)'}
                </button>
              </form>
            </div>
          </div>

          {/* Pending Requests & Renewals */}
          <div className="card shadow-sm border">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold">
                <i className="bi bi-bell me-2"></i>Action Required ({pendingReservations.length + pendingRenewals.length})
              </span>
            </div>
            <div className="card-body p-0">
              {pendingReservations.length > 0 || pendingRenewals.length > 0 ? (
                <ul className="list-group list-group-flush small">
                  {pendingReservations.map((res) => (
                    <li key={res._id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                      <div>
                        <div className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>
                          {res.book?.title}
                        </div>
                        <small className="text-muted">Res: {res.student?.name}</small>
                      </div>
                      <button
                        className="btn btn-dark btn-sm"
                        onClick={() => handleQuickApproveReservation(res._id)}
                      >
                        Approve Hold
                      </button>
                    </li>
                  ))}
                  {pendingRenewals.map((r) => (
                    <li key={r._id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                      <div>
                        <div className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>
                          {r.book?.title}
                        </div>
                        <small className="text-muted">Renew: {r.student?.name}</small>
                      </div>
                      <button
                        className="btn btn-dark btn-sm"
                        onClick={() => handleQuickApproveRenewal(r._id)}
                      >
                        Approve (+7d)
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-check-circle fs-3 d-block mb-1 text-muted"></i>
                  No pending reservations or renewal requests.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Attention Bar Matching Reference Image */}
      <div className="card shadow-sm border">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-exclamation-triangle me-2"></i>Overdue Checkouts ({overdueList.length})
          </span>
          <Link to="/librarian/fines" className="btn btn-link btn-sm text-decoration-none p-0 text-dark">
            View Fines & Penalties
          </Link>
        </div>
        <div className="card-body p-0">
          {overdueList.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrower</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                    <th>Late Fine</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueList.map((item) => (
                    <tr key={item._id}>
                      <td className="fw-semibold">{item.book?.title}</td>
                      <td>
                        <div>{item.student?.name}</div>
                        <small className="text-muted">{item.student?.phone || item.student?.email}</small>
                      </td>
                      <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {item.daysOverdue} days
                        </span>
                      </td>
                      <td className="fw-bold text-dark">₹{item.currentFine}</td>
                      <td className="text-end">
                        <Link to="/librarian/return" className="btn btn-outline-dark btn-sm">
                          Process Return
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-3 text-muted small">
              All borrowed books are currently on time!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;
