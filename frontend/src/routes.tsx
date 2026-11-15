import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import HomePage from './pages/index';
import RequireAuth from './components/RequireAuth';

// Lazy load components for code splitting (except HomePage for instant loading)
const NotFoundPage = lazy(() => import('./pages/_404'));
const AIAssistantPage = lazy(() => import('./pages/assistant'));
const ServicesPage = lazy(() => import('./pages/services'));
const TrackerPage = lazy(() => import('./pages/tracker'));
const RewardsPage = lazy(() => import('./pages/rewards'));
const PaymentPage = lazy(() => import('./pages/payment'));
const SchemesPage = lazy(() => import('./pages/schemes'));
const LoginPage = lazy(() => import('./pages/login'));
const JoinPage = lazy(() => import('./pages/join'));
const UserDashboardPage = lazy(() => import('./pages/dashboard'));
const ProviderDashboardPage = lazy(() => import('./pages/provider-dashboard'));
const SettingsPage = lazy(() => import('./pages/settings'));

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/assistant', element: <AIAssistantPage /> },
  { path: '/services', element: <ServicesPage /> },
  { path: '/tracker', element: <RequireAuth role="customer"><TrackerPage /></RequireAuth> },
  { path: '/rewards', element: <RequireAuth role="customer"><RewardsPage /></RequireAuth> },
  { path: '/payment', element: <RequireAuth role="customer"><PaymentPage /></RequireAuth> },
  { path: '/schemes', element: <SchemesPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/join', element: <JoinPage /> },
  { path: '/dashboard', element: <RequireAuth role="customer"><UserDashboardPage /></RequireAuth> },
  { path: '/provider-dashboard', element: <RequireAuth role="provider"><ProviderDashboardPage /></RequireAuth> },
  { path: '/settings', element: <RequireAuth><SettingsPage /></RequireAuth> },
  { path: '*', element: <NotFoundPage /> },
];

// Types for type-safe navigation
export type Path = '/' | '/assistant' | '/services' | '/tracker' | '/rewards' | '/payment';

export type Params = Record<string, string | undefined>;
