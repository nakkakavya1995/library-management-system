import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const BookCatalogPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState(initialQuery);
  const [activeBorrowCount, setActiveBorrowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reservation Modal
  const [reserveBook, setReserveBook] = useState(null);
  const [reserveNotes, setReserveNotes] = useState('');
  const [reserving, setReserving] = useState(false);

  // Reviews Modal
  const [reviewBook, setReviewBook] = useState(null);
  const [bookReviews, setBookReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Info Modal for Borrowing Available Books
  const [infoBook, setInfoBook] = useState(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;

      const res = await api.get('/books', { params });
      setBooks(res.data.books || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/books/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyBorrowCount = async () => {
    try {
      const res = await api.get('/issues/my-borrowings?status=issued');
      setActiveBorrowCount((res.data.issues || []).length);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchMyBorrowCount();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  // Handle Reservation
  const handleOpenReserve = (book) => {
    setReserveBook(book);
    setReserveNotes('');
    setError('');
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!reserveBook) return;

    try {
      setReserving(true);
      await api.post('/reservations', {
        bookId: reserveBook._id,
        notes: reserveNotes
      });

      setSuccess(`Reservation request submitted for "${reserveBook.title}". You will be notified via email when available.`);
      setReserveBook(null);
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit reservation');
    } finally {
      setReserving(false);
    }
  };

  // Handle Book Reviews inspection
  const handleOpenReviews = async (book) => {
    setReviewBook(book);
    try {
      setLoadingReviews(true);
      const res = await api.get(`/reviews/book/${book._id}`);
      setBookReviews(res.data.reviews || []);
      setAverageRating(res.data.averageRating || 0);
    } catch (err) {
      console.error(err);
      setBookReviews([]);
      setAverageRating(0);
    } finally {
      setLoadingReviews(false);
    }
  };

  return (
    <div>
      {/* Page Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Book Catalog</h3>
          <p className="text-muted small mb-0">Explore library books, filter by category, check availability, and reserve titles</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Top Search Bar - Matching Reference Image */}
      <div className="card shadow-sm border mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-md-9">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by title, author, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-dark btn-sm flex-grow-1">
                Search
              </button>
              {(search || selectedCategory) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                    fetchBooks();
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 2-Column Layout Matching Reference Image: Categories on left, Books on right */}
      <div className="row g-4">
        {/* Left Column: All Book Categories */}
        <div className="col-lg-3">
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-light fw-bold text-dark">
              <i className="bi bi-grid me-2"></i>All Book Categories
            </div>
            <div className="list-group list-group-flush small">
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                  selectedCategory === '' ? 'active bg-dark text-white border-dark' : 'text-dark'
                }`}
                onClick={() => setSelectedCategory('')}
              >
                <span>All Categories</span>
                <span className="badge bg-light text-dark border">All</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    selectedCategory === c ? 'active bg-dark text-white border-dark' : 'text-dark'
                  }`}
                  onClick={() => setSelectedCategory(c)}
                >
                  <span>{c}</span>
                  <i className="bi bi-chevron-right" style={{ fontSize: '0.75rem' }}></i>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Books in Category Grid */}
        <div className="col-lg-9">
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-semibold text-dark">
                <i className="bi bi-journal-bookmark me-2"></i>
                {selectedCategory ? `${selectedCategory} Books` : 'All Books'} ({books.length})
              </span>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <LoadingSpinner text="Searching book inventory..." />
              ) : books.length > 0 ? (
                <div className="row g-3">
                  {books.map((book) => (
                    <div key={book._id} className="col-12 col-md-6 col-xl-4">
                      <div className="card h-100 border shadow-sm d-flex flex-column">
                        <div className="card-body p-3 flex-grow-1">
                          <div className="d-flex align-items-start gap-3 mb-2">
                            {/* Book cover thumbnail icon */}
                            <div
                              className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                              style={{ width: '48px', height: '60px', flexShrink: 0 }}
                            >
                              <i className="bi bi-book fs-3"></i>
                            </div>
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                              <span className="badge bg-light text-dark border mb-1 small">
                                {book.category}
                              </span>
                              <h6 className="fw-bold mb-1 text-truncate" title={book.title}>
                                {book.title}
                              </h6>
                              <div className="text-muted small text-truncate">by {book.author}</div>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center small mb-2 pt-2 border-top">
                            <span className="text-muted">Status:</span>
                            <span className="badge bg-light text-dark border">
                              {book.availableCopies > 0
                                ? `Available (${book.availableCopies} in stock)`
                                : 'Currently Borrowed'}
                            </span>
                          </div>

                          {book.description && (
                            <p className="text-muted small mb-0 line-clamp-2" style={{ fontSize: '0.8rem' }}>
                              {book.description.length > 80
                                ? `${book.description.substring(0, 80)}...`
                                : book.description}
                            </p>
                          )}
                        </div>

                        {/* Card Actions Matching Reference Image: Borrow & Reserve */}
                        <div className="card-footer bg-white border-top p-2 d-flex justify-content-between align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                            onClick={() => handleOpenReviews(book)}
                          >
                            <i className="bi bi-chat-text me-1"></i>Reviews
                          </button>

                          <div className="d-flex gap-1">
                            {book.availableCopies > 0 ? (
                              <button
                                type="button"
                                className="btn btn-dark btn-sm"
                                onClick={() => setInfoBook(book)}
                              >
                                Borrow
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className={`btn btn-sm ${book.availableCopies === 0 ? 'btn-dark' : 'btn-outline-secondary'}`}
                              onClick={() => handleOpenReserve(book)}
                            >
                              Reserve
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-book fs-2 d-block mb-2 text-muted"></i>
                  <h5>No books found</h5>
                  <p className="small mb-3">Try clearing search filters or selecting another category.</p>
                  <button
                    className="btn btn-dark btn-sm"
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('');
                      fetchBooks();
                    }}
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Borrow Instructions Modal */}
      {infoBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold mb-0">Borrow: {infoBook.title}</h5>
                  <small className="text-muted">by {infoBook.author}</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setInfoBook(null)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-secondary border py-2 mb-3 small">
                  <strong>Available Copies:</strong> {infoBook.availableCopies} of {infoBook.totalCopies} on shelves.
                </div>
                <p className="small text-dark mb-2">
                  This book is currently in stock at the library. To complete borrowing:
                </p>
                <ol className="small text-muted ps-3 mb-3">
                  <li>Visit the circulation desk at the library.</li>
                  <li>Present your registered Student ID / Roll Number.</li>
                  <li>The librarian will scan the book and issue it to your account for 14 days.</li>
                </ol>
                <div className="p-2 bg-light border rounded small">
                  <strong>Or place a hold:</strong> If you are unable to visit immediately, you can also place a reservation hold right now so the copy is held for you.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setInfoBook(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => {
                    const b = infoBook;
                    setInfoBook(null);
                    handleOpenReserve(b);
                  }}
                >
                  Place Reservation Hold
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {reserveBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleConfirmReservation}>
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Reserve Book</h5>
                    <small className="text-muted">{reserveBook.title} by {reserveBook.author}</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setReserveBook(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Special Instructions or Notes (Optional)</label>
                    <textarea
                      rows="3"
                      className="form-control"
                      placeholder="e.g. Need this for semester project research..."
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="alert alert-secondary border py-2 small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    You will receive an automatic email notification when this book is ready for pickup at the desk.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setReserveBook(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark" disabled={reserving}>
                    {reserving ? 'Submitting...' : 'Submit Reservation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Book Reviews Modal */}
      {reviewBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold mb-0">{reviewBook.title}</h5>
                  <small className="text-muted">by {reviewBook.author}</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setReviewBook(null)}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded border mb-3">
                  <div className="display-6 fw-bold text-dark">{averageRating}</div>
                  <div>
                    <span className="badge bg-light text-dark border mb-1 d-inline-block">Rating: {averageRating} / 5</span>
                    <div><small className="text-muted">Based on {bookReviews.length} reviews</small></div>
                  </div>
                </div>

                {loadingReviews ? (
                  <LoadingSpinner text="Loading reviews..." />
                ) : bookReviews.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {bookReviews.map((rev) => (
                      <div key={rev._id} className="p-3 border rounded">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">{rev.student?.name || 'Student'}</span>
                          <span className="badge bg-light text-dark border">
                            {rev.rating} / 5
                          </span>
                        </div>
                        <p className="mb-1 text-muted small">{rev.comment}</p>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    No reviews submitted yet for this book.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReviewBook(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCatalogPage;
