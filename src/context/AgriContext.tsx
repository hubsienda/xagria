'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type Units = 'metric' | 'american';

const AgriContext = createContext({
  units: 'metric' as Units,
  toggleUnits: () => {},
});

export const AgriProvider = ({ children }: { children: React.ReactNode }) => {
  const [units, setUnits] = useState<Units>('metric');

  useEffect(() => {
    const saved = localStorage.getItem('xagria-units') as Units;
    if (saved) setUnits(saved);
  }, []);

  const toggleUnits = () => {
    const next = units === 'metric' ? 'american' : 'metric';
    setUnits(next);
    localStorage.setItem('xagria-units', next);
  };

  return (
    <AgriContext.Provider value={{ units, toggleUnits }}>
      <div className="min-h-screen bg-background text-white">
        {children}
      </div>
    </AgriContext.Provider>
  );
};

export const useAgri = () => useContext(AgriContext);
