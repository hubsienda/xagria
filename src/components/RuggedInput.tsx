'use client';

import React from 'react';

interface RuggedInputProps {
  label: string;
  unit: string;
  value: number;
  onChange: (val: number) => void;
}

export default function RuggedInput({ label, unit, value, onChange }: RuggedInputProps) {
  return (
    <div className="mb-5 px-1">
      <div className="flex justify-between items-end mb-2">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
          {label}
        </label>
        <span 
          className="text-[10px] font-black uppercase leading-none px-2 py-1 rounded-md"
          style={{ backgroundColor: 'rgba(173, 255, 47, 0.1)', color: '#ADFF2F' }}
        >
          {unit}
        </span>
      </div>
      <input 
        type="number"
        inputMode="decimal"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full text-white text-3xl p-5 rounded-[1.5rem] outline-none transition-all placeholder:text-gray-800 font-bold border-2 border-white/5"
        style={{ backgroundColor: '#171717' }}
        onFocus={(e) => e.target.style.borderColor = '#ADFF2F'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.05)'}
        placeholder="0.00"
      />
    </div>
  );
}
