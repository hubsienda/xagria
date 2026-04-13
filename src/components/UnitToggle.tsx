'use client';

import { useAgri } from '@/context/AgriContext';
import { useTranslations } from 'next-intl';

export default function UnitToggle() {
  const { units, toggleUnits } = useAgri();
  const t = useTranslations('Common');

  const activeStyle = {
    backgroundColor: '#ADFF2F',
    color: '#000000'
  };

  const inactiveStyle = {
    color: '#6b7280'
  };

  return (
    <button 
      onClick={toggleUnits}
      className="flex items-center gap-1 border border-white/10 p-1 rounded-full overflow-hidden"
      style={{ backgroundColor: '#171717' }}
    >
      <div 
        className="px-3 py-1 rounded-full text-[10px] font-black transition-all"
        style={units === 'metric' ? activeStyle : inactiveStyle}
      >
        {t('metric')}
      </div>
      <div 
        className="px-3 py-1 rounded-full text-[10px] font-black transition-all"
        style={units === 'american' ? activeStyle : inactiveStyle}
      >
        {t('american')}
      </div>
    </button>
  );
}
