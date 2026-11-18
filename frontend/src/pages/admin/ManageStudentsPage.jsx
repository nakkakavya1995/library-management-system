import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const ManageStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    phone: '',
    status: 'active'
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = { role: 'student' };
      if (search) params.search = search;
      const res = await api.get('/users', { params });
      setStudents(res.data.users);
    } catch (err) {
      if (err.response?.status === 401) {
        return;
      }
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      studentId: '',
      phone: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: '',
      studentId: student.studentId || '',
      phone: student.phone || '',
      status: student.status || 'active'
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingStudent) {
        await api.put(`/users/${editingStudent._id}`, {
          ...formData,
          role: 'student'
        });
        setSuccess('Student information updated successfully');
      } else {
        if (!formData.password) {
          setError('Password is required for student account');
          return;
        }
        await api.post('/users', {
          ...formData,
          role: 'student'
        });
        setSuccess('New student registered successfully');
      }

      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student record');
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/users/${student._id}`, { status: newStatus });
      setSuccess(`Student account status set to ${newStatus}`);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student account for "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      setSuccess('Student account deleted successfully');
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Manage Students</h3>
          <p className="text-muted small mb-0">View registered students, update details, and manage accounts</p>
        </div>
        <button className="btn btn-dark btn-sm" onClick={handleOpenAddModal}>
          <i className="bi bi-person-plus me-1"></i> Register Student
        </button>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card mb-4 shadow-sm">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="d-flex gap-2" style={{ maxWidth: '450px' }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by student name, email, or Roll No..."
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
                  fetchStudents();
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-mortarboard me-2 text-primary"></i>Registered Students ({students.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading registered students..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student ID / Roll No</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Account Status</th>
                    <th>Registration Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <div className="fw-semibold">{student.name}</div>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                            {student.studentId || 'No ID assigned'}
                          </span>
                        </td>
                        <td>{student.email}</td>
                        <td>{student.phone || '—'}</td>
                        <td>
                          <button
                            className={`badge border-0 ${
                              student.status === 'active' ? 'bg-success' : 'bg-secondary'
                            }`}
                            style={{ cursor: 'pointer' }}
                            title="Click to toggle account access"
                            onClick={() => handleToggleStatus(student)}
                          >
                            {student.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-secondary btn-sm me-1"
                            title="Edit"
                            onClick={() => handleOpenEditModal(student)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            title="Delete"
                            onClick={() => handleDeleteStudent(student._id, student.name)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No students found. Click "Register New Student" to add one.
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
              <form onSubmit={handleSaveStudent}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editingStudent ? 'Update Student Information' : 'Register New Student'}
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
                      placeholder="e.g. Aarav Patel"
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
                      placeholder="aarav@library.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold">Student ID / Roll No</label>
                      <input
                        type="text"
                        name="studentId"
                        className="form-control"
                        placeholder="2024-CSE-001"
                        value={formData.studentId}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        className="form-control"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      {editingStudent ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder={editingStudent ? '••••••••' : 'Enter login password'}
                      value={formData.password}
                      onChange={handleFormChange}
                      required={!editingStudent}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Account Status</label>
                    <select
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      <option value="active">Active (Can borrow & reserve books)</option>
                      <option value="inactive">Inactive (Account temporarily on hold)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark">
                    {editingStudent ? 'Save Changes' : 'Register Student'}
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

export default ManageStudentsPage;
