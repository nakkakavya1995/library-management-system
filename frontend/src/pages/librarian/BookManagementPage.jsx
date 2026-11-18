import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import { exportToCsv } from '../../utils/exportCsv';

const BookManagementPage = () => {
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
    price: 499,
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
      price: 499,
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
      price: book.price || 0,
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
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
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
      'Issued Copies': Math.max(0, b.totalCopies - b.availableCopies)
    }));
    exportToCsv('library_books_list', formatted);
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Books</h3>
          <p className="text-muted small mb-0">Add, edit, search, and manage library books</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleExportCatalog}>
            <i className="bi bi-file-earmark-arrow-down me-1"></i> Export CSV
          </button>
          <button className="btn btn-dark btn-sm" onClick={handleOpenAddModal}>
            <i className="bi bi-plus-lg me-1"></i> Add Book
          </button>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card mb-4 border">
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
                <i className="bi bi-arrow-clockwise me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading books..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Cover</th>
                    <th>Title & Author</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th className="text-center">Total</th>
                    <th className="text-center">Available</th>
                    <th className="text-center">Issued</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length > 0 ? (
                    books.map((b) => {
                      const issuedCopies = b.totalCopies - b.availableCopies;
                      return (
                        <tr key={b._id}>
                          <td>
                            <div
                              className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                              style={{ width: '38px', height: '46px' }}
                            >
                              <i className="bi bi-book fs-5"></i>
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{b.title}</div>
                            <small className="text-muted">by {b.author}</small>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {b.category}
                            </span>
                          </td>
                          <td className="fw-semibold text-dark">₹{b.price || 0}</td>
                          <td className="text-center fw-bold">{b.totalCopies}</td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {b.availableCopies} available
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {issuedCopies} issued
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {b.availableCopies > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-outline-secondary btn-sm me-1"
                              title="Edit"
                              onClick={() => handleOpenEditModal(b)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              title="Delete"
                              onClick={() => handleDeleteBook(b._id, b.title)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No books found.
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

                  <div className="row">
                    <div className="col-md-6 mb-3">
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
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold">Book Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        min="0"
                        className="form-control"
                        placeholder="e.g. 450"
                        value={formData.price}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Description / Synopsis</label>
                    <textarea
                      name="description"
                      rows="3"
                      className="form-control"
                      placeholder="Brief overview of the book..."
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

export default BookManagementPage;
