import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const AdminBookListPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Book Catalog & Inventory</h3>
          <p className="text-muted small mb-0">Overview of all books in the library system</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      <div className="card mb-4">
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
                <button type="submit" className="btn btn-outline-secondary">
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

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading book catalog..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book Title & Author</th>
                    <th>Category</th>
                    <th>Total Copies</th>
                    <th>Available Copies</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length > 0 ? (
                    books.map((b) => (
                      <tr key={b._id}>
                        <td>
                          <div className="fw-semibold">{b.title}</div>
                          <small className="text-muted">by {b.author}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {b.category}
                          </span>
                        </td>
                        <td>{b.totalCopies}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {b.availableCopies} available
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {b.availableCopies > 0 ? 'In Stock' : 'All Issued'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No books match your criteria.
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

export default AdminBookListPage;
