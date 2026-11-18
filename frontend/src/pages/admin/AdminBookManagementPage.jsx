import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import { exportToCsv } from '../../utils/exportCsv';

const AdminBookManagementPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    totalCopies: 5,
    description: ''
  });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;

      const res = await api.get('/books', { params });
      setBooks(res.data.books);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/books/categories');
      setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      category: 'Computer Science',
      totalCopies: 5,
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      totalCopies: book.totalCopies,
      description: book.description || ''
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingBook) {
        await api.put(`/books/${editingBook._id}`, formData);
        setSuccess('Book details updated successfully');
      } else {
        await api.post('/books', formData);
        setSuccess('New book added to library inventory successfully');
      }

      setShowModal(false);
      fetchBooks();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save book');
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete book record "${title}"?`)) {
      return;
    }

    try {
      await api.delete(`/books/${id}`);
      setSuccess('Book record deleted successfully');
      fetchBooks();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete book');
    }
  };

  const totalBookTitles = books.length;
  const totalPhysicalCopies = books.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
  const totalAvailableCopies = books.reduce((sum, b) => sum + (b.availableCopies || 0), 0);
  const totalBorrowedCopies = totalPhysicalCopies - totalAvailableCopies;

  const handleExportCatalog = () => {
    if (!books || !books.length) {
      alert('No books to export');
      return;
    }
    const formatted = books.map((b) => ({
      Title: b.title,
      Author: b.author,
      Category: b.category,
      'Price (INR)': `₹${b.price || 0}`,
      'Total Copies': b.totalCopies,
      'Available Copies': b.availableCopies,
      'Borrowed Copies': Math.max(0, b.totalCopies - b.availableCopies)
    }));
    exportToCsv('library_books_list', formatted);
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Book Inventory & Catalog Management</h3>
          <p className="text-muted small mb-0">View, add, edit, and delete library books.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleExportCatalog}>
            <i className="bi bi-file-earmark-arrow-down me-1"></i> Export CSV
          </button>
          <button className="btn btn-dark btn-sm" onClick={handleOpenAddModal}>
            <i className="bi bi-plus-lg me-1"></i> Add New Book
          </button>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Total Titles</div>
            <div className="h3 fw-bold mb-0 text-dark">{totalBookTitles}</div>
            <small className="text-muted">Unique books</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Total Copies</div>
            <div className="h3 fw-bold mb-0 text-dark">{totalPhysicalCopies}</div>
            <small className="text-muted">All physical copies</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Available Copies</div>
            <div className="h3 fw-bold mb-0 text-dark">{totalAvailableCopies}</div>
            <small className="text-muted">Ready to borrow</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border p-3 bg-white">
            <div className="text-muted small fw-semibold">Borrowed Copies</div>
            <div className="h3 fw-bold mb-0 text-dark">{totalBorrowedCopies}</div>
            <small className="text-muted">With students</small>
          </div>
        </div>
      </div>

      <div className="card mb-4 shadow-sm border">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <form onSubmit={handleSearchSubmit} className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by title or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-dark">
                  <i className="bi bi-search"></i>
                </button>
              </form>
            </div>
            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 text-md-end">
              <button
                className="btn btn-light btn-sm border"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  fetchBooks();
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-journals me-2"></i>All Books ({books.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading book inventory..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Title & Author</th>
                    <th>Category</th>
                    <th className="text-center">Total Copies</th>
                    <th className="text-center">Available</th>
                    <th className="text-center">Borrowed</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length > 0 ? (
                    books.map((b) => {
                      const borrowed = b.totalCopies - b.availableCopies;
                      return (
                        <tr key={b._id}>
                          <td>
                            <div
                              className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                              style={{ width: '38px', height: '46px', flexShrink: 0 }}
                            >
                              <i className="bi bi-book"></i>
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">{b.title}</div>
                            <small className="text-muted">by {b.author}</small>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {b.category}
                            </span>
                          </td>
                          <td className="text-center fw-bold">{b.totalCopies}</td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {b.availableCopies} available
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {borrowed} on loan
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {b.availableCopies > 0 ? 'In Stock' : 'Checked Out'}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-outline-secondary btn-sm me-1"
                              title="Edit Book Details"
                              onClick={() => handleOpenEditModal(b)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-dark btn-sm"
                              title="Delete Book Record"
                              onClick={() => handleDeleteBook(b._id, b.title)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No book records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSaveBook}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editingBook ? 'Edit Book Record' : 'Add New Book to Inventory'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Book Title *</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      placeholder="e.g. Wings of Fire"
                      value={formData.title}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Author Name *</label>
                    <input
                      type="text"
                      name="author"
                      className="form-control"
                      placeholder="e.g. Dr. A.P.J. Abdul Kalam"
                      value={formData.author}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Category *</label>
                    <input
                      type="text"
                      name="category"
                      className="form-control"
                      placeholder="e.g. Computer Science"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Total Physical Copies *</label>
                    <input
                      type="number"
                      name="totalCopies"
                      min="1"
                      className="form-control"
                      value={formData.totalCopies}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Description / Synopsis</label>
                    <textarea
                      name="description"
                      rows="3"
                      className="form-control"
                      placeholder="Short synopsis of the book..."
                      value={formData.description}
                      onChange={handleFormChange}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark">
                    {editingBook ? 'Save Changes' : 'Add Book'}
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

export default AdminBookManagementPage;
