import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const LibrarianUserManagementPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const res = await api.get('/users?role=student');
      setStudents(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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
      name: student.name || '',
      email: student.email || '',
      password: '',
      studentId: student.studentId || '',
      phone: student.phone || '',
      status: student.status || 'active'
    });
    setShowModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingStudent) {
        await api.put(`/users/${editingStudent._id}`, formData);
        setSuccess('Student information updated successfully');
      } else {
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password || 'student123',
          role: 'student',
          studentId: formData.studentId,
          phone: formData.phone
        });
        setSuccess('New student account registered successfully');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student details');
    }
  };

  const filteredStudents = students.filter((s) => {
    const name = s.name?.toLowerCase() || '';
    const email = s.email?.toLowerCase() || '';
    const studentId = s.studentId?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || studentId.includes(q);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">User Management</h3>
          <p className="text-muted small mb-0">Manage registered student members, check status, and register new students</p>
        </div>
        <button className="btn btn-dark btn-sm" onClick={handleOpenAddModal}>
          <i className="bi bi-person-plus me-1"></i> Add Student
        </button>
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
              placeholder="Search students by name, ID, or email..."
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
            <i className="bi bi-people me-2"></i>Registered Students ({filteredStudents.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading students..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Member</th>
                    <th>Full Name</th>
                    <th>Student ID / Roll No</th>
                    <th>Email Address</th>
                    <th>Contact Phone</th>
                    <th>Account Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <div
                            className="bg-light border rounded-circle d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '36px', height: '36px' }}
                          >
                            <i className="bi bi-person fs-5"></i>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{student.name}</div>
                          <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                            Student
                          </span>
                        </td>
                        <td>{student.studentId || '—'}</td>
                        <td>{student.email}</td>
                        <td>{student.phone || '—'}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {student.status || 'Active'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleOpenEditModal(student)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No students found matching your search.
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
                    {editingStudent ? 'Edit Student Details' : 'Register New Student'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="student@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={!!editingStudent}
                    />
                  </div>
                  {!editingStudent && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingStudent}
                      />
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold">Student ID / Roll No</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 2024-CS-042"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
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

export default LibrarianUserManagementPage;
