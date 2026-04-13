'use client';

import React from 'react';

type RuggedInputProps = {
  label: string;
  unit: string;
  value: number | '';
  onChange: (val: number | '') => void;
  step?: string;
  min?: string;
};

export default function RuggedInput({
  label,
  unit,
  value,
  onChange,
  step = 'any',
  min = '0'
}: RuggedInputProps) {
  return (
    <div className="mb-5 px-1">
      <div className="mb-2 flex items-end justify-between gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest leading-none text-gray-500">
          {label}
        </label>
        <span className="rounded-md px-2 py-1 text-[10px] font-black uppercase leading-none text-brand bg-brand/10">
          {unit}
        </span>
      </div>

      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? '' : Number(raw));
        }}
        placeholder="0.00"
        className="w-full rounded-[1.5rem] border-2 border-white/5 bg-surface p-5 text-3xl font-bold text-white outline-none transition-all placeholder:text-gray-700 focus:border-brand"
      />
    </div>
  );
}
