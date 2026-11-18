import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertMessage from '../../components/AlertMessage';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name,
        email: formData.email,
        studentId: formData.studentId,
        phone: formData.phone,
        password: formData.password
      });

      // Automatically redirects to student dashboard
      navigate('/student');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div
        className="card border-0 shadow-lg w-100 overflow-hidden"
        style={{
          maxWidth: '980px',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="row g-0">
          {/* Left Side: Vibrant Blue Section (matched with LoginPage) */}
          <div
            className="col-12 col-md-5 d-flex flex-column justify-content-center align-items-center text-center p-4 p-lg-5 text-white"
            style={{
              background: 'linear-gradient(135deg, #2b70f0 0%, #1e5dd8 100%)',
              minHeight: '520px'
            }}
          >
            <div style={{ maxWidth: '360px' }} className="d-flex flex-column align-items-center">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <i className="bi bi-person-plus-fill fs-2 text-white"></i>
              </div>

              <h2 className="fw-bold mb-3 text-white" style={{ letterSpacing: '-0.02em' }}>
                Join Our Library
              </h2>

              <p className="mb-4 lh-base" style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: '0.92rem' }}>
                Create your student account to browse thousands of titles, manage active loans, place reservations, and receive automatic email alerts.
              </p>

              {/* Highlights */}
              <div
                className="d-flex flex-column gap-2 mb-4 text-start w-100 px-3 py-3 rounded-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  fontSize: '0.82rem',
                  color: 'rgba(255, 255, 255, 0.95)'
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-white opacity-75"></i>
                  <span>Access complete book catalog and real-time stock</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-white opacity-75"></i>
                  <span>Track borrowed books, due dates & renewal requests</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-white opacity-75"></i>
                  <span>Hold reservations with restock notifications</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-white opacity-75"></i>
                  <span>Email alerts for returns, renewals, and fines</span>
                </div>
              </div>

              {/* Pill Button matching reference */}
              <Link
                to="/login"
                className="btn text-white text-decoration-none shadow-sm"
                style={{
                  borderRadius: '50px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  padding: '10px 26px',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s ease'
                }}
              >
                Already have an account? Sign In
              </Link>
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="col-12 col-md-7 d-flex flex-column justify-content-center p-4 p-lg-5 bg-white">
            <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
              <h2 className="fw-bold text-dark text-center mb-4" style={{ letterSpacing: '-0.02em', fontSize: '2rem' }}>
                Student Registration
              </h2>

              <AlertMessage type="danger" message={error} onClose={() => setError('')} />

              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{
                      background: '#edf0f5',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      padding: '11px 16px',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="student@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{
                      background: '#edf0f5',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      padding: '11px 16px',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold text-muted mb-1">Student ID / Roll No</label>
                    <input
                      type="text"
                      name="studentId"
                      className="form-control"
                      placeholder="e.g. STU-2026"
                      value={formData.studentId}
                      onChange={handleChange}
                      style={{
                        background: '#edf0f5',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        padding: '11px 16px',
                        fontSize: '0.92rem'
                      }}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold text-muted mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        background: '#edf0f5',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        padding: '11px 16px',
                        fontSize: '0.92rem'
                      }}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold text-muted mb-1">Password *</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{
                        background: '#edf0f5',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        padding: '11px 16px',
                        fontSize: '0.92rem'
                      }}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold text-muted mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      style={{
                        background: '#edf0f5',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        padding: '11px 16px',
                        fontSize: '0.92rem'
                      }}
                    />
                  </div>
                </div>

                <div
                  className="p-2 mb-3 rounded-2 text-muted small"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-shield-lock me-1 text-primary"></i>
                  Librarian and Administrator accounts are provisioned securely by library administration.
                </div>

                <button
                  type="submit"
                  className="btn w-100 py-3 fw-semibold mb-3 shadow-sm text-white"
                  disabled={loading}
                  style={{
                    backgroundColor: '#3272f0',
                    borderColor: '#3272f0',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                >
                  {loading ? (
                    <span><span className="spinner-border spinner-border-sm me-2"></span>Creating Account...</span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="text-center mt-2">
                <span className="text-muted small">Already have an account? </span>
                <Link to="/login" className="small fw-semibold text-decoration-none" style={{ color: '#3272f0' }}>
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

