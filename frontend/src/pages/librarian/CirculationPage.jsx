import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const CirculationPage = () => {
  const [activeTab, setActiveTab] = useState('checkouts'); // 'checkouts' | 'requests'
  const [issues, setIssues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const fetchCirculationData = async () => {
    try {
      setLoading(true);
      const [issuesRes, resRes] = await Promise.all([
        api.get('/issues?status=issued'),
        api.get('/reservations?status=pending')
      ]);

      setIssues(issuesRes.data.issues || []);
      setReservations(resRes.data.reservations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load circulation records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculationData();
  }, []);

  const handleReturn = async (issueId) => {
    try {
      await api.put(`/issues/${issueId}/return`, { finePaid: true });
      setSuccess('Book successfully returned and restocked');
      fetchCirculationData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process return');
    }
  };

  const handleApproveReservation = async (reservationId) => {
    try {
      await api.put(`/reservations/${reservationId}/status`, { status: 'approved' });
      setSuccess('Reservation approved. Student notified via email!');
      fetchCirculationData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve reservation');
    }
  };

  const handleApproveRenewal = async (issueId) => {
    try {
      await api.put(`/issues/${issueId}/handle-renewal`, { action: 'approve' });
      setSuccess('Renewal approved! Extended by 7 days.');
      fetchCirculationData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve renewal');
    }
  };

  const pendingRenewals = issues.filter((i) => i.renewalStatus === 'requested');

  const filteredIssues = issues.filter((i) => {
    const t = i.book?.title?.toLowerCase() || '';
    const s = i.student?.name?.toLowerCase() || '';
    const id = i.student?.studentId?.toLowerCase() || '';
    const q = search.toLowerCase();
    return t.includes(q) || s.includes(q) || id.includes(q);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Circulation</h3>
          <p className="text-muted small mb-0">Unified circulation desk for managing active checkouts, loan requests, and returns</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/librarian/issue" className="btn btn-dark btn-sm">
            <i className="bi bi-journal-plus me-1"></i> Issue Book
          </Link>
          <Link to="/librarian/return" className="btn btn-outline-dark btn-sm">
            <i className="bi bi-box-arrow-in-left me-1"></i> Return Counter
          </Link>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Tabs Matching Reference Image Screen 5 */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeTab === 'checkouts' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('checkouts')}
        >
          Current Checkouts ({issues.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'requests' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests & Queue ({reservations.length + pendingRenewals.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="card shadow-sm border mb-4">
        <div className="card-body p-3">
          <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by book title or student..."
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

      {loading ? (
        <LoadingSpinner text="Loading circulation data..." />
      ) : activeTab === 'checkouts' ? (
        /* Current Checkouts Table Matching Reference Image Screen 5 */
        <div className="card shadow-sm border">
          <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-journal-check me-2"></i>Active Checkouts ({filteredIssues.length})
            </span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Book Details</th>
                    <th>Borrowing Student</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length > 0 ? (
                    filteredIssues.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '38px', height: '46px' }}
                          >
                            <i className="bi bi-book fs-5"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{item.book?.title}</div>
                          <small className="text-muted">by {item.book?.author}</small>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{item.student?.name}</div>
                          <small className="text-muted">{item.student?.studentId || item.student?.email}</small>
                        </td>
                        <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                        <td>
                          <span className="fw-semibold">
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {item.isOverdue ? `Overdue (${item.daysOverdue}d)` : 'On time'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-dark btn-sm me-1"
                            onClick={() => handleReturn(item._id)}
                            title="Return Book"
                          >
                            Return
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No active checkouts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Requests & Queue Table Matching Reference Image Screen 5 */
        <div className="card shadow-sm border">
          <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-inbox me-2"></i>Pending Requests & Holds ({reservations.length + pendingRenewals.length})
            </span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Book Details</th>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length > 0 || pendingRenewals.length > 0 ? (
                    <>
                      {reservations.map((res) => (
                        <tr key={res._id}>
                          <td>
                            <span className="badge bg-light text-dark border">Reservation</span>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{res.book?.title}</div>
                            <small className="text-muted">Available: {res.book?.availableCopies}</small>
                          </td>
                          <td>
                            <div>{res.student?.name}</div>
                            <small className="text-muted">{res.student?.studentId || res.student?.email}</small>
                          </td>
                          <td>{new Date(res.requestDate || res.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className="badge bg-light text-dark border">Pending Hold</span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-dark btn-sm"
                              onClick={() => handleApproveReservation(res._id)}
                            >
                              Reserve Approved
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pendingRenewals.map((r) => (
                        <tr key={r._id}>
                          <td>
                            <span className="badge bg-light text-dark border">Renewal (+7d)</span>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{r.book?.title}</div>
                            <small className="text-muted">Due: {new Date(r.dueDate).toLocaleDateString()}</small>
                          </td>
                          <td>
                            <div>{r.student?.name}</div>
                            <small className="text-muted">{r.student?.studentId || r.student?.email}</small>
                          </td>
                          <td>{new Date(r.renewalRequestDate || r.issueDate).toLocaleDateString()}</td>
                          <td>
                            <span className="badge bg-light text-dark border">Extension Request</span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-dark btn-sm"
                              onClick={() => handleApproveRenewal(r._id)}
                            >
                              Approve Renewal
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        No pending requests in the queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CirculationPage;

