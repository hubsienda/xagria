interface Props {
  label: string;
  unit: string;
  value: number;
  onChange: (val: number) => void;
}

export default function RuggedInput({ label, unit, value, onChange }: Props) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
        <span className="text-xs font-bold text-brand uppercase">{unit}</span>
      </div>
      <input 
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-surface border-2 border-transparent focus:border-brand text-2xl p-4 rounded-2xl text-white outline-none transition-all"
        placeholder="0.00"
      />
    </div>
  );
}
