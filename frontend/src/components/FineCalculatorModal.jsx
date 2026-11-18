import React, { useState } from 'react';

const FineCalculatorModal = ({ show, onClose, defaultRate = 5 }) => {
  const [mode, setMode] = useState('days');
  const [days, setDays] = useState(3);
  const [dueDate, setDueDate] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [rate, setRate] = useState(defaultRate);

  if (!show) return null;

  let calculatedDays = 0;
  if (mode === 'days') {
    calculatedDays = Math.max(0, parseInt(days) || 0);
  } else if (dueDate && returnDate) {
    const due = new Date(dueDate);
    const ret = new Date(returnDate);
    const diffTime = ret.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    calculatedDays = Math.max(0, diffDays);
  }

  const totalFine = calculatedDays * rate;

  return (
    <div
      className="modal show fade d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-calculator me-2"></i>Late Fine Calculator
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="btn-group w-100 mb-3" role="group">
              <button
                type="button"
                className={`btn btn-sm ${mode === 'days' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setMode('days')}
              >
                Calculate by Days
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'dates' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setMode('dates')}
              >
                Calculate by Dates
              </button>
            </div>

            {mode === 'days' ? (
              <div className="mb-3">
                <label className="form-label small fw-semibold">Overdue Days</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
                  <span className="input-group-text">Day(s)</span>
                </div>
              </div>
            ) : (
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold">Scheduled Due Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Actual Return Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold">Fine Rate per Day</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 0)}
                />
                <span className="input-group-text">per day</span>
              </div>
            </div>

            <div className="p-3 rounded bg-light border text-center">
              <div className="text-muted small mb-1">
                {calculatedDays} day(s) × ₹{rate}/day
              </div>
              <div className="h3 fw-bold text-dark mb-0">₹{totalFine.toFixed(2)}</div>
              <small className="text-muted">Total Estimated Penalty</small>
            </div>
          </div>

          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FineCalculatorModal;
