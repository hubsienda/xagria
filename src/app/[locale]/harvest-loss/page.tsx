'use client';

import React, {useMemo, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {useAgri} from '@/context/AgriContext';
import RuggedInput from '@/components/RuggedInput';
import ActionButtons from '@/components/ActionButtons';
import {ArrowLeft} from 'lucide-react';
import {Link} from '@/i18n/routing';
import {estimateHarvestLoss, getHarvestLossFactor, round} from '@/lib/agriMath';

export default function HarvestLossPage() {
  const t = useTranslations();
  const locale = useLocale();
  const {units} = useAgri();
  const isMetric = units === 'metric';

  const [seeds, setSeeds] = useState<number | ''>('');

  const factor = getHarvestLossFactor(units);
  const lossResult = useMemo(() => round(estimateHarvestLoss(Number(seeds || 0), factor), 2), [seeds, factor]);

  const resultUnit = isMetric ? '%' : 'bu/ac';
  const sampleUnit = isMetric ? 'per 0.1 m²' : 'per ft²';

  const exportText = `${t('HarvestLoss.name')}\n${t('HarvestLoss.labelSeeds')}: ${seeds || 0} ${sampleUnit}\n${t('HarvestLoss.result')}: ${lossResult} ${resultUnit}`;

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link
        href="/"
        locale={locale}
        className="mb-8 inline-flex items-center text-gray-500 transition-colors hover:text-brand"
      >
        <ArrowLeft size={20} className="mr-2" />
        <span className="text-xs font-bold uppercase tracking-widest">{t('Common.back')}</span>
      </Link>

      <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter text-brand italic">
        {t('HarvestLoss.name')}
      </h1>
      <p className="mb-8 text-sm text-gray-500">{t('HarvestLoss.desc')}</p>

      <RuggedInput
        label={t('HarvestLoss.labelSeeds')}
        unit={sampleUnit}
        value={seeds}
        onChange={setSeeds}
      />

      <div className="mt-10 rounded-[2.5rem] border-2 border-brand/20 bg-surface p-8 shadow-panel">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {t('HarvestLoss.result')}
        </span>
        <div className="mt-2 flex items-baseline gap-3 text-6xl font-black text-brand">
          {lossResult.toFixed(2)}
          <span className="text-2xl font-bold text-white/50">{resultUnit}</span>
        </div>

        <p className="mt-4 text-xs text-gray-500">{t('HarvestLoss.note')}</p>

        <ActionButtons valueText={exportText} fileName="xagria-harvest-loss.txt" />
      </div>
    </div>
  );
}
