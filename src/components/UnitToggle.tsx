'use client';

import {useAgri} from '@/context/AgriContext';
import {useTranslations} from 'next-intl';

export default function UnitToggle() {
  const {units, setUnits} = useAgri();
  const t = useTranslations('Common');

  return (
    <div className="flex items-center gap-1 overflow-hidden rounded-full border border-white/10 bg-surface p-1">
      <button
        type="button"
        onClick={() => setUnits('metric')}
        className={`rounded-full px-2.5 py-1 text-[10px] font-black transition-all sm:px-3 ${
          units === 'metric' ? 'bg-brand text-black' : 'text-gray-300 hover:text-white'
        }`}
      >
        {t('metric')}
      </button>
      <button
        type="button"
        onClick={() => setUnits('american')}
        className={`rounded-full px-2.5 py-1 text-[10px] font-black transition-all sm:px-3 ${
          units === 'american' ? 'bg-brand text-black' : 'text-gray-300 hover:text-white'
        }`}
      >
        {t('american')}
      </button>
    </div>
  );
}
