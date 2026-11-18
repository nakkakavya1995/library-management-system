import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const StudentReviewsPage = () => {
  const [myReviews, setMyReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reviewBook, setReviewBook] = useState(null);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/my-reviews');
      setMyReviews(res.data.myReviews || []);
      setPendingReviews(res.data.pendingReviews || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, []);

  const handleOpenReviewModal = (book) => {
    setReviewBook(book);
    setRating('5');
    setComment('');
    setError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBook) return;

    try {
      setSubmitting(true);
      await api.post('/reviews', {
        bookId: reviewBook._id,
        rating: parseInt(rating, 10),
        comment
      });

      setSuccess(`Review for "${reviewBook.title}" submitted successfully!`);
      setReviewBook(null);
      fetchReviewsData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Book Reviews</h3>
          <p className="text-muted small mb-0">Share your feedback and reviews on books you have read</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <LoadingSpinner text="Loading your reviews..." />
      ) : (
        <div className="row g-4">

          <div className="col-lg-7">
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <span className="fw-semibold">
                  <i className="bi bi-chat-left-text me-2"></i>My Reviews ({myReviews.length})
                </span>
              </div>
              <div className="card-body p-3">
                {myReviews.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {myReviews.map((rev) => (
                      <div key={rev._id} className="p-3 border rounded bg-white">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <div className="fw-bold text-dark">{rev.book?.title}</div>
                            <small className="text-muted">by {rev.book?.author} • {rev.book?.category}</small>
                          </div>
                          <span className="badge bg-light text-dark border">
                            Rating: {rev.rating} / 5
                          </span>
                        </div>
                        <p className="mb-1 text-dark small">"{rev.comment}"</p>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Submitted on {new Date(rev.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-chat-square-text fs-2 d-block mb-2 text-muted"></i>
                    You have not submitted any reviews yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <span className="fw-semibold">
                  <i className="bi bi-pencil-square me-2"></i>Pending Reviews ({pendingReviews.length})
                </span>
              </div>
              <div className="card-body p-3">
                <p className="text-muted small mb-3">
                  Recently returned books waiting for a user review:
                </p>
                {pendingReviews.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {pendingReviews.map((item) => (
                      <div
                        key={item.book?._id}
                        className="p-3 border rounded d-flex justify-content-between align-items-center bg-white"
                      >
                        <div>
                          <div className="fw-semibold">{item.book?.title}</div>
                          <small className="text-muted">by {item.book?.author}</small>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Returned on {new Date(item.returnedDate).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          className="btn btn-dark btn-sm"
                          onClick={() => handleOpenReviewModal(item.book)}
                        >
                          Write a Review
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-check-circle fs-2 d-block mb-2 text-muted"></i>
                    All caught up! No pending books to review.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {reviewBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmitReview}>
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Review: {reviewBook.title}</h5>
                    <small className="text-muted">by {reviewBook.author}</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setReviewBook(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Your Rating *</label>
                    <select
                      className="form-select"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      required
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Very Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Fair</option>
                      <option value="1">1 - Poor</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Your Review *</label>
                    <textarea
                      rows="4"
                      className="form-control"
                      placeholder="Share what you liked about this book..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setReviewBook(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReviewsPage;
