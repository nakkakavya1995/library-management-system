import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const AdminActivityPage = () => {
  const [issues, setIssues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('checkouts'); // checkouts, queue, all
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, resRes] = await Promise.all([
        api.get('/issues'),
        api.get('/reservations')
      ]);

      setIssues(issuesRes.data.issues || []);
      setReservations(resRes.data.reservations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch circulation records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReturnBook = async (issueId) => {
    try {
      const res = await api.put(`/issues/${issueId}/return`, {
        condition: 'good',
        notes: 'Returned at admin desk'
      });
      setSuccess(`Book returned successfully. Fine charged: ₹${res.data.issue?.fineAmount || 0}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return book');
    }
  };

  const handleApproveReservation = async (reservationId) => {
    try {
      await api.put(`/reservations/${reservationId}/status`, { status: 'approved' });
      setSuccess('Reservation approved and held for pickup');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve reservation');
    }
  };

  const currentCheckouts = issues.filter((i) => i.status === 'issued');
  const pendingRequests = reservations.filter((r) => r.status === 'pending');

  const filteredCheckouts = currentCheckouts.filter((i) => {
    const t = i.book?.title?.toLowerCase() || '';
    const s = i.student?.name?.toLowerCase() || '';
    const q = search.toLowerCase();
    return t.includes(q) || s.includes(q);
  });

  const filteredQueue = pendingRequests.filter((r) => {
    const t = r.book?.title?.toLowerCase() || '';
    const s = r.student?.name?.toLowerCase() || '';
    const q = search.toLowerCase();
    return t.includes(q) || s.includes(q);
  });

  const filteredAll = issues.filter((i) => {
    const t = i.book?.title?.toLowerCase() || '';
    const s = i.student?.name?.toLowerCase() || '';
    const q = search.toLowerCase();
    return t.includes(q) || s.includes(q);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Issue & Return</h3>
          <p className="text-muted small mb-0">Monitor active loans, countdown due dates, and process reservation queue.</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Tabs matching Reference Screen 5 */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="btn-group btn-group-sm">
          <button
            type="button"
            className={`btn ${activeTab === 'checkouts' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('checkouts')}
          >
            Current Checkouts ({currentCheckouts.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'queue' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('queue')}
          >
            Requests & Queue ({pendingRequests.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('all')}
          >
            All Activity ({issues.length})
          </button>
        </div>

        <div className="input-group input-group-sm" style={{ maxWidth: '300px' }}>
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

      {loading ? (
        <LoadingSpinner text="Loading circulation data..." />
      ) : activeTab === 'checkouts' ? (
        /* Current Checkouts Table */
        <div className="card shadow-sm border">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Book Details</th>
                    <th>Borrower</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Countdown / Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCheckouts.length > 0 ? (
                    filteredCheckouts.map((item) => {
                      const diff = new Date(item.dueDate).getTime() - new Date().getTime();
                      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={item._id}>
                          <td>
                            <div
                              className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                              style={{ width: '38px', height: '46px', flexShrink: 0 }}
                            >
                              <i className="bi bi-book"></i>
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">{item.book?.title}</div>
                            <small className="text-muted">{item.book?.category}</small>
                          </td>
                          <td>
                            <div className="fw-semibold">{item.student?.name}</div>
                            <small className="text-muted">{item.student?.studentId || item.student?.email}</small>
                          </td>
                          <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                          <td>
                            <span className={item.isOverdue ? 'fw-bold text-danger' : ''}>
                              {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            {item.isOverdue ? (
                              <span className="badge bg-light text-dark border">
                                Overdue ({item.daysOverdue}d) • Fine: ₹{item.currentFine || item.fineAmount}
                              </span>
                            ) : (
                              <span className="badge bg-light text-dark border">
                                {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining
                              </span>
                            )}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => handleReturnBook(item._id)}
                            >
                              Return Book
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No active checkouts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'queue' ? (
        /* Requests & Queue Table */
        <div className="card shadow-sm border">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Book Details</th>
                    <th>Borrower</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Available Copies</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.length > 0 ? (
                    filteredQueue.map((req) => (
                      <tr key={req._id}>
                        <td>
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '38px', height: '46px', flexShrink: 0 }}
                          >
                            <i className="bi bi-book"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold">{req.book?.title}</div>
                          <small className="text-muted">{req.book?.category}</small>
                        </td>
                        <td>
                          <div className="fw-semibold">{req.student?.name}</div>
                          <small className="text-muted">{req.student?.studentId || req.student?.email}</small>
                        </td>
                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            In Queue
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {req.book?.availableCopies} copies
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-dark btn-sm"
                            onClick={() => handleApproveReservation(req._id)}
                          >
                            Accept & Allow Borrow
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No pending reservation requests in queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* All Activity Log Table */
        <div className="card shadow-sm border">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Borrower</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAll.length > 0 ? (
                    filteredAll.map((record) => (
                      <tr key={record._id}>
                        <td>
                          <div className="fw-semibold">{record.book?.title}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{record.student?.name}</div>
                          <small className="text-muted">{record.student?.studentId}</small>
                        </td>
                        <td>{new Date(record.issueDate).toLocaleDateString()}</td>
                        <td>{new Date(record.dueDate).toLocaleDateString()}</td>
                        <td>
                          {record.returnDate
                            ? new Date(record.returnDate).toLocaleDateString()
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border text-capitalize">
                            {record.status}
                          </span>
                        </td>
                        <td>
                          {record.fineAmount > 0 ? (
                            <span className="fw-semibold">
                              ₹{record.fineAmount.toFixed(2)} ({record.finePaid ? 'Paid' : 'Unpaid'})
                            </span>
                          ) : (
                            <span className="text-muted">₹0.00</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No records found.
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

export default AdminActivityPage;
