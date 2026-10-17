import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
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
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-arena-bg text-arena-text">
          <Navbar />
          <main className="flex-1">
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
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;
