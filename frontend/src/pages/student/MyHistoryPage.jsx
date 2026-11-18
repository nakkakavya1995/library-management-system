import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const MyHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reviewBook, setReviewBook] = useState(null);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues/my-borrowings');
      setHistory(res.data.issues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch borrowing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
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
      setSubmittingReview(true);
      await api.post('/reviews', {
        bookId: reviewBook._id,
        rating: Number(rating),
        comment
      });

      setSuccess(`Thank you! Your review for "${reviewBook.title}" has been published.`);
      setReviewBook(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    const t = item.book?.title?.toLowerCase() || '';
    const a = item.book?.author?.toLowerCase() || '';
    const s = search.toLowerCase();
    return t.includes(s) || a.includes(s);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Borrowing History</h3>
          <p className="text-muted small mb-0">Record of all books you have borrowed and returned, with review options</p>
        </div>
        <Link to="/student/reviews" className="btn btn-outline-dark btn-sm">
          <i className="bi bi-chat-text me-1"></i> View All My Reviews
        </Link>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card shadow-sm border mb-4">
        <div className="card-body p-3">
          <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search history by title or author..."
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

      <div className="card shadow-sm border">
        <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-clock-history me-2"></i>Past Borrowings ({filteredHistory.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Retrieving borrowing records..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Title & Author</th>
                    <th>Borrowed Date</th>
                    <th>Returned Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((record) => (
                      <tr key={record._id}>

                        <td>
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '40px', height: '48px' }}
                          >
                            <i className="bi bi-book fs-5"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{record.book?.title}</div>
                          <small className="text-muted">by {record.book?.author} • {record.book?.category}</small>
                        </td>
                        <td>{new Date(record.issueDate).toLocaleDateString()}</td>
                        <td>
                          {record.returnDate ? (
                            new Date(record.returnDate).toLocaleDateString()
                          ) : (
                            <span className="text-muted">Currently active</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {record.status === 'returned'
                              ? record.daysOverdue > 0 ? 'Returned Late' : 'Returned on time'
                              : record.isOverdue ? 'Overdue' : 'Currently Borrowed'}
                          </span>
                        </td>
                        <td>
                          {record.currentFine > 0 || record.fineAmount > 0 ? (
                            <span className="fw-semibold text-dark">
                              ₹{record.currentFine || record.fineAmount}
                              {record.finePaid ? ' (Paid)' : ' (Unpaid)'}
                            </span>
                          ) : (
                            <span className="text-muted small">₹0.00</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-dark btn-sm text-nowrap"
                            title="Write a Review"
                            onClick={() => handleOpenReviewModal(record.book)}
                          >
                            <i className="bi bi-pencil-square me-1"></i> Write Review
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <i className="bi bi-clock-history fs-2 d-block mb-2 text-muted"></i>
                        No borrowing records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {reviewBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmitReview}>
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Write Review: {reviewBook.title}</h5>
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
                    <label className="form-label small fw-semibold">Your Review / Thoughts *</label>
                    <textarea
                      rows="4"
                      className="form-control"
                      placeholder="Share what you learned from this book or how helpful it was..."
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
                  <button type="submit" className="btn btn-dark" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
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

export default MyHistoryPage;
