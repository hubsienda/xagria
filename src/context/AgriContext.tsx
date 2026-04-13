'use client';

import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';

type Units = 'metric' | 'american';

type AgriContextValue = {
  units: Units;
  setUnits: (units: Units) => void;
  toggleUnits: () => void;
};

const AgriContext = createContext<AgriContextValue | undefined>(undefined);

export function AgriProvider({children}: {children: React.ReactNode}) {
  const [units, setUnitsState] = useState<Units>('metric');

  useEffect(() => {
    const saved = window.localStorage.getItem('xagria-units');
    if (saved === 'metric' || saved === 'american') {
      setUnitsState(saved);
    }
  }, []);

  const setUnits = (value: Units) => {
    setUnitsState(value);
    window.localStorage.setItem('xagria-units', value);
  };

  const toggleUnits = () => {
    setUnits(units === 'metric' ? 'american' : 'metric');
  };

  const value = useMemo(
    () => ({units, setUnits, toggleUnits}),
    [units]
  );

  return <AgriContext.Provider value={value}>{children}</AgriContext.Provider>;
}

export function useAgri() {
  const context = useContext(AgriContext);
  if (!context) {
    throw new Error('useAgri must be used within AgriProvider');
  }
  return context;
}
