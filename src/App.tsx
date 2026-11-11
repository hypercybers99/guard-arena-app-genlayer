import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { UIProvider } from './context/UIContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { LandingPage } from './pages/LandingPage';
import { ArenaPage } from './pages/ArenaPage';
import { GuardDetailPage } from './pages/GuardDetailPage';
import { AttackPage } from './pages/AttackPage';
import { RegisterGuardPage } from './pages/RegisterGuardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { GuardGateDemoPage } from './pages/GuardGateDemoPage';
import { EvidencePage } from './pages/EvidencePage';
import { WalletPage } from './pages/WalletPage';

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <UIProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-arena-bg text-arena-text w-full overflow-x-hidden">
            {/* Accessible Skip to Content Link */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-arena-primary focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-arena-accent font-medium text-sm"
            >
              Skip to content
            </a>

            <Navbar />

            <main id="main-content" className="flex-1 w-full min-w-0 overflow-x-hidden">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/arena" element={<ArenaPage />} />
                  <Route path="/guard/:id" element={<GuardDetailPage />} />
                  <Route path="/attack" element={<AttackPage />} />
                  <Route path="/attack/:targetId" element={<AttackPage />} />
                  <Route path="/register" element={<RegisterGuardPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/gate" element={<GuardGateDemoPage />} />
                  <Route path="/evidence" element={<EvidencePage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>

            <Footer />
          </div>
        </BrowserRouter>
      </UIProvider>
    </WalletProvider>
  );
};

export default App;
