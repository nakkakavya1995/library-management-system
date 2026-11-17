import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const StudentProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    dueDates: true,
    fines: true,
    reservations: true
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      const u = res.data.user;
      setProfile(u);
      setFormData({
        name: u.name || '',
        email: u.email || '',
        studentId: u.studentId || '',
        phone: u.phone || '',
        password: '',
        confirmPassword: ''
      });
      if (u.notificationPreferences) {
        setNotificationPreferences({
          dueDates: u.notificationPreferences.dueDates !== false,
          fines: u.notificationPreferences.fines !== false,
          reservations: u.notificationPreferences.reservations !== false
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggleNotification = (key) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        phone: formData.phone,
        studentId: formData.studentId,
        notificationPreferences
      };
      if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password;
      }

      const res = await api.put('/auth/profile', payload);

      setSuccess('Settings and notification preferences updated successfully!');
      setProfile(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Settings..." />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Settings</h3>
          <p className="text-muted small mb-0">Manage your profile, notification preferences, and account security</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="row g-4">
        {/* Left Column: Account Overview */}
        <div className="col-lg-4">
          <div className="card shadow-sm h-100 border">
            <div className="card-body text-center p-4">
              <div
                className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-circle shadow-sm mb-3"
                style={{ width: '80px', height: '80px', fontSize: '2rem' }}
              >
                <i className="bi bi-person"></i>
              </div>
              <h5 className="fw-bold mb-1">{profile?.name}</h5>
              <p className="text-muted small mb-3">{profile?.email}</p>

              <div className="d-flex justify-content-center gap-2 mb-3">
                <span className="badge bg-light text-dark border text-capitalize px-3 py-2">
                  Role: {profile?.role}
                </span>
                <span className="badge bg-light text-dark border text-capitalize px-3 py-2">
                  Status: {profile?.status || 'Active'}
                </span>
              </div>

              <hr />

              <div className="text-start small">
                <div className="mb-2">
                  <span className="text-muted fw-semibold">Student ID / Roll No:</span>
                  <div className="fw-bold">{profile?.studentId || 'Not registered'}</div>
                </div>
                <div className="mb-2">
                  <span className="text-muted fw-semibold">Phone:</span>
                  <div className="fw-bold">{profile?.phone || 'Not registered'}</div>
                </div>
                <div>
                  <span className="text-muted fw-semibold">Member Since:</span>
                  <div className="fw-bold">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="col-lg-8">
          <form onSubmit={handleUpdateProfile}>
            {/* Section 1: Personal Information */}
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light">
                <i className="bi bi-person-lines-fill me-2"></i>Personal Information
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g. Aarav Patel"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control bg-light"
                    value={formData.email}
                    disabled
                  />
                  <small className="text-muted">Email address is managed by the library administration.</small>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Student ID / Roll Number</label>
                    <input
                      type="text"
                      name="studentId"
                      className="form-control"
                      placeholder="e.g. 2024-CSE-001"
                      value={formData.studentId}
                      onChange={handleChange}
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
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Notification Preferences (Reference Image Feature) */}
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light">
                <i className="bi bi-bell me-2"></i>Notification Preferences
              </div>
              <div className="card-body p-4">
                <p className="text-muted small mb-3">
                  Choose which automatic email updates you would like to receive from the library:
                </p>

                {/* 1. Due Dates Notification */}
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold text-dark">Due Date Alerts</div>
                    <small className="text-muted">
                      Receive email reminders when book return due dates are approaching
                    </small>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notifyDueDates"
                      checked={notificationPreferences.dueDates}
                      onChange={() => handleToggleNotification('dueDates')}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* 2. Fines Notification */}
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold text-dark">Overdue Fines & Fee Updates</div>
                    <small className="text-muted">
                      Receive email notifications regarding late return penalties and payments
                    </small>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notifyFines"
                      checked={notificationPreferences.fines}
                      onChange={() => handleToggleNotification('fines')}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* 3. Available Books Notification after Reservation (Highlighted Requirement) */}
                <div className="d-flex justify-content-between align-items-center py-2">
                  <div>
                    <div className="fw-semibold text-dark">
                      Available Books Notification (After Reservation)
                    </div>
                    <small className="text-muted">
                      Receive an instant email when a reserved book is returned by another student and is ready for pickup
                    </small>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notifyReservations"
                      checked={notificationPreferences.reservations}
                      onChange={() => handleToggleNotification('reservations')}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Change Password */}
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light">
                <i className="bi bi-shield-lock me-2"></i>Change Password
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Re-enter new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-dark px-4 py-2 fw-semibold"
              disabled={saving}
            >
              {saving ? (
                <span><span className="spinner-border spinner-border-sm me-2"></span>Saving Changes...</span>
              ) : (
                <span><i className="bi bi-check-circle me-1"></i>Save Settings</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
