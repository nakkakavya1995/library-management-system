import React, { useState, useEffect } from 'react';
import AlertMessage from '../../components/AlertMessage';

const LibrarianSettingsPage = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('lms_librarian_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      fineRatePerDay: 5,
      loanDurationDays: 14,
      maxBorrowLimit: 3,
      renewalPeriodDays: 7,
      notifyDueDates: true,
      notifyFines: true,
      notifyReservations: true,
      autoCancelOverdueHolds: false
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('lms_librarian_settings', JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Settings</h3>
          <p className="text-muted small mb-0">Operational controls, loan durations, fine rates, and notification preferences</p>
        </div>
      </div>

      {savedSuccess && (
        <AlertMessage
          type="success"
          message="Librarian settings and operational rules saved successfully!"
          onClose={() => setSavedSuccess(false)}
        />
      )}

      <form onSubmit={handleSave}>
        <div className="row g-4">
          {/* Library Settings */}
          <div className="col-lg-6">
            <div className="card shadow-sm border h-100">
              <div className="card-header bg-light fw-bold text-dark">
                Library Settings
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Standard Loan Duration (Days)</label>
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
                  <small className="text-muted">Standard number of days a student can borrow a book.</small>
                </div>

                <div className="mb-0">
                  <label className="form-label small fw-semibold">Maximum Borrow Limit Per Student</label>
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
                  <small className="text-muted">Maximum number of concurrent active book checkouts.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Fine Rates & Notification Toggles Matching Reference Image Screen 8 */}
          <div className="col-lg-6">
            {/* Fine Rates Box */}
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light fw-bold text-dark">
                <i className="bi bi-cash-stack me-2"></i>Fine Rates
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Late Return Fine Rate (₹ per day)</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      name="fineRatePerDay"
                      value={settings.fineRatePerDay}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                  <small className="text-muted">Fine applied per day once past the return due date.</small>
                </div>
              </div>
            </div>

            {/* Notification Toggle Box */}
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light fw-bold text-dark">
                <i className="bi bi-bell me-2"></i>Notification Toggle
              </div>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold text-dark">Due Date Email Alerts</div>
                    <small className="text-muted">Send automated reminders to students before due dates</small>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="notifyDueDates"
                      checked={settings.notifyDueDates}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold text-dark">Late Fine Email Alerts</div>
                    <small className="text-muted">Send automated overdue notices when fines accumulate</small>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="notifyFines"
                      checked={settings.notifyFines}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center py-2">
                  <div>
                    <div className="fw-semibold text-dark">Reservation Availability Alerts</div>
                    <small className="text-muted">Notify waiting students via email when reserved book is returned</small>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="notifyReservations"
                      checked={settings.notifyReservations}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button type="submit" className="btn btn-dark px-4 py-2 fw-semibold">
            <i className="bi bi-check-circle me-1"></i> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default LibrarianSettingsPage;

