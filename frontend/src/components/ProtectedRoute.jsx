import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's permitted dashboard if they don't have access
    const roleRedirects = {
      admin: '/admin',
      librarian: '/librarian',
      student: '/student'
    };
    return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

