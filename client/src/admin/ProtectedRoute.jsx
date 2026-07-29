import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking'); // checking | ok | fail

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setStatus('fail'); return; }
    fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? setStatus('ok') : setStatus('fail'))
      .catch(() => setStatus('fail'));
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return status === 'ok' ? children : <Navigate to="/admin" replace />;
}
