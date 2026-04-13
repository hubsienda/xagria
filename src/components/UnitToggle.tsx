'use client';

import { useAgri } from '@/context/AgriContext';
import { useTranslations } from 'next-intl';

export default function UnitToggle() {
  const { units, toggleUnits } = useAgri();
  const t = useTranslations('Common');

  return (
    <button 
      onClick={toggleUnits}
      className="flex items-center gap-1 bg-surface border border-white/10 p-1 rounded-full overflow-hidden"
    >
      <div className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${units === 'metric' ? 'bg-brand text-black' : 'text-gray-500'}`}>
        {t('metric')}
      </div>
      <div className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${units === 'american' ? 'bg-brand text-black' : 'text-gray-500'}`}>
        {t('american')}
      </div>
    </button>
  );
}
