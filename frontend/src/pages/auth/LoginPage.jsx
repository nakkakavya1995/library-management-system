import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertMessage from '../../components/AlertMessage';
import { signInWithGoogle, resetPasswordWithFirebase } from '../../services/firebase';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=true')) {
      return 'Your session has expired or database was reset. Please log in again with your credentials.';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password modal state (Firebase)
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
    <div className="container d-flex align-items-center justify-content-center min-vh-100 py-5">
      <div className="card shadow-sm border-0" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle p-3 mb-3 shadow-sm">
              <i className="bi bi-book-half fs-2"></i>
            </div>
            <h4 className="fw-bold mb-1">Library Management</h4>
            <p className="text-muted small">Sign in to access your role dashboard</p>
          </div>

          <AlertMessage type="danger" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="aarav.sharma@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-semibold mb-0">Password</label>
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
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-dark w-100 py-2 fw-semibold mb-3 shadow-sm"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <span><span className="spinner-border spinner-border-sm me-2"></span>Signing In...</span>
              ) : (
                <span><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="d-flex align-items-center my-3">
            <hr className="flex-grow-1 my-0 text-muted" />
            <span className="px-3 text-muted small fw-semibold">OR</span>
            <hr className="flex-grow-1 my-0 text-muted" />
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            className="btn btn-outline-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-3 shadow-sm bg-white"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <span><span className="spinner-border spinner-border-sm me-2"></span>Connecting to Google...</span>
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
                <span className="fw-semibold text-dark">Continue with Google</span>
              </>
            )}
          </button>

          <div className="text-center mt-3">
            <span className="text-muted small">New student? </span>
            <Link to="/register" className="small fw-semibold text-decoration-none">
              Register here
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (Firebase Auth) */}
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

