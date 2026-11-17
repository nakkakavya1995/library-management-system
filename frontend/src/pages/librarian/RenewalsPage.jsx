import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const RenewalsPage = () => {
  const [issues, setIssues] = useState([]);
  const [extensionDaysMap, setExtensionDaysMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues?status=issued');
      setIssues(res.data.issues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch renewal requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleRenewalAction = async (id, action, customDays) => {
    try {
      const selectedDays = customDays || extensionDaysMap[id] || 14;
      await api.put(`/issues/${id}/handle-renewal`, { action, days: selectedDays });
      setSuccess(
        `Renewal request ${action === 'approve' ? `approved (extended by ${selectedDays} days)` : 'rejected'}`
      );
      fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process renewal');
    }
  };

  // Split into pending requests and already processed
  const pendingRenewals = issues.filter((i) => i.renewalStatus === 'requested');
  const pastRenewals = issues.filter((i) => ['approved', 'rejected'].includes(i.renewalStatus));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Renewals</h3>
          <p className="text-muted small mb-0">Review requests to extend book due dates</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Pending Renewals */}
      <div className="card mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <span className="fw-bold">
            <i className="bi bi-clock-history me-2"></i>Pending Renewals ({pendingRenewals.length})
          </span>
        </div>
        <div className="card-body">
          {loading ? (
            <LoadingSpinner text="Checking renewal requests..." />
          ) : pendingRenewals.length > 0 ? (
            <div className="row g-3">
              {pendingRenewals.map((item) => {
                const selectedDays = extensionDaysMap[item._id] || item.requestedExtensionDays || 14;
                const formattedDate = new Date(item.dueDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });

                return (
                  <div key={item._id} className="col-12 col-md-6 col-xl-5">
                    <div
                      className="p-4 shadow-sm"
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #1f2937'
                      }}
                    >
                      {/* Title & Badge */}
                      <div className="mb-3">
                        <div className="text-white fw-bold mb-2" style={{ fontSize: '1.15rem' }}>
                          Renewal Requests
                        </div>
                        <span
                          style={{
                            backgroundColor: '#3b1700',
                            color: '#f97316',
                            border: '1px solid #7c2d12',
                            borderRadius: '9999px',
                            padding: '4px 14px',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}
                        >
                          Pending Request
                        </span>
                      </div>

                      {/* Metadata items */}
                      <div className="mb-4" style={{ fontSize: '0.98rem', lineHeight: '2' }}>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Student: </span>
                          <span className="fw-semibold text-white">{item.student?.name || 'Student'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Book: </span>
                          <span className="fw-semibold text-white">{item.book?.title || 'Book'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Current Due Date: </span>
                          <span className="text-white">{formattedDate}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span style={{ color: '#9ca3af' }}>Requested Extension: </span>
                            <span className="fw-semibold text-white">{selectedDays} days</span>
                          </div>
                          <select
                            className="form-select form-select-sm bg-black text-white border-secondary py-0 px-2"
                            style={{ width: '95px', fontSize: '0.78rem', height: '28px' }}
                            value={selectedDays}
                            onChange={(e) =>
                              setExtensionDaysMap({
                                ...extensionDaysMap,
                                [item._id]: parseInt(e.target.value, 10)
                              })
                            }
                            title="Change extension days"
                          >
                            <option value={7}>7 days</option>
                            <option value={14}>14 days</option>
                            <option value={21}>21 days</option>
                            <option value={30}>30 days</option>
                          </select>
                        </div>
                      </div>

                      {/* Action Buttons matching screenshot */}
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className="btn fw-semibold"
                          style={{
                            backgroundColor: '#059669',
                            borderColor: '#059669',
                            color: '#ffffff',
                            borderRadius: '9999px',
                            padding: '8px 24px',
                            flex: 1,
                            fontSize: '0.95rem'
                          }}
                          onClick={() => handleRenewalAction(item._id, 'approve', selectedDays)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn fw-semibold"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: '#dc2626',
                            color: '#ef4444',
                            border: '1.5px solid #dc2626',
                            borderRadius: '9999px',
                            padding: '8px 24px',
                            flex: 1,
                            fontSize: '0.95rem'
                          }}
                          onClick={() => handleRenewalAction(item._id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-clock-history fs-3 d-block mb-1 text-muted"></i>
              No pending loan renewal requests.
            </div>
          )}
        </div>
      </div>

      {/* Previously Handled Renewals */}
      <div className="card">
        <div className="card-header bg-light">
          <span className="fw-bold">
            <i className="bi bi-card-checklist me-2"></i>Handled Renewals
          </span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Student</th>
                  <th>Current Due Date</th>
                  <th>Renewal Status</th>
                  <th>Times Renewed</th>
                </tr>
              </thead>
              <tbody>
                {pastRenewals.length > 0 ? (
                  pastRenewals.map((item) => (
                    <tr key={item._id}>
                      <td>{item.book?.title}</td>
                      <td>{item.student?.name} ({item.student?.studentId})</td>
                      <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`badge ${item.renewalStatus === 'approved' ? 'bg-success' : 'bg-danger'
                            } text-capitalize`}
                        >
                          {item.renewalStatus}
                        </span>
                      </td>
                      <td>{item.renewalCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-3 text-muted">
                      No past renewal history for currently active issues.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalsPage;


