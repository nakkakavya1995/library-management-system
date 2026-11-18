import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertMessage from '../../components/AlertMessage';
import { signInWithGoogle, resetPasswordWithFirebase } from '../../services/firebase';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputsReady, setInputsReady] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => {
      setInputsReady(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);
  const [error, setError] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=true')) {
      return 'Your session has expired or database was reset. Please log in again with your credentials.';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleRoleRedirect = (userRole) => {
    if (userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'librarian') {
      navigate('/librarian');
    } else {
      navigate('/student');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      handleRoleRedirect(user.role);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      setGoogleLoading(true);
      const result = await signInWithGoogle();
      const firebaseUser = result.user;

      const user = await loginWithGoogle({
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        googleId: firebaseUser.uid,
        photoUrl: firebaseUser.photoURL
      });

      handleRoleRedirect(user.role);
    } catch (err) {
      console.error('Firebase Google Sign-In Error:', err);
      const errCode = err.code || '';
      const errMsg = err.message || '';

      if (errCode.includes('popup-closed') || errCode.includes('cancelled')) {
        return;
      }

      if (errCode === 'auth/popup-blocked') {
        setError('Google Sign-In popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (errCode === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        setError(`This domain (${currentHost}) is not authorized in Firebase Console. Please add "${currentHost}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
      } else if (errCode === 'auth/network-request-failed') {
        setError('Network Error: Could not reach Google Authentication servers. Please check your internet connection.');
      } else if (err.code === 'ERR_NETWORK' || errMsg === 'Network Error' || errMsg.includes('Network Error')) {
        setError('Network Error: Could not connect to the backend server. Please make sure the backend is running and try again.');
      } else if (err.response?.status === 502) {
        setError('Backend server connection error (502). The server is reconnecting, please try signing in again.');
      } else if (
        errCode.includes('api-key') ||
        errCode.includes('invalid-api-key') ||
        errMsg.includes('api-key-not-valid') ||
        errMsg.includes('API key not valid')
      ) {
        setError('Firebase Error: The API Key in frontend/.env is invalid. Please check your Firebase project keys.');
      } else {
        setError(err.response?.data?.message || errMsg || 'Firebase Google Sign-In failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail) {
      setResetError('Please enter your registered email address.');
      return;
    }

    try {
      setResetLoading(true);
      await resetPasswordWithFirebase(resetEmail.trim());
      setResetSuccess('Password reset link sent! Please check your email inbox.');
    } catch (err) {
      console.error('Firebase Reset Password Error:', err);
      const code = err.code || '';
      if (code === 'auth/user-not-found') {
        setResetError('No account found with this email in Firebase.');
      } else if (code === 'auth/invalid-email') {
        setResetError('Invalid email address format.');
      } else {
        setResetError(err.message || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div
        className="card border-0 shadow-lg w-100 overflow-hidden"
        style={{
          maxWidth: '960px',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="row g-0">

          <div
            className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center text-center p-4 p-lg-5 text-white"
            style={{
              background: 'linear-gradient(135deg, #2b70f0 0%, #1e5dd8 100%)',
              minHeight: '520px'
            }}
          >
            <div style={{ maxWidth: '380px' }} className="d-flex flex-column align-items-center">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <i className="bi bi-book-half fs-2 text-white"></i>
              </div>

              <h2 className="fw-bold mb-3 text-white" style={{ letterSpacing: '-0.02em' }}>
                Library Management
              </h2>

              <p className="mb-4 lh-base" style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: '0.92rem' }}>
                A centralized, full-stack digital platform engineered for automated book circulation, real-time catalog management, reservations, and instant email notifications across Admin, Librarian, and Student roles.
              </p>

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
                  <span>Role-based access for Admin, Librarian & Student</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-white opacity-75"></i>
                  <span>One-click return desk, renewals & fine tracking</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-white opacity-75"></i>
                  <span>Hold reservations with restock alerts</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-white opacity-75"></i>
                  <span>Automated email delivery via Nodemailer & Relay</span>
                </div>
              </div>

              <Link
                to="/register"
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
                New student? Create an account
              </Link>
            </div>
          </div>

          <div className="col-12 col-md-6 d-flex flex-column justify-content-center p-4 p-lg-5 bg-white">
            <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>
              <h2 className="fw-bold text-dark text-center mb-4" style={{ letterSpacing: '-0.02em', fontSize: '2rem' }}>
                Sign In
              </h2>

              <AlertMessage type="danger" message={error} onClose={() => setError('')} />

              <form onSubmit={handleSubmit} autoComplete="off">

                <input type="text" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
                <input type="password" style={{ display: 'none' }} tabIndex="-1" autoComplete="new-password" />

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">User Name / Email</label>
                  <input
                    type="text"
                    name="user_login_identity"
                    className="form-control"
                    placeholder="Enter user name or email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                    readOnly={!inputsReady}
                    onFocus={() => setInputsReady(true)}
                    required
                    style={{
                      background: '#edf0f5',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold text-muted mb-0">Password</label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small text-muted"
                      onClick={() => {
                        setResetEmail(email);
                        setResetSuccess('');
                        setResetError('');
                        setShowForgotModal(true);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    name="user_login_passcode"
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    readOnly={!inputsReady}
                    onFocus={() => setInputsReady(true)}
                    required
                    style={{
                      background: '#edf0f5',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div className="mb-4 text-end"></div>

                <button
                  type="submit"
                  className="btn w-100 py-3 fw-semibold mb-3 shadow-sm text-white"
                  disabled={loading || googleLoading}
                  style={{
                    backgroundColor: '#3272f0',
                    borderColor: '#3272f0',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                >
                  {loading ? (
                    <span><span className="spinner-border spinner-border-sm me-2"></span>Signing In...</span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="text-center my-3">
                <span className="text-muted small">or sign in with</span>
              </div>

              <button
                type="button"
                className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: '#1e293b'
                }}
              >
                {googleLoading ? (
                  <span className="text-muted small"><span className="spinner-border spinner-border-sm me-2"></span>Connecting to Google...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span className="fw-semibold text-dark small">Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleForgotPassword}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Reset Password</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetSuccess('');
                      setResetError('');
                    }}
                  ></button>
                </div>
                <div className="modal-body pt-3">
                  <p className="text-muted small mb-3">
                    Enter your registered email address and Firebase will send you a password reset link.
                  </p>

                  <AlertMessage type="danger" message={resetError} onClose={() => setResetError('')} />
                  <AlertMessage type="success" message={resetSuccess} onClose={() => setResetSuccess('')} />

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Registered Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetSuccess('');
                      setResetError('');
                    }}
                  >
                    Close
                  </button>
                  <button type="submit" className="btn btn-dark" disabled={resetLoading}>
                    {resetLoading ? (
                      <span><span className="spinner-border spinner-border-sm me-2"></span>Sending...</span>
                    ) : (
                      'Send Reset Link'
                    )}
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

export default LoginPage;
