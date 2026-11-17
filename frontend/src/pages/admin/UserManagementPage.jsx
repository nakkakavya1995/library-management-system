import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    phone: '',
    status: 'active'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;

      const res = await api.get('/users', { params });
      setUsers(res.data.users);
    } catch (err) {
      if (err.response?.status === 401) {
        return;
      }
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      studentId: '',
      phone: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Leave empty if not changing
      role: user.role,
      studentId: user.studentId || '',
      phone: user.phone || '',
      status: user.status || 'active'
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        // Update user
        await api.put(`/users/${editingUser._id}`, formData);
        setSuccess('User updated successfully');
      } else {
        // Create user
        if (!formData.password) {
          setError('Password is required for new user');
          return;
        }
        await api.post('/users', formData);
        setSuccess('User created successfully');
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Circulation Hub & User Directory</h3>
          <p className="text-muted small mb-0">View, add, edit, or deactivate librarians, students, and staff</p>
        </div>
        <button className="btn btn-dark btn-sm" onClick={handleOpenAddModal}>
          <i className="bi bi-person-plus me-1"></i> Add New User
        </button>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Filter and Search Bar */}
      <div className="card mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <form onSubmit={handleSearchSubmit} className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, or student ID..."
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="librarian">Librarians</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
            <div className="col-md-3 text-md-end">
              <button
                className="btn btn-light btn-sm border"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  fetchUsers();
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching user accounts..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Role</th>
                    <th>Student ID / Phone</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="fw-semibold">{u.name}</div>
                          <small className="text-muted">{u.email}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border text-capitalize">
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div>{u.studentId || '—'}</div>
                          <small className="text-muted">{u.phone || 'No phone'}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border text-capitalize">
                            {u.status}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-secondary btn-sm me-1"
                            title="Edit User"
                            onClick={() => handleOpenEditModal(u)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-dark btn-sm"
                            title="Delete User"
                            onClick={() => handleDeleteUser(u._id, u.name)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No users found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSaveUser}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editingUser ? 'Edit User Details' : 'Add New User'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">User Role *</label>
                    <select
                      name="role"
                      className="form-select"
                      value={formData.role}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="student">Student</option>
                      <option value="librarian">Librarian</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
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
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleFormChange}
                      placeholder={editingUser ? '••••••••' : 'Enter password'}
                      required={!editingUser}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold">Student ID / Employee ID</label>
                      <input
                        type="text"
                        name="studentId"
                        className="form-control"
                        value={formData.studentId}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Account Status</label>
                    <select
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Save Changes' : 'Create User'}
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

export default UserManagementPage;

