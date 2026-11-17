import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const ManageLibrariansPage = () => {
  const [librarians, setLibrarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLibrarian, setEditingLibrarian] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    status: 'active'
  });

  const fetchLibrarians = async () => {
    try {
      setLoading(true);
      const params = { role: 'librarian' };
      if (search) params.search = search;
      const res = await api.get('/users', { params });
      setLibrarians(res.data.users);
    } catch (err) {
      if (err.response?.status === 401) {
        return;
      }
      setError(err.response?.data?.message || 'Failed to fetch librarians');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrarians();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLibrarians();
  };

  const handleOpenAddModal = () => {
    setEditingLibrarian(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (librarian) => {
    setEditingLibrarian(librarian);
    setFormData({
      name: librarian.name,
      email: librarian.email,
      password: '', // leave empty to keep current
      phone: librarian.phone || '',
      status: librarian.status || 'active'
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveLibrarian = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingLibrarian) {
        await api.put(`/users/${editingLibrarian._id}`, {
          ...formData,
          role: 'librarian'
        });
        setSuccess('Librarian details updated successfully');
      } else {
        if (!formData.password) {
          setError('Password is required for new librarian account');
          return;
        }
        await api.post('/users', {
          ...formData,
          role: 'librarian'
        });
        setCreatedCredentials({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        setSuccess(`New librarian account created for ${formData.name}. Login credentials generated below.`);
      }

      setShowModal(false);
      fetchLibrarians();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save librarian');
    }
  };

  const handleToggleStatus = async (librarian) => {
    const newStatus = librarian.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/users/${librarian._id}`, { status: newStatus });
      setSuccess(`Librarian access set to ${newStatus}`);
      fetchLibrarians();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update access status');
    }
  };

  const handleDeleteLibrarian = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove librarian "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      setSuccess('Librarian account removed successfully');
      fetchLibrarians();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete librarian');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Manage Librarians</h3>
          <p className="text-muted small mb-0">Add librarians, update details, and manage accounts</p>
        </div>
        <button className="btn btn-dark btn-sm" onClick={handleOpenAddModal}>
          <i className="bi bi-person-plus me-1"></i> Add Librarian
        </button>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Generated Librarian Credentials Box */}
      {createdCredentials && (
        <div className="alert alert-secondary border shadow-sm mb-4 p-3">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="fw-bold text-dark mb-1">
                <i className="bi bi-key me-2"></i>Librarian Account Created — Login Credentials
              </h6>
              <p className="small mb-2 text-dark">
                Provide these login credentials to <strong>{createdCredentials.name}</strong> to access the Librarian Dashboard:
              </p>
              <div className="bg-white p-3 rounded border font-monospace small">
                <div><strong>Login Portal:</strong> http://localhost:3000/login</div>
                <div><strong>Email:</strong> {createdCredentials.email}</div>
                <div><strong>Password:</strong> {createdCredentials.password}</div>
                <div><strong>Role:</strong> Librarian</div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(`Librarian Login Details:\nURL: http://localhost:3000/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`);
                  alert('Librarian login credentials copied to clipboard!');
                }}
              >
                <i className="bi bi-clipboard me-1"></i> Copy Credentials
              </button>
              <button
                type="button"
                className="btn-close"
                onClick={() => setCreatedCredentials(null)}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="d-flex gap-2" style={{ maxWidth: '450px' }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by librarian name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <i className="bi bi-search"></i>
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-light btn-sm border"
                onClick={() => {
                  setSearch('');
                  fetchLibrarians();
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Librarians Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-person-badge me-2"></i>Librarians ({librarians.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading librarians..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Librarian</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {librarians.length > 0 ? (
                    librarians.map((lib) => (
                      <tr key={lib._id}>
                        <td>
                          <div className="fw-semibold">{lib.name}</div>
                          <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>Librarian</span>
                        </td>
                        <td>{lib.email}</td>
                        <td>{lib.phone || '—'}</td>
                        <td>
                          <button
                            className="badge border bg-light text-dark"
                            style={{ cursor: 'pointer' }}
                            title="Click to toggle access"
                            onClick={() => handleToggleStatus(lib)}
                          >
                            {lib.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>{new Date(lib.createdAt).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-secondary btn-sm me-1"
                            title="Edit"
                            onClick={() => handleOpenEditModal(lib)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            title="Delete"
                            onClick={() => handleDeleteLibrarian(lib._id, lib.name)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No librarian accounts found. Click "Add New Librarian" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Librarian Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSaveLibrarian}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editingLibrarian ? 'Update Librarian Details' : 'Add New Librarian'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="e.g. Priya Sundaram"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="librarian@library.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      {editingLibrarian ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder={editingLibrarian ? '••••••••' : 'Enter login password'}
                      value={formData.password}
                      onChange={handleFormChange}
                      required={!editingLibrarian}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      placeholder="+91 98765 00002"
                      value={formData.phone}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Account Access Status</label>
                    <select
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      <option value="active">Active (Can log in & manage books)</option>
                      <option value="inactive">Inactive (Access temporarily disabled)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark">
                    {editingLibrarian ? 'Update Librarian' : 'Add Librarian'}
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

export default ManageLibrariansPage;

