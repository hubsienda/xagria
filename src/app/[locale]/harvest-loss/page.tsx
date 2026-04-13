'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAgri } from '@/context/AgriContext';
import RuggedInput from '@/components/RuggedInput';
import { ArrowLeft, Copy, Share2, Download } from 'lucide-react';
import Link from 'next/link';

export default function HarvestLossPage() {
  const t = useTranslations();
  const { units } = useAgri();
  const isMetric = units === 'metric';

  const [seeds, setSeeds] = useState(0);
  
  // Basic grain loss formula: (Seeds / Factor)
  // For Wheat: ~18 seeds/0.1m2 is roughly 1% loss in EU.
  const factor = isMetric ? 18 : 19.5; 
  const lossResult = seeds > 0 ? seeds / factor : 0;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/" className="inline-flex items-center text-gray-500 hover:text-brand mb-8 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Back</span>
      </Link>

      <h1 className="text-4xl font-black text-brand mb-8 uppercase tracking-tighter italic">
        {t('HarvestLoss.name')}
      </h1>

      <RuggedInput 
        label={t('HarvestLoss.labelSeeds')} 
        unit={isMetric ? "per 0.1 m²" : "per ft²"} 
        value={seeds} 
        onChange={setSeeds} 
      />

      <div className="mt-10 p-8 bg-surface border-2 border-brand/20 rounded-[2.5rem]">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
          {t('HarvestLoss.result')}
        </span>
        <div className="text-6xl font-black text-brand mt-2 flex items-baseline gap-3">
          {lossResult.toFixed(2)}
          <span className="text-2xl font-bold text-white/50">{isMetric ? '%' : 'bu/ac'}</span>
        </div>
      </div>
    </div>
  );
}
