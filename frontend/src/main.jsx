import React, { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

const LazyApp = lazy(() => import('./App.jsx'));

const router = createBrowserRouter(
  [
    {
      path: '/*',
      element: (
        <Suspense fallback={<div />}>
          <LazyApp />
        </Suspense>
      ),
      errorElement: <FallbackError />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function FallbackError() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Oops!</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Something went wrong. Please refresh the page.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Reload Page</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} fallbackElement={<div />} future={{ v7_startTransition: true }} />
  </StrictMode>
);
