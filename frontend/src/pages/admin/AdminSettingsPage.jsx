import React, { useState } from 'react';
import AlertMessage from '../../components/AlertMessage';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('lms_admin_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {

      }
    }
    return {
      loanDurationDays: 14,
      maxBorrowLimit: 3,
      fineRatePerDay: 5,
      renewalDays: 7,
      notifyDueDates: true,
      notifyFines: true,
      notifyReservations: true
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('lms_admin_settings', JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Settings</h3>
          <p className="text-muted small mb-0">Library borrowing rules and notification preferences</p>
        </div>
        <button type="button" className="btn btn-dark btn-sm" onClick={handleSave}>
          <i className="bi bi-check-lg me-1"></i> Save Changes
        </button>
      </div>

      {savedSuccess && (
        <AlertMessage
          type="success"
          message="Settings saved successfully!"
          onClose={() => setSavedSuccess(false)}
        />
      )}

      <form onSubmit={handleSave}>
        <div className="row g-4 mb-4">

          <div className="col-lg-6">
            <div className="card shadow-sm border h-100">
              <div className="card-header bg-light">
                <span className="fw-semibold">Library Rules</span>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Loan Period (Days)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="loanDurationDays"
                    value={settings.loanDurationDays}
                    onChange={handleChange}
                    min="1"
                    max="60"
                    required
                  />
                  <small className="text-muted">Number of days a student can keep a borrowed book</small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Maximum Books per Member</label>
                  <input
                    type="number"
                    className="form-control"
                    name="maxBorrowLimit"
                    value={settings.maxBorrowLimit}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    required
                  />
                  <small className="text-muted">Maximum number of books a student can borrow at once</small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Late Fine Rate (₹ per day)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      name="fineRatePerDay"
                      value={settings.fineRatePerDay}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                  <small className="text-muted">Fine amount charged for each day past due date</small>
                </div>

                <div className="mb-0">
                  <label className="form-label small fw-semibold">Renewal Period (Days)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="renewalDays"
                    value={settings.renewalDays}
                    onChange={handleChange}
                    min="1"
                    max="30"
                    required
                  />
                  <small className="text-muted">Extra days granted when a book is renewed</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm border h-100">
              <div className="card-header bg-light">
                <span className="fw-semibold">Email Notifications</span>
              </div>
              <div className="card-body">
                <p className="small text-muted mb-3">
                  Choose which automatic email alerts to send to students.
                </p>

                <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                  <div>
                    <div className="fw-semibold small">Due Date Reminders</div>
                    <small className="text-muted">Send reminder email before book return deadline</small>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.notifyDueDates}
                      onChange={() => handleToggle('notifyDueDates')}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                  <div>
                    <div className="fw-semibold small">Overdue Return Alerts</div>
                    <small className="text-muted">Send alert email when a book return is overdue</small>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.notifyFines}
                      onChange={() => handleToggle('notifyFines')}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <div className="fw-semibold small">Reservation Ready Alerts</div>
                    <small className="text-muted">Send alert email when a reserved book is available</small>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.notifyReservations}
                      onChange={() => handleToggle('notifyReservations')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-dark">
            <i className="bi bi-check-lg me-1"></i> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
