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
  const [reservations, setReservations] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
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
        api.get('/reservations'),
        api.get('/issues?status=issued'),
        api.get('/books'),
        api.get('/users?role=student')
      ]);

      setStats(statsRes.data.stats);
      setBooks(booksRes.data.books || []);
      setStudents(usersRes.data.users || []);
      setReservations(resRes.data.reservations?.slice(0, 10) || []);

      const activeIssues = issuesRes.data.issues || [];
      const returns = activeIssues.filter((i) => i.returnStatus === 'requested');
      const renewals = activeIssues.filter((i) => i.renewalStatus === 'requested');
      const overdues = activeIssues.filter((i) => i.isOverdue);

      setReturnRequests(returns);
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

  const handleAcceptReturn = async (issueId, bookTitle, studentName) => {
    try {
      const res = await api.put(`/issues/${issueId}/accept-return`, { finePaid: true });
      setSuccess(
        res.data.message ||
          `Return accepted for "${bookTitle}" (${studentName})! The book has been restocked and the student can now borrow again.`
      );
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error accepting return request');
    }
  };

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
          <p className="text-muted small mb-0">Overview of book issues and returns, inventory, member activity, and transactions</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/librarian/circulation" className="btn btn-dark btn-sm">
            <i className="bi bi-arrow-left-right me-1"></i> Issue & Return
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

        {/* 3. Total Fines */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Fines"
            value={`₹${(stats?.totalUnpaidFine || 0).toFixed(2)}`}
            icon="bi-cash-coin"
            color="danger"
          />
        </div>

        {/* 4. Total Books */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Books"
            value={`${stats?.totalBooks || books.length || 0} Books`}
            icon="bi-book"
            color="info"
          />
        </div>
      </div>

      {/* Reserved Books Section */}
      <div className="card shadow-sm border mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-bookmark-check me-2"></i>Reserved Books ({reservations.length})
          </span>
          <Link to="/librarian/reservations" className="btn btn-link btn-sm text-decoration-none p-0 text-dark">
            View All Reservations
          </Link>
        </div>
        <div className="card-body p-0">
          {reservations.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Student Details</th>
                    <th>Reserved On</th>
                    <th>Availability</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr key={res._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '32px', height: '38px', flexShrink: 0 }}
                          >
                            <i className="bi bi-bookmark"></i>
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{res.book?.title}</div>
                            <small className="text-muted">{res.book?.author ? `by ${res.book?.author}` : (res.book?.category || '')}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{res.student?.name}</div>
                        <small className="text-muted">{res.student?.studentId ? `${res.student?.studentId} • ` : ''}{res.student?.email}</small>
                      </td>
                      <td>
                        <div className="small">{new Date(res.createdAt || res.reservationDate || Date.now()).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {res.book?.availableCopies ?? 0} copies in stock
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border text-capitalize">
                          {res.status === 'approved' ? (
                            <><i className="bi bi-check-circle-fill me-1"></i>Approved</>
                          ) : res.status === 'completed' ? (
                            'Borrowed & Collected'
                          ) : res.status === 'rejected' ? (
                            'Rejected'
                          ) : (
                            'Pending Hold'
                          )}
                        </span>
                      </td>
                      <td className="text-end">
                        {res.status === 'pending' ? (
                          <button
                            className="btn btn-dark btn-sm"
                            onClick={() => handleQuickApproveReservation(res._id)}
                          >
                            <i className="bi bi-check2-circle me-1"></i>Accept & Allow Borrow
                          </button>
                        ) : (
                          <span className="text-muted small">
                            {res.status === 'approved' ? 'Allowed to Borrow' : 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted small">
              <i className="bi bi-check-circle fs-3 d-block mb-1 text-muted"></i>
              No book reservations recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Pending Return Requests (from students) */}
      {returnRequests.length > 0 && (
        <div className="card shadow-sm border mb-4 border-success">
          <div
            className="card-header text-white d-flex justify-content-between align-items-center"
            style={{ backgroundColor: '#059669' }}
          >
            <span className="fw-semibold">
              <i className="bi bi-box-arrow-in-left me-2"></i>Pending Return Requests ({returnRequests.length})
            </span>
            <span className="badge bg-white text-success fw-bold">Action Required</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Student</th>
                    <th>Requested On</th>
                    <th>Due Date</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRequests.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="fw-semibold text-dark">{r.book?.title}</div>
                        <small className="text-muted">{r.book?.author}</small>
                      </td>
                      <td>
                        <div className="fw-semibold">{r.student?.name}</div>
                        <small className="text-muted">{r.student?.studentId || r.student?.email}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {r.returnRequestDate ? new Date(r.returnRequestDate).toLocaleDateString() : 'Today'}
                        </span>
                      </td>
                      <td>
                        <span>{new Date(r.dueDate).toLocaleDateString()}</span>
                        {r.isOverdue && (
                          <span className="ms-2 badge bg-danger text-white">Overdue</span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-success btn-sm text-nowrap fw-semibold shadow-sm rounded-pill px-3"
                          style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                          onClick={() => handleAcceptReturn(r._id, r.book?.title, r.student?.name)}
                        >
                          <i className="bi bi-check2-circle me-1"></i>Accept Return & Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pending Renewal Requests (if any) */}
      {pendingRenewals.length > 0 && (
        <div className="card shadow-sm border mb-4">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <span className="fw-semibold">
              <i className="bi bi-arrow-repeat me-2"></i>Pending Renewal Requests ({pendingRenewals.length})
            </span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Due Date</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRenewals.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="fw-semibold">{r.book?.title}</div>
                        <small className="text-muted">{r.book?.author}</small>
                      </td>
                      <td>
                        <div>{r.student?.name}</div>
                        <small className="text-muted">{r.student?.studentId || r.student?.email}</small>
                      </td>
                      <td>{new Date(r.dueDate).toLocaleDateString()}</td>
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
          </div>
        </div>
      )}

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
            <div className="text-center py-3 text-muted small">
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
