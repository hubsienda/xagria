'use client';

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
        <span className="text-[10px] font-black text-brand uppercase leading-none px-2 py-1 bg-brand/10 rounded-md">
          {unit}
        </span>
      </div>
      <input 
        type="number"
        inputMode="decimal"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-surface border-2 border-white/5 focus:border-brand text-white text-3xl p-5 rounded-[1.5rem] outline-none transition-all placeholder:text-gray-800 font-bold"
        placeholder="0.00"
      />
    </div>
  );
}
