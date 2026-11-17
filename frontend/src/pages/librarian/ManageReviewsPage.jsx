import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const ManageReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews');
      setReviews(res.data.reviews);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id, bookTitle) => {
    if (!window.confirm(`Are you sure you want to remove this review for "${bookTitle}"?`)) {
      return;
    }

    try {
      await api.delete(`/reviews/${id}`);
      setSuccess('Review removed successfully');
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const bookTitle = r.book?.title?.toLowerCase() || '';
    const studentName = r.student?.name?.toLowerCase() || '';
    const comment = r.comment?.toLowerCase() || '';
    const s = search.toLowerCase();

    const matchesSearch = bookTitle.includes(s) || studentName.includes(s) || comment.includes(s);
    const matchesRating = ratingFilter ? r.rating === parseInt(ratingFilter, 10) : true;

    return matchesSearch && matchesRating;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reviews</h3>
          <p className="text-muted small mb-0">Check ratings and manage reviews</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border p-3">
            <div className="text-muted small text-uppercase fw-semibold">Average Rating</div>
            <div className="d-flex align-items-center gap-2 mt-1">
              <span className="h3 fw-bold mb-0 text-dark">{avgRating}</span>
              <small className="text-muted">/ 5.0</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border p-3">
            <div className="text-muted small text-uppercase fw-semibold">Total Reviews</div>
            <div className="h3 fw-bold mb-0 text-dark">{reviews.length}</div>
            <small className="text-muted">From students</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border p-3">
            <div className="text-muted small text-uppercase fw-semibold">5-Star Reviews</div>
            <div className="h3 fw-bold mb-0 text-dark">
              {reviews.filter((r) => r.rating === 5).length}
            </div>
            <small className="text-muted">Top rated</small>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search reviews by book title, student name, or review comment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="">All Star Ratings</option>
                <option value="5">5 Stars (Exceptional)</option>
                <option value="4">4 Stars (Very Good)</option>
                <option value="3">3 Stars (Average)</option>
                <option value="2">2 Stars (Below Average)</option>
                <option value="1">1 Star (Poor)</option>
              </select>
            </div>
            <div className="col-md-2 text-md-end">
              <button
                className="btn btn-light btn-sm border w-100"
                onClick={() => {
                  setSearch('');
                  setRatingFilter('');
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-star me-2"></i>Reviews ({filteredReviews.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading reviews..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Student</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((rev) => (
                      <tr key={rev._id}>
                        <td>
                          <div className="fw-semibold">{rev.book?.title}</div>
                          <small className="text-muted">by {rev.book?.author}</small>
                        </td>
                        <td>
                          <div className="fw-semibold">{rev.student?.name}</div>
                          <small className="text-muted">{rev.student?.studentId || rev.student?.email}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {rev.rating} / 5
                          </span>
                        </td>
                        <td>
                          <p className="mb-0 small text-dark" style={{ maxWidth: '350px' }}>
                            "{rev.comment}"
                          </p>
                        </td>
                        <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            title="Remove Review"
                            onClick={() => handleDeleteReview(rev._id, rev.book?.title)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No reviews found matching current filter.
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

export default ManageReviewsPage;

