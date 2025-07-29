import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type ClubLocation = 'wiggles_gentlemens_club' | 'fantasy_gentlemens_club';

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
    id: 'wiggles_gentlemens_club' as ClubLocation,
    name: 'Wiggles Gentlemen\'s Club',
    address: '123 Entertainment District, Downtown'
  },
  {
    id: 'fantasy_gentlemens_club' as ClubLocation,
    name: 'Fantasy Gentlemen\'s Club', 
    address: '456 Nightlife Avenue, Uptown'
  }
];

export function ClubSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<ClubLocation>('wiggles_gentlemens_club');

  useEffect(() => {
    const stored = localStorage.getItem('selectedClub');
    if (stored && (stored === 'wiggles_gentlemens_club' || stored === 'fantasy_gentlemens_club')) {
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