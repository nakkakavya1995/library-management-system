import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import FineCalculatorModal from '../../components/FineCalculatorModal';

const ReturnBookPage = () => {
  const [activeIssues, setActiveIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  // Return Process Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [finePaid, setFinePaid] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchActiveIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues?status=issued');
      setActiveIssues(res.data.issues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch issued books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveIssues();
  }, []);

  const handleOpenReturnModal = (record) => {
    setSelectedRecord(record);
    setFinePaid(record.currentFine > 0 ? false : true);
    setReturnNotes('');
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      setProcessing(true);
      setError('');
      setSuccess('');
      const res = await api.put(`/issues/${selectedRecord._id}/return`, {
        returnNotes,
        finePaid
      });

      setError('');
      setSuccess(
        `${res.data.message || 'Book returned successfully'} ${res.data.fineAmount > 0
          ? `Fine recorded: ₹${res.data.fineAmount} (${finePaid ? 'Paid' : 'Unpaid'}).`
          : ''
        }`
      );

      setSelectedRecord(null);
      fetchActiveIssues();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('already been returned')) {
        setError('');
        setSuccess('Book has already been returned and restocked');
        setSelectedRecord(null);
        fetchActiveIssues();
      } else {
        setSuccess('');
        setError(msg || 'Failed to process return');
      }
    } finally {
      setProcessing(false);
    }
  };

  const filteredIssues = activeIssues.filter((record) => {
    const bookTitle = record.book?.title?.toLowerCase() || '';
    const studentName = record.student?.name?.toLowerCase() || '';
    const studentId = record.student?.studentId?.toLowerCase() || '';
    const s = search.toLowerCase();
    return bookTitle.includes(s) || studentName.includes(s) || studentId.includes(s);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Return Book</h3>
          <p className="text-muted small mb-0">Accept returned books and update availability</p>
        </div>
        <button
          className="btn btn-outline-dark btn-sm"
          onClick={() => setShowCalculator(true)}
        >
          <i className="bi bi-calculator me-1"></i> Late Fine Calculator
        </button>
      </div>

      <FineCalculatorModal
        show={showCalculator}
        onClose={() => setShowCalculator(false)}
        defaultRate={5}
      />

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Search Input */}
      <div className="card mb-4">
        <div className="card-body p-3">
          <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by book title or student name / ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Active Borrowings Table */}
      <div className="card">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <i className="bi bi-journal-check me-2"></i>Issued Books ({filteredIssues.length})
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading currently issued books..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Borrowing Student</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Overdue Status</th>
                    <th>Estimated Fine</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length > 0 ? (
                    filteredIssues.map((record) => (
                      <tr key={record._id}>
                        <td>
                          <div className="fw-semibold">{record.book?.title}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{record.student?.name}</div>
                          <small className="text-muted">
                            {record.student?.studentId || 'No ID'} • {record.student?.email}
                          </small>
                        </td>
                        <td>{new Date(record.issueDate).toLocaleDateString()}</td>
                        <td>
                          <span>
                            {new Date(record.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          {record.returnStatus === 'requested' ? (
                            <span
                              className="badge text-white border-0 shadow-sm"
                              style={{ backgroundColor: '#059669' }}
                            >
                              <i className="bi bi-bell-fill me-1"></i>Return Requested
                            </span>
                          ) : (
                            <span className="badge bg-light text-dark border">
                              {record.isOverdue ? `${record.daysOverdue} days overdue` : 'On time'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="fw-bold text-dark">
                            {record.isOverdue ? `₹${record.currentFine}` : '₹0.00'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className={`btn btn-sm ${record.returnStatus === 'requested'
                              ? 'btn-success fw-semibold shadow-sm rounded-pill px-3'
                              : 'btn-dark'
                              }`}
                            style={
                              record.returnStatus === 'requested'
                                ? { backgroundColor: '#059669', borderColor: '#059669' }
                                : {}
                            }
                            onClick={() => handleOpenReturnModal(record)}
                          >
                            <i className="bi bi-box-arrow-in-left me-1"></i>
                            {record.returnStatus === 'requested' ? 'Accept Return' : 'Return'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No issued books found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Return Modal */}
      {selectedRecord && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleConfirmReturn}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Accept Book Return</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedRecord(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="fw-bold mb-1">{selectedRecord.book?.title}</div>
                    <div className="small text-muted mb-2">
                      Borrower: {selectedRecord.student?.name} ({selectedRecord.student?.studentId})
                    </div>
                    <div className="row text-center border-top pt-2 mt-2">
                      <div className="col-4">
                        <small className="text-muted d-block">Issued</small>
                        <strong>{new Date(selectedRecord.issueDate).toLocaleDateString()}</strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block">Due Date</small>
                        <strong className={selectedRecord.isOverdue ? 'text-danger' : ''}>
                          {new Date(selectedRecord.dueDate).toLocaleDateString()}
                        </strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block">Overdue</small>
                        <strong className={selectedRecord.isOverdue ? 'text-danger' : 'text-success'}>
                          {selectedRecord.isOverdue ? `${selectedRecord.daysOverdue} days` : 'None'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {selectedRecord.isOverdue ? (
                    <div className="alert alert-warning border-warning">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-dark">
                          <i className="bi bi-cash-coin me-1"></i>Calculated Late Fine:
                        </span>
                        <span className="h4 mb-0 fw-bold text-danger">
                          ₹{selectedRecord.currentFine}
                        </span>
                      </div>
                      <div className="small text-muted mb-3">
                        Rate: ₹5.00 per overdue day ({selectedRecord.daysOverdue} days × ₹5)
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="finePaidSwitch"
                          checked={finePaid}
                          onChange={(e) => setFinePaid(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="finePaidSwitch">
                          Mark fine as paid right now
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-secondary border py-2 small">
                      <i className="bi bi-check-circle me-1"></i>Returned on time. No late fine applied.
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Return Notes (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Good condition..."
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setSelectedRecord(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark" disabled={processing}>
                    {processing ? 'Processing...' : 'Confirm Return'}
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

export default ReturnBookPage;

