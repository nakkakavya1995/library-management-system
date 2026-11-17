import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const AdminReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/reservations', { params });
      setReservations(res.data.reservations);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch book reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/reservations/${id}/status`, { status });
      setSuccess(`Reservation marked as ${status}`);
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reservation status');
    }
  };

  const getStatusBadge = () => {
    return 'bg-light text-dark border';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reservations & Queue</h3>
          <p className="text-muted small mb-0">Monitor reservation queue, book allocations, and pickup fulfillments.</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setStatusFilter('')}
        >
          All ({reservations.length})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'approved' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setStatusFilter('approved')}
        >
          Approved
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'completed' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setStatusFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Reservations Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching reservations..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Book Details</th>
                    <th>Student Details</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Available</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length > 0 ? (
                    reservations.map((res) => (
                      <tr key={res._id}>
                        <td>
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '38px', height: '46px', flexShrink: 0 }}
                          >
                            <i className="bi bi-book"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold">{res.book?.title}</div>
                          <small className="text-muted">{res.book?.category}</small>
                        </td>
                        <td>
                          <div className="fw-semibold">{res.student?.name}</div>
                          <small className="text-muted">
                            {res.student?.studentId || res.student?.email}
                          </small>
                        </td>
                        <td>{new Date(res.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-light text-dark border text-capitalize">
                            {res.status === 'pending' ? 'In Queue' : res.status === 'approved' ? 'Ready for Pickup' : res.status}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {res.book?.availableCopies} copies
                          </span>
                        </td>
                        <td className="text-end">
                          {res.status === 'pending' && (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-dark"
                                title="Accept reservation and grant permission to borrow"
                                onClick={() => handleUpdateStatus(res._id, 'approved')}
                              >
                                Accept & Allow Borrow
                              </button>
                              <button
                                className="btn btn-outline-secondary"
                                title="Reject reservation"
                                onClick={() => handleUpdateStatus(res._id, 'rejected')}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          {res.status === 'approved' && (
                            <span className="badge bg-light text-dark border">
                              <i className="bi bi-check-circle me-1"></i>Issued & Borrowed
                            </span>
                          )}
                          {['completed', 'cancelled', 'rejected'].includes(res.status) && (
                            <span className="text-muted small">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No reservations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReservationsPage;

