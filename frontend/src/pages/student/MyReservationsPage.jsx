import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const MyReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMyReservations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reservations/my-reservations');
      setReservations(res.data.reservations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReservations();
  }, []);

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation request?')) {
      return;
    }

    try {
      await api.put(`/reservations/${id}/cancel`);
      setSuccess('Reservation cancelled successfully');
      fetchMyReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge bg-light text-dark border">Approved & Borrowed</span>;
      case 'pending':
        return <span className="badge bg-light text-dark border">In Queue</span>;
      case 'completed':
        return <span className="badge bg-light text-dark border">Fulfilled</span>;
      case 'cancelled':
        return <span className="badge bg-light text-dark border">Cancelled</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reservations</h3>
          <p className="text-muted small mb-0">Track your book reservation holds and queue status</p>
        </div>
        <Link to="/student/catalog" className="btn btn-dark btn-sm">
          <i className="bi bi-search me-1"></i> Browse Catalog
        </Link>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Reservations Table Matching Reference Image Screen 4 */}
      <div className="card shadow-sm border">
        <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-bookmark-check me-2"></i>My Book Reservations ({reservations.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading your reservations..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Book Details</th>
                    <th>Date Requested</th>
                    <th>Status</th>
                    <th>Availability</th>
                    <th>My Note</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length > 0 ? (
                    reservations.map((item) => (
                      <tr key={item._id}>
                        {/* Book thumbnail icon */}
                        <td>
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '40px', height: '48px' }}
                          >
                            <i className="bi bi-bookmark fs-5"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{item.book?.title}</div>
                          <small className="text-muted">by {item.book?.author} • {item.book?.category}</small>
                        </td>
                        <td>{new Date(item.requestDate || item.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div>{getStatusBadge(item.status)}</div>
                          {item.status === 'approved' && (
                            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-book me-1"></i>Active in Borrowed Books
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {item.book?.availableCopies > 0
                              ? `${item.book?.availableCopies} available`
                              : '0 in stock'}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">{item.notes || '—'}</small>
                        </td>
                        <td className="text-end">
                          {item.status === 'pending' && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleCancelReservation(item._id)}
                            >
                              <i className="bi bi-x-circle me-1"></i> Cancel
                            </button>
                          )}
                          {item.status === 'approved' && (
                            <span className="badge bg-light text-dark border">
                              Ready for Pickup
                            </span>
                          )}
                          {item.status === 'completed' && (
                            <span className="text-muted small">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <i className="bi bi-bookmark-x fs-2 d-block mb-2 text-muted"></i>
                        You have not made any book reservations yet.
                        <div className="mt-3">
                          <Link to="/student/catalog" className="btn btn-dark btn-sm">
                            Browse Catalog to Reserve
                          </Link>
                        </div>
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

export default MyReservationsPage;
