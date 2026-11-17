import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'librarian',
    studentId: '',
    phone: '',
    status: 'active',
    permissions: {
      manageBooks: true,
      circulation: true,
      manageUsers: false,
      viewReports: true
    }
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [savingUser, setSavingUser] = useState(false);

  // Editing state for users in table
  const [editingUserId, setEditingUserId] = useState(null);
  const [userEdits, setUserEdits] = useState({});

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/users')
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userData.name || !userData.email || !userData.password) {
      setError('Please provide full name, email, and password');
      return;
    }

    try {
      setSavingUser(true);
      await api.post('/users', userData);

      setCreatedCredentials({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role
      });

      setSuccess(`Account created for ${userData.name}. Credentials ready below.`);
      setShowUserModal(false);
      setUserData({
        name: '',
        email: '',
        password: '',
        role: 'librarian',
        studentId: '',
        phone: '',
        status: 'active',
        permissions: {
          manageBooks: true,
          circulation: true,
          manageUsers: false,
          viewReports: true
        }
      });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user account');
    } finally {
      setSavingUser(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    const current = userEdits[userId] || users.find((u) => u._id === userId);
    setUserEdits({
      ...userEdits,
      [userId]: {
        ...current,
        role: newRole
      }
    });
  };

  const handleSaveUserRole = async (userId) => {
    const edit = userEdits[userId];
    if (!edit) return;

    try {
      setError('');
      await api.put(`/users/${userId}`, {
        role: edit.role
      });

      setSuccess('User role updated successfully');
      setUserEdits((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  if (loading) return <LoadingSpinner text="Loading Admin Dashboard..." />;

  const totalUsersCount = users.length;
  const activeCheckouts = stats?.totalIssued || 0;
  const overdueFines = stats?.totalUnpaidFine || 0;
  const totalBooksCount = stats?.totalBooks || 0;

  return (
    <div>
      {/* Top Header Matching Reference Screen 1 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Admin Dashboard (All Features)</h3>
          <p className="text-muted small mb-0">Central control for library users, book inventory, and circulation monitoring</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-dark btn-sm" onClick={() => setShowUserModal(true)}>
            <i className="bi bi-person-plus me-1"></i> Add New User
          </button>
          <Link to="/admin/books" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-journal-text me-1"></i> Book Inventory
          </Link>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Generated Credentials Alert if newly created */}
      {createdCredentials && (
        <div className="card shadow-sm border border-secondary mb-4">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <span className="fw-semibold text-dark">
              <i className="bi bi-key me-2"></i>New Account Credentials Generated
            </span>
            <button
              type="button"
              className="btn-close btn-sm"
              onClick={() => setCreatedCredentials(null)}
            ></button>
          </div>
          <div className="card-body">
            <p className="small text-muted mb-2">
              Share these credentials with <strong>{createdCredentials.name}</strong> to access their portal:
            </p>
            <div className="bg-light p-3 rounded border font-monospace small mb-3">
              <div><strong>Email:</strong> {createdCredentials.email}</div>
              <div><strong>Password:</strong> {createdCredentials.password}</div>
              <div><strong>Assigned Role:</strong> {createdCredentials.role}</div>
            </div>
            <button
              type="button"
              className="btn btn-dark btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(`Login Details:\nPortal: http://localhost:3000/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role}`);
                alert('Credentials copied to clipboard');
              }}
            >
              <i className="bi bi-clipboard me-1"></i> Copy Credentials
            </button>
          </div>
        </div>
      )}

      {/* 4 KPI Cards Matching Reference Image Screen 1 */}
      <div className="row g-3 mb-4">
        {/* 1. Total Users */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Users"
            value={totalUsersCount}
            icon="bi-people"
            color="primary"
            subtitle={`${stats?.totalStudents || 0} students, ${stats?.totalLibrarians || 0} librarians`}
          />
        </div>

        {/* 2. Issued Books */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Issued Books"
            value={activeCheckouts}
            icon="bi-journal-arrow-up"
            color="warning"
            subtitle={`${stats?.overdueCount || 0} overdue`}
          />
        </div>

        {/* 3. Overdue Fines */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Overdue Fines"
            value={`₹${overdueFines.toFixed(2)}`}
            icon="bi-cash-coin"
            color="danger"
            subtitle="Fine rate: ₹5.00 / day"
          />
        </div>

        {/* 4. Total Books */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Books"
            value={totalBooksCount}
            icon="bi-book"
            color="info"
            subtitle={`${stats?.totalCopies || 0} total copies`}
          />
        </div>
      </div>

      {/* Main Section: User & Role Management Table */}
      <div className="card shadow-sm border mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <div>
            <h6 className="fw-bold mb-0">User & Role Management</h6>
            <small className="text-muted">Manage system users, assign roles, and view account status</small>
          </div>
          <button className="btn btn-dark btn-sm" onClick={() => setShowUserModal(true)}>
            <i className="bi bi-person-plus me-1"></i> Add New User
          </button>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>User</th>
                  <th style={{ width: '25%' }}>Role</th>
                  <th style={{ width: '20%' }}>Status</th>
                  <th style={{ width: '20%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((u) => {
                    const edit = userEdits[u._id] || u;
                    const isDirty = userEdits[u._id] !== undefined && userEdits[u._id].role !== u.role;

                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-light border rounded-circle d-flex align-items-center justify-content-center text-muted"
                              style={{ width: '36px', height: '36px', flexShrink: 0 }}
                            >
                              <i className="bi bi-person"></i>
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{u.name}</div>
                              <small className="text-muted">{u.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={edit.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          >
                            <option value="admin">Admin</option>
                            <option value="librarian">Librarian</option>
                            <option value="student">Student</option>
                          </select>
                        </td>
                        <td>
                          <span className={`badge ${u.status === 'inactive' ? 'bg-secondary' : 'bg-light text-dark border'} text-capitalize`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className={`btn btn-sm ${isDirty ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => handleSaveUserRole(u._id)}
                            disabled={!isDirty}
                          >
                            <i className="bi bi-check-lg me-1"></i> Save Role
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
                      No user records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New User Modal */}
      {showUserModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleCreateUser}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-person-plus me-2"></i>Add New User
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@library.com"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter temporary password"
                      value={userData.password}
                      onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Role *</label>
                      <select
                        className="form-select"
                        value={userData.role}
                        onChange={(e) => {
                          const role = e.target.value;
                          setUserData({
                            ...userData,
                            role,
                            permissions: {
                              manageBooks: true,
                              circulation: true,
                              manageUsers: role === 'admin',
                              viewReports: true
                            }
                          });
                        }}
                      >
                        <option value="librarian">Librarian</option>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold">Status</label>
                      <select
                        className="form-select"
                        value={userData.status}
                        onChange={(e) => setUserData({ ...userData, status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      value={userData.phone}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    />
                  </div>

                  {userData.role === 'student' && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Student ID (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. STU-2026-009"
                        value={userData.studentId}
                        onChange={(e) => setUserData({ ...userData, studentId: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="alert alert-secondary py-2 small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Credentials will be displayed immediately upon creation for sharing.
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark" disabled={savingUser}>
                    {savingUser ? 'Creating...' : 'Create User'}
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

export default AdminDashboard;
