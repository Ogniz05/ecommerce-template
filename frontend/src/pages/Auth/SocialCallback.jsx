import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useStore';
import api from '../../utils/api';

export default function SocialCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/auth/login?error=google'); return; }

    localStorage.setItem('token', token);
    api.get('/auth/me')
      .then(d => {
        login(d.user, token);
        navigate('/');
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/auth/login?error=google');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary text-sm font-body">Accesso in corso...</p>
      </div>
    </div>
  );
}
