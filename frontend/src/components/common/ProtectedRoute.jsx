import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notify from '../ui/notify';

export default function ProtectedRoute({ requiredRole, children }) {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      notify('Please login to continue', 'error');
      navigate('/', { replace: true });
      return;
    }
    if (requiredRole) {
      const currentRole = String(role || '').toLowerCase();
      const required = String(requiredRole || '').toLowerCase();
      if (currentRole !== required) {
        notify('You are not authorized to access this page', 'error');
        navigate(-1);
      }
    }
  }, [isAuthenticated, role, requiredRole, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
