import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type ClubLocation = 'main' | 'second';

interface ClubSelectionContextType {
  selectedClub: ClubLocation;
  setSelectedClub: (club: ClubLocation) => void;
  clubs: Array<{
    id: ClubLocation;
    name: string;
    address: string;
  }>;
}

const ClubSelectionContext = createContext<ClubSelectionContextType | undefined>(undefined);

export const clubs = [
  {
    id: 'main' as ClubLocation,
    name: 'Main Location',
    address: '123 Main Street, Downtown'
  },
  {
    id: 'second' as ClubLocation,
    name: 'Second Location', 
    address: '456 Oak Avenue, Uptown'
  }
];

export function ClubSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<ClubLocation>('main');

  useEffect(() => {
    const stored = localStorage.getItem('selectedClub');
    if (stored && (stored === 'main' || stored === 'second')) {
      setSelectedClub(stored);
    }
  }, []);

  const updateSelectedClub = (club: ClubLocation) => {
    setSelectedClub(club);
    localStorage.setItem('selectedClub', club);
  };

  const contextValue: ClubSelectionContextType = {
    selectedClub,
    setSelectedClub: updateSelectedClub,
    clubs
  };

  return (
    <ClubSelectionContext.Provider value={contextValue}>
      {children}
    </ClubSelectionContext.Provider>
  );
}

export function useClubSelection() {
  const context = useContext(ClubSelectionContext);
  if (context === undefined) {
    throw new Error('useClubSelection must be used within a ClubSelectionProvider');
  }
  return context;
}