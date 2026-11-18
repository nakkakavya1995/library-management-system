import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const ReservationsPage = () => {
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
      setError(err.response?.data?.message || 'Failed to fetch reservations');
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
      setError(err.response?.data?.message || 'Failed to update reservation');
    }
  };

  const getStatusBadge = () => {
    return 'bg-light text-dark border';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reservations</h3>
          <p className="text-muted small mb-0">Review student book reservations</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setStatusFilter('')}
        >
          All Requests
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

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching reservations..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Book</th>
                    <th>Student Details</th>
                    <th>Requested On</th>
                    <th>Student Note</th>
                    <th>Status</th>
                    <th>Availability</th>
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
                            style={{ width: '38px', height: '46px' }}
                          >
                            <i className="bi bi-bookmark fs-5"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{res.book?.title}</div>
                          <small className="text-muted">by {res.book?.author}</small>
                        </td>
                        <td>
                          <div className="fw-semibold">{res.student?.name}</div>
                          <small className="text-muted">
                            {res.student?.studentId} • {res.student?.email}
                          </small>
                        </td>
                        <td>{new Date(res.createdAt).toLocaleDateString()}</td>
                        <td>
                          <small className="text-muted">{res.notes || 'No note provided'}</small>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(res.status)} text-capitalize`}>
                            {res.status}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {res.book?.availableCopies} available
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
                                title="Reject"
                                onClick={() => handleUpdateStatus(res._id, 'rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {res.status === 'approved' && (
                            <span className="badge bg-light text-dark border">
                              <i className="bi bi-check-circle me-1"></i>Issued & Borrowed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No reservations found for current filter.
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

export default ReservationsPage;
