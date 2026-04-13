'use client';

import React, {useMemo, useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {useLocale} from 'next-intl';
import {Link} from '@/i18n/routing';
import RuggedInput from '@/components/RuggedInput';
import ActionButtons from '@/components/ActionButtons';

type LocaleCode = 'en' | 'es' | 'it';

const copy = {
  en: {
    back: 'Back',
    title: 'Moisture Correction',
    desc: 'Correct a weight or yield from one moisture content to another.',
    value: 'Weight or yield',
    moistureActual: 'Actual moisture',
    moistureTarget: 'Target moisture',
    percentUnit: '%',
    result: 'Corrected value',
    difference: 'Difference',
    note: 'Use the same weight or yield unit throughout the calculation.'
  },
  es: {
    back: 'Atrás',
    title: 'Corrección por humedad',
    desc: 'Corrige un peso o rendimiento desde una humedad inicial a otra humedad objetivo.',
    value: 'Peso o rendimiento',
    moistureActual: 'Humedad actual',
    moistureTarget: 'Humedad objetivo',
    percentUnit: '%',
    result: 'Valor corregido',
    difference: 'Diferencia',
    note: 'Usa la misma unidad de peso o rendimiento durante todo el cálculo.'
  },
  it: {
    back: 'Indietro',
    title: 'Correzione umidità',
    desc: "Corregge un peso o una resa da un contenuto d'umidità iniziale a uno finale.",
    value: 'Peso o resa',
    moistureActual: 'Umidità attuale',
    moistureTarget: 'Umidità obiettivo',
    percentUnit: '%',
    result: 'Valore corretto',
    difference: 'Differenza',
    note: 'Usa la stessa unità di peso o resa per tutto il calcolo.'
  }
} satisfies Record<LocaleCode, Record<string, string>>;

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export default function MoistureCorrectionPage() {
  const locale = (useLocale() as LocaleCode) || 'en';
  const t = copy[locale] || copy.en;

  const [value, setValue] = useState<number | ''>('');
  const [actualMoisture, setActualMoisture] = useState<number | ''>('');
  const [targetMoisture, setTargetMoisture] = useState<number | ''>('');

  const result = useMemo(() => {
    const v = Number(value || 0);
    const actual = Number(actualMoisture || 0);
    const target = Number(targetMoisture || 0);

    if (v <= 0 || actual < 0 || target < 0 || actual >= 100 || target >= 100) {
      return {
        corrected: 0,
        difference: 0
      };
    }

    const corrected = (v * (100 - actual)) / (100 - target);
    return {
      corrected: round(corrected, 2),
      difference: round(corrected - v, 2)
    };
  }, [value, actualMoisture, targetMoisture]);

  const exportText =
    `${t.title}\n` +
    `${t.value}: ${value || 0}\n` +
    `${t.moistureActual}: ${actualMoisture || 0} ${t.percentUnit}\n` +
    `${t.moistureTarget}: ${targetMoisture || 0} ${t.percentUnit}\n` +
    `${t.result}: ${result.corrected}\n` +
    `${t.difference}: ${result.difference}`;

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
        <RuggedInput label={t.value} unit="" value={value} onChange={setValue} />
        <RuggedInput
          label={t.moistureActual}
          unit={t.percentUnit}
          value={actualMoisture}
          onChange={setActualMoisture}
        />
        <RuggedInput
          label={t.moistureTarget}
          unit={t.percentUnit}
          value={targetMoisture}
          onChange={setTargetMoisture}
        />
      </div>

      <div className="mt-10 rounded-[2.5rem] border-2 border-brand/20 bg-surface p-8 shadow-panel">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {t.result}
        </span>

        <div className="mt-2 flex items-baseline gap-3 text-6xl font-black text-brand">
          {result.corrected.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <p>
            {t.difference}: <span className="font-bold text-white">{result.difference}</span>
          </p>
          <p className="pt-2 text-xs text-gray-500">{t.note}</p>
        </div>

        <ActionButtons valueText={exportText} fileName="xagria-moisture-correction.txt" />
      </div>
    </div>
  );
}
