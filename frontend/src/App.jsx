import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import { ShortlistProvider } from './context/ShortlistContext';

// Route-level code splitting via React.lazy()
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));
const PlayerDetailPage = lazy(() => import('./pages/PlayerDetailPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const TeamDetailPage = lazy(() => import('./pages/TeamDetailPage'));
const RankingsPage = lazy(() => import('./pages/RankingsPage'));
const ShortlistPage = lazy(() => import('./pages/ShortlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ShortlistProvider>
        <Suspense fallback={<LoadingSpinner message="INITIALIZING SCOUTIQ MODULE..." />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<OverviewPage />} />
              <Route path="players" element={<PlayersPage />} />
              <Route path="players/:id" element={<PlayerDetailPage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="teams/:id" element={<TeamDetailPage />} />
              <Route path="rankings" element={<RankingsPage />} />
              <Route path="shortlist" element={<ShortlistPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ShortlistProvider>
    </BrowserRouter>
  );
}
