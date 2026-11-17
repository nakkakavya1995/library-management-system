import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const LibrarianDashboard = () => {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingReservations, setPendingReservations] = useState([]);
  const [pendingRenewals, setPendingRenewals] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, resRes, issuesRes, booksRes, usersRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/reservations?status=pending'),
        api.get('/issues?status=issued'),
        api.get('/books'),
        api.get('/users?role=student')
      ]);

      setStats(statsRes.data.stats);
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

  const handleQuickApproveReservation = async (reservationId) => {
    try {
      await api.put(`/reservations/${reservationId}/status`, { status: 'approved' });
      setSuccess('Reservation approved and book borrowed successfully');
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

      {/* Top 4 Metric Cards */}
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

        {/* 2. Issued Books */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Issued Books"
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

        {/* 4. Total Books */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Books"
            value={`${stats?.totalBooks || books.length || 0} Books`}
            icon="bi-book"
            color="info"
            subtitle={`${stats?.totalCopies || 0} total copies`}
          />
        </div>
      </div>

      {/* Action Required */}
      <div className="card shadow-sm border mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-bell me-2"></i>Action Required ({pendingReservations.length + pendingRenewals.length})
          </span>
          <Link to="/librarian/reservations" className="btn btn-link btn-sm text-decoration-none p-0 text-dark">
            Manage Reservations
          </Link>
        </div>
        <div className="card-body p-0">
          {pendingReservations.length > 0 || pendingRenewals.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Request Type</th>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Date</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReservations.map((res) => (
                    <tr key={res._id}>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-bookmark me-1"></i>Reservation
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold">{res.book?.title}</div>
                        <small className="text-muted">{res.book?.category || res.book?.author}</small>
                      </td>
                      <td>
                        <div>{res.student?.name}</div>
                        <small className="text-muted">{res.student?.studentId || res.student?.email}</small>
                      </td>
                      <td>
                        <div className="small">{new Date(res.createdAt || res.reservationDate || Date.now()).toLocaleDateString()}</div>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-dark btn-sm"
                          onClick={() => handleQuickApproveReservation(res._id)}
                        >
                          <i className="bi bi-check2-circle me-1"></i>Accept & Allow Borrow
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingRenewals.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-arrow-repeat me-1"></i>Renewal
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold">{r.book?.title}</div>
                        <small className="text-muted">{r.book?.category || r.book?.author}</small>
                      </td>
                      <td>
                        <div>{r.student?.name}</div>
                        <small className="text-muted">{r.student?.studentId || r.student?.email}</small>
                      </td>
                      <td>
                        <div className="small">{new Date(r.dueDate).toLocaleDateString()}</div>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-dark btn-sm"
                          onClick={() => handleQuickApproveRenewal(r._id)}
                        >
                          <i className="bi bi-check2 me-1"></i>Approve (+7d)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted small">
              <i className="bi bi-check-circle fs-3 d-block mb-1 text-muted"></i>
              No pending reservations or renewal requests.
            </div>
          )}
        </div>
      </div>

      {/* Overdue Checkouts */}
      <div className="card shadow-sm border mb-4">
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
            <div className="text-center py-4 text-muted small">
              <i className="bi bi-check-circle fs-3 d-block mb-1 text-muted"></i>
              All borrowed books are currently on time!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;
