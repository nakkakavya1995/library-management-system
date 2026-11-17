import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const RenewalsPage = () => {
  const [issues, setIssues] = useState([]);
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

  const handleRenewalAction = async (id, action) => {
    try {
      await api.put(`/issues/${id}/handle-renewal`, { action });
      setSuccess(`Renewal request ${action === 'approve' ? 'approved (+7 days extended)' : 'rejected'}`);
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
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Checking renewal requests..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Student</th>
                    <th>Current Due Date</th>
                    <th>Renewals Used</th>
                    <th>Request Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRenewals.length > 0 ? (
                    pendingRenewals.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="fw-semibold">{item.book?.title}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{item.student?.name}</div>
                          <small className="text-muted">
                            {item.student?.studentId} • {item.student?.email}
                          </small>
                        </td>
                        <td>
                          <span className="fw-semibold">{new Date(item.dueDate).toLocaleDateString()}</span>
                        </td>
                        <td>{item.renewalCount || 0} of 1</td>
                        <td>
                          {item.renewalRequestDate
                            ? new Date(item.renewalRequestDate).toLocaleDateString()
                            : 'Recent'}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-dark"
                              onClick={() => handleRenewalAction(item._id, 'approve')}
                            >
                              <i className="bi bi-check-lg me-1"></i> Approve
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => handleRenewalAction(item._id, 'reject')}
                            >
                              <i className="bi bi-x-lg me-1"></i> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No pending loan renewal requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                          className={`badge ${
                            item.renewalStatus === 'approved' ? 'bg-success' : 'bg-danger'
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

