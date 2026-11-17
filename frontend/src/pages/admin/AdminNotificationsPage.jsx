import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const AdminNotificationsPage = () => {
  const [issues, setIssues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, overdue, reservations

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, resRes] = await Promise.all([
        api.get('/issues'),
        api.get('/reservations?status=pending')
      ]);

      const overdueList = issuesRes.data.issues.filter(
        (i) => i.status === 'issued' && i.isOverdue
      );
      setIssues(overdueList);
      setReservations(resRes.data.reservations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendReminder = async (issueId, studentName) => {
    try {
      const res = await api.post(`/issues/${issueId}/notify`);
      setSuccess(res.data.message || `Overdue email reminder sent to ${studentName}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    }
  };

  const totalNotifications = issues.length + reservations.length;

  if (loading) return <LoadingSpinner text="Fetching system notifications & alerts..." />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-bell-fill"></i>
            Notifications
            {totalNotifications > 0 && (
              <span className="badge rounded-pill bg-dark text-white fs-6">{totalNotifications}</span>
            )}
          </h3>
          <p className="text-muted mb-0">
            Alerts for late books and pending reservations.
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Summary KPI Badges */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Late Book Alerts</div>
            <h3 className="fw-bold text-dark mb-0">{issues.length}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Pending Reservations</div>
            <h3 className="fw-bold text-dark mb-0">{reservations.length}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Total Alerts</div>
            <h3 className="fw-bold text-dark mb-0">{totalNotifications}</h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <ul className="nav nav-pills mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Alerts ({totalNotifications})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'overdue' ? 'active' : ''}`}
            onClick={() => setFilter('overdue')}
          >
            Overdue Reminders ({issues.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'reservations' ? 'active' : ''}`}
            onClick={() => setFilter('reservations')}
          >
            Pending Reservations ({reservations.length})
          </button>
        </li>
      </ul>

      {/* Overdue Alerts Section */}
      {(filter === 'all' || filter === 'overdue') && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark">
              <i className="bi bi-clock-history me-2"></i>
              Late Return Alerts ({issues.length})
            </h5>
            <span className="badge bg-light text-dark border">Fine: ₹5/day</span>
          </div>
          <div className="card-body p-0">
            {issues.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-check-circle fs-2 d-block mb-2 text-dark"></i>
                No books are currently overdue. All returns are up to date.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Book</th>
                      <th>Student</th>
                      <th>Due Date</th>
                      <th>Overdue Days</th>
                      <th>Fine Amount</th>
                      <th>Notification Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="fw-bold">{item.book?.title}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{item.student?.name}</div>
                          <small className="text-muted">{item.student?.email}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-dark">
                            {item.overdueDays} day(s) late
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-dark">₹{item.currentFine}</span>
                        </td>
                        <td>
                          {item.overdueNotified ? (
                            <span className="badge bg-light text-dark border">
                              Notified on {item.notificationDate ? new Date(item.notificationDate).toLocaleDateString() : 'Sent'}
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border">Pending Alert</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => handleSendReminder(item._id, item.student?.name)}
                          >
                            <i className="bi bi-send-fill me-1"></i>
                            {item.overdueNotified ? 'Resend' : 'Send Alert'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Reservations Section */}
      {(filter === 'all' || filter === 'reservations') && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark">
              <i className="bi bi-bookmark me-2"></i>
              Pending Reservations ({reservations.length})
            </h5>
          </div>
          <div className="card-body p-0">
            {reservations.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-check-circle text-muted fs-2 d-block mb-2"></i>
                No pending reservations waiting for action.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Book</th>
                      <th>Student</th>
                      <th>Requested Date</th>
                      <th>Status</th>
                      <th>Available Copies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res) => (
                      <tr key={res._id}>
                        <td>
                          <div className="fw-bold">{res.book?.title}</div>
                          <small className="text-muted">By {res.book?.author}</small>
                        </td>
                        <td>
                          <div className="fw-semibold">{res.student?.name}</div>
                          <small className="text-muted">{res.student?.email}</small>
                        </td>
                        <td>{new Date(res.reservationDate || res.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-warning text-dark text-capitalize">
                            {res.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${res.book?.availableCopies > 0 ? 'bg-success' : 'bg-secondary'}`}>
                            {res.book?.availableCopies} available
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;

