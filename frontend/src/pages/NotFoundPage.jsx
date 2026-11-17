import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container text-center py-5">
      <div className="py-5">
        <i className="bi bi-compass fs-1 text-danger mb-3 d-block"></i>
        <h1 className="display-4 fw-bold">404</h1>
        <h4 className="fw-semibold mb-3">Page Not Found</h4>
        <p className="text-muted mb-4">
          The requested page does not exist or you do not have permission to view it.
        </p>
        <Link to="/login" className="btn btn-primary">
          Return to Portal
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

