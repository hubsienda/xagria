'use client';

import React, {useMemo, useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {useLocale} from 'next-intl';
import {Link} from '@/i18n/routing';
import {useAgri} from '@/context/AgriContext';
import RuggedInput from '@/components/RuggedInput';
import ActionButtons from '@/components/ActionButtons';

type LocaleCode = 'en' | 'es' | 'it';

const copy = {
  en: {
    back: 'Back',
    title: 'Sprayer Calibration',
    desc: 'Calculate the application rate from nozzle flow, travel speed and nozzle spacing.',
    nozzleFlow: 'Nozzle flow',
    nozzleFlowMetricUnit: 'L/min',
    nozzleFlowUSUnit: 'GPM',
    speed: 'Travel speed',
    speedMetricUnit: 'km/h',
    speedUSUnit: 'mph',
    spacing: 'Nozzle spacing',
    spacingMetricUnit: 'cm',
    spacingUSUnit: 'in',
    result: 'Application rate',
    resultMetricUnit: 'L/ha',
    resultUSUnit: 'GPA'
  },
  es: {
    back: 'Atrás',
    title: 'Calibración de pulverizador',
    desc: 'Calcula la dosis de aplicación a partir del caudal de la boquilla, la velocidad y la separación entre boquillas.',
    nozzleFlow: 'Caudal de boquilla',
    nozzleFlowMetricUnit: 'L/min',
    nozzleFlowUSUnit: 'GPM',
    speed: 'Velocidad de avance',
    speedMetricUnit: 'km/h',
    speedUSUnit: 'mph',
    spacing: 'Separación entre boquillas',
    spacingMetricUnit: 'cm',
    spacingUSUnit: 'in',
    result: 'Dosis de aplicación',
    resultMetricUnit: 'L/ha',
    resultUSUnit: 'GPA'
  },
  it: {
    back: 'Indietro',
    title: 'Calibrazione irroratrice',
    desc: "Calcola il volume di distribuzione partendo dalla portata dell'ugello, dalla velocità e dalla distanza tra ugelli.",
    nozzleFlow: 'Portata ugello',
    nozzleFlowMetricUnit: 'L/min',
    nozzleFlowUSUnit: 'GPM',
    speed: 'Velocità di avanzamento',
    speedMetricUnit: 'km/h',
    speedUSUnit: 'mph',
    spacing: 'Distanza tra ugelli',
    spacingMetricUnit: 'cm',
    spacingUSUnit: 'in',
    result: 'Volume di distribuzione',
    resultMetricUnit: 'L/ha',
    resultUSUnit: 'GPA'
  }
} satisfies Record<LocaleCode, Record<string, string>>;

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export default function SprayerCalibrationPage() {
  const locale = (useLocale() as LocaleCode) || 'en';
  const t = copy[locale] || copy.en;
  const {units} = useAgri();
  const isMetric = units === 'metric';

  const [nozzleFlow, setNozzleFlow] = useState<number | ''>('');
  const [speed, setSpeed] = useState<number | ''>('');
  const [spacing, setSpacing] = useState<number | ''>('');

  const result = useMemo(() => {
    const nf = Number(nozzleFlow || 0);
    const sp = Number(speed || 0);
    const sc = Number(spacing || 0);

    if (nf <= 0 || sp <= 0 || sc <= 0) {
      return 0;
    }

    if (isMetric) {
      return round((600 * nf) / (sp * sc), 2);
    }

    return round((5940 * nf) / (sp * sc), 2);
  }, [nozzleFlow, speed, spacing, isMetric]);

  const flowUnit = isMetric ? t.nozzleFlowMetricUnit : t.nozzleFlowUSUnit;
  const speedUnit = isMetric ? t.speedMetricUnit : t.speedUSUnit;
  const spacingUnit = isMetric ? t.spacingMetricUnit : t.spacingUSUnit;
  const resultUnit = isMetric ? t.resultMetricUnit : t.resultUSUnit;

  const exportText =
    `${t.title}\n` +
    `${t.nozzleFlow}: ${nozzleFlow || 0} ${flowUnit}\n` +
    `${t.speed}: ${speed || 0} ${speedUnit}\n` +
    `${t.spacing}: ${spacing || 0} ${spacingUnit}\n` +
    `${t.result}: ${result} ${resultUnit}`;

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link
        href="/"
        locale={locale}
        className="mb-8 inline-flex items-center text-gray-500 transition-colors hover:text-brand"
      >
        <ArrowLeft size={20} className="mr-2" />
        <span className="text-xs font-bold uppercase tracking-widest">{t.back}</span>
      </Link>

      <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter text-brand italic">
        {t.title}
      </h1>
      <p className="mb-8 text-sm text-gray-500">{t.desc}</p>

      <div className="space-y-4">
        <RuggedInput
          label={t.nozzleFlow}
          unit={flowUnit}
          value={nozzleFlow}
          onChange={setNozzleFlow}
        />
        <RuggedInput label={t.speed} unit={speedUnit} value={speed} onChange={setSpeed} />
        <RuggedInput
          label={t.spacing}
          unit={spacingUnit}
          value={spacing}
          onChange={setSpacing}
        />
      </div>

      <div className="mt-10 rounded-[2.5rem] border-2 border-brand/20 bg-surface p-8 shadow-panel">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {t.result}
        </span>

        <div className="mt-2 flex items-baseline gap-3 text-6xl font-black text-brand">
          {result.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
          <span className="text-2xl font-bold text-white/50">{resultUnit}</span>
        </div>

        <ActionButtons valueText={exportText} fileName="xagria-sprayer-calibration.txt" />
      </div>
    </div>
  );
}
