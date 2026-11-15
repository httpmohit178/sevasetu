import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Spinner from './Spinner';
import { apiRequest } from '@/lib/api-client';

type Role = 'customer' | 'provider';
type Decision = 'checking' | 'allowed' | 'anonymous' | 'wrong-role' | 'provider-profile';

export default function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const location = useLocation();
  const [decision, setDecision] = useState<Decision>('checking');

  useEffect(() => {
    let active = true;
    const verify = async () => {
      setDecision('checking');
      const token = localStorage.getItem('sevasetu-token');
      if (!token) { if (active) setDecision('anonymous'); return; }
      const cachedRole = localStorage.getItem('sevasetu-role') === 'provider' ? 'provider' : 'customer';
      try {
        const { user } = await apiRequest<{ user: { role?: string } }>('/auth/me');
        const actualRole: Role = user.role === 'provider' ? 'provider' : 'customer';
        localStorage.setItem('sevasetu-role', actualRole);
        if (!active) return;
        if (role && actualRole !== role) { setDecision('wrong-role'); return; }
        if (role === 'provider' && location.pathname === '/provider-dashboard') {
          const { provider } = await apiRequest<{ provider: unknown }>('/providers/me');
          if (!active) return;
          if (!provider) { setDecision('provider-profile'); return; }
        }
        setDecision('allowed');
      } catch (error) {
        if (!active) return;
        if (error instanceof Error && error.message === 'Sign in to continue') { setDecision('anonymous'); return; }
        // Allow cached app screens during an outage. Protected APIs still validate the session and role.
        if (!role || cachedRole === role) setDecision('allowed');
        else setDecision('wrong-role');
      }
    };
    void verify();
    window.addEventListener('sevasetu-auth-change', verify);
    window.addEventListener('storage', verify);
    return () => {
      active = false;
      window.removeEventListener('sevasetu-auth-change', verify);
      window.removeEventListener('storage', verify);
    };
  }, [location.pathname, role]);

  if (decision === 'checking') return <div className="grid min-h-[50vh] place-items-center"><Spinner /></div>;
  if (decision === 'anonymous') return <Navigate to="/login" state={{ from: location.pathname, accountType: role || 'customer' }} replace />;
  if (decision === 'provider-profile') return <Navigate to="/join?start=application" replace />;
  if (decision === 'wrong-role') return <Navigate to={localStorage.getItem('sevasetu-role') === 'provider' ? '/provider-dashboard' : '/dashboard'} replace />;
  return <>{children}</>;
}
