import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GuidedTour, isTourDismissed } from '../components/GuidedTour';
import { FundsGuideModal } from '../components/FundsGuideModal';

interface UIContextType {
  isTourOpen: boolean;
  openTour: () => void;
  closeTour: () => void;
  isFundsGuideOpen: boolean;
  openFundsGuide: () => void;
  closeFundsGuide: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isFundsGuideOpen, setIsFundsGuideOpen] = useState(false);

  // Automatically trigger tour on first visit if not dismissed
  useEffect(() => {
    if (!isTourDismissed()) {
      setIsTourOpen(true);
    }
  }, []);

  const openTour = () => setIsTourOpen(true);
  const closeTour = () => setIsTourOpen(false);

  const openFundsGuide = () => setIsFundsGuideOpen(true);
  const closeFundsGuide = () => setIsFundsGuideOpen(false);

  return (
    <UIContext.Provider
      value={{
        isTourOpen,
        openTour,
        closeTour,
        isFundsGuideOpen,
        openFundsGuide,
        closeFundsGuide,
      }}
    >
      {children}
      <GuidedTour isOpen={isTourOpen} onClose={closeTour} />
      <FundsGuideModal isOpen={isFundsGuideOpen} onClose={closeFundsGuide} />
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
