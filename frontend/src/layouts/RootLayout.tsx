import { type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

import Footer from '@/layouts/parts/Footer';
import Header from '@/layouts/parts/Header';
import Website from '@/layouts/Website';

/**
 * Root layout component that wraps all pages with consistent header and footer
 */
interface RootLayoutProps {
  children: ReactElement;
}

// Pages that manage their own full-screen layout (no shared header/footer)
const STANDALONE_PATHS = ['/dashboard', '/provider-dashboard', '/login', '/join', '/settings'];

export default function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();
  const isStandalone = STANDALONE_PATHS.some(p => location.pathname.startsWith(p));

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <Website>
      <Header />
      {children}
      <Footer />
    </Website>
  );
}
