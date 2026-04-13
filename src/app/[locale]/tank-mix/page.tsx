'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAgri } from '@/context/AgriContext';
import RuggedInput from '@/components/RuggedInput';
import { Copy, Share2, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TankMixPage() {
  const t = useTranslations();
  const { units } = useAgri();
  
  const [tankSize, setTankSize] = useState(0);
  const [appRate, setAppRate] = useState(0);
  const [dose, setDose] = useState(0);

  const isMetric = units === 'metric';
  const result = (tankSize > 0 && appRate > 0) ? (tankSize / appRate) * dose : 0;

  const unitLabels = {
    tank: isMetric ? 'L' : 'GAL',
    rate: isMetric ? 'L/HA' : 'GPA',
    dose: isMetric ? 'L/HA' : 'QT/AC',
    result: isMetric ? 'L' : 'QT'
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/" className="inline-flex items-center text-gray-500 hover:text-brand mb-8 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Back</span>
      </Link>

      <h1 className="text-4xl font-black text-brand mb-8 uppercase tracking-tighter italic">
        {t('TankMix.name')}
      </h1>

      <div className="space-y-4">
        <RuggedInput label={t('TankMix.labelTank')} unit={unitLabels.tank} value={tankSize} onChange={setTankSize} />
        <RuggedInput label={t('TankMix.labelRate')} unit={unitLabels.rate} value={appRate} onChange={setAppRate} />
        <RuggedInput label={t('TankMix.labelConcentration')} unit={unitLabels.dose} value={dose} onChange={setDose} />
      </div>

      <div className="mt-10 p-8 bg-surface border-2 border-brand/20 rounded-[2.5rem] shadow-2xl shadow-brand/5">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
          {t('TankMix.result')}
        </span>
        <div className="text-6xl font-black text-brand mt-2 flex items-baseline gap-3">
          {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-2xl font-bold text-white/50">{unitLabels.result}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10">
          <ActionButton icon={<Copy size={20}/>} label={t('Common.copy')} />
          <ActionButton icon={<Share2 size={20}/>} label={t('Common.share')} />
          <ActionButton icon={<Download size={20}/>} label={t('Common.download')} />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center p-5 bg-background rounded-3xl border border-white/5 hover:border-brand/40 transition-all active:scale-95 group">
      <div className="mb-2 text-gray-400 group-hover:text-brand transition-colors">{icon}</div>
      <span className="text-[9px] uppercase font-black text-gray-600 group-hover:text-gray-300 tracking-wider">{label}</span>
    </button>
  );
}
