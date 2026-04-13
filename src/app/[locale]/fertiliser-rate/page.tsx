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
    title: 'Fertiliser Rate',
    desc: 'Calculate how much fertiliser product is needed to deliver the target nutrient rate.',
    nutrient: 'Nutrient',
    targetRate: 'Target nutrient rate',
    targetMetricUnit: 'kg/ha',
    targetUSUnit: 'lb/ac',
    productPercent: 'Product analysis',
    productPercentUnit: '%',
    area: 'Field area',
    areaMetricUnit: 'ha',
    areaUSUnit: 'ac',
    result: 'Product required',
    resultMetricUnit: 'kg/ha',
    resultUSUnit: 'lb/ac',
    total: 'Total product required',
    totalMetricUnit: 'kg',
    totalUSUnit: 'lb'
  },
  es: {
    back: 'Atrás',
    title: 'Dosis de fertilizante',
    desc: 'Calcula cuánto producto fertilizante se necesita para aportar la dosis objetivo de nutriente.',
    nutrient: 'Nutriente',
    targetRate: 'Dosis objetivo de nutriente',
    targetMetricUnit: 'kg/ha',
    targetUSUnit: 'lb/ac',
    productPercent: 'Riqueza del producto',
    productPercentUnit: '%',
    area: 'Superficie del campo',
    areaMetricUnit: 'ha',
    areaUSUnit: 'ac',
    result: 'Producto necesario',
    resultMetricUnit: 'kg/ha',
    resultUSUnit: 'lb/ac',
    total: 'Producto total necesario',
    totalMetricUnit: 'kg',
    totalUSUnit: 'lb'
  },
  it: {
    back: 'Indietro',
    title: 'Dose fertilizzante',
    desc: 'Calcola quanto prodotto fertilizzante serve per fornire la dose obiettivo di elemento nutritivo.',
    nutrient: 'Elemento nutritivo',
    targetRate: 'Dose obiettivo di nutriente',
    targetMetricUnit: 'kg/ha',
    targetUSUnit: 'lb/ac',
    productPercent: 'Titolo del prodotto',
    productPercentUnit: '%',
    area: 'Superficie campo',
    areaMetricUnit: 'ha',
    areaUSUnit: 'ac',
    result: 'Prodotto necessario',
    resultMetricUnit: 'kg/ha',
    resultUSUnit: 'lb/ac',
    total: 'Prodotto totale necessario',
    totalMetricUnit: 'kg',
    totalUSUnit: 'lb'
  }
} satisfies Record<LocaleCode, Record<string, string>>;

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function kgHaToLbAc(value: number) {
  return value * 0.892179;
}

function lbAcToKgHa(value: number) {
  return value / 0.892179;
}

function acToHa(value: number) {
  return value / 2.47105;
}

export default function FertiliserRatePage() {
  const locale = (useLocale() as LocaleCode) || 'en';
  const t = copy[locale] || copy.en;
  const {units} = useAgri();
  const isMetric = units === 'metric';

  const [nutrient, setNutrient] = useState<'N' | 'P₂O₅' | 'K₂O'>('N');
  const [targetRate, setTargetRate] = useState<number | ''>('');
  const [productPercent, setProductPercent] = useState<number | ''>('');
  const [area, setArea] = useState<number | ''>('');

  const result = useMemo(() => {
    const tr = isMetric ? Number(targetRate || 0) : lbAcToKgHa(Number(targetRate || 0));
    const pp = Number(productPercent || 0);
    const areaHa = isMetric ? Number(area || 0) : acToHa(Number(area || 0));

    if (tr <= 0 || pp <= 0) {
      return {
        productMetric: 0,
        productUS: 0,
        totalMetric: 0,
        totalUS: 0
      };
    }

    const productMetric = tr / (pp / 100);
    const productUS = kgHaToLbAc(productMetric);
    const totalMetric = areaHa > 0 ? productMetric * areaHa : 0;
    const totalUS = kgHaToLbAc(totalMetric);

    return {
      productMetric: round(productMetric, 2),
      productUS: round(productUS, 2),
      totalMetric: round(totalMetric, 2),
      totalUS: round(totalUS, 2)
    };
  }, [targetRate, productPercent, area, isMetric]);

  const rateUnit = isMetric ? t.targetMetricUnit : t.targetUSUnit;
  const areaUnit = isMetric ? t.areaMetricUnit : t.areaUSUnit;
  const resultUnit = isMetric ? t.resultMetricUnit : t.resultUSUnit;
  const totalUnit = isMetric ? t.totalMetricUnit : t.totalUSUnit;

  const exportText =
    `${t.title}\n` +
    `${t.nutrient}: ${nutrient}\n` +
    `${t.targetRate}: ${targetRate || 0} ${rateUnit}\n` +
    `${t.productPercent}: ${productPercent || 0} ${t.productPercentUnit}\n` +
    `${t.area}: ${area || 0} ${areaUnit}\n` +
    `${t.result}: ${isMetric ? result.productMetric : result.productUS} ${resultUnit}\n` +
    `${t.total}: ${isMetric ? result.totalMetric : result.totalUS} ${totalUnit}`;

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

      <div className="mb-5 px-1">
        <div className="mb-2 flex items-end justify-between gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest leading-none text-gray-500">
            {t.nutrient}
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['N', 'P₂O₅', 'K₂O'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setNutrient(item)}
              className={`rounded-[1.25rem] border p-4 text-sm font-black transition-all ${
                nutrient === item
                  ? 'border-brand bg-brand text-black'
                  : 'border-white/5 bg-surface text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <RuggedInput
          label={t.targetRate}
          unit={rateUnit}
          value={targetRate}
          onChange={setTargetRate}
        />
        <RuggedInput
          label={t.productPercent}
          unit={t.productPercentUnit}
          value={productPercent}
          onChange={setProductPercent}
        />
        <RuggedInput label={t.area} unit={areaUnit} value={area} onChange={setArea} />
      </div>

      <div className="mt-10 rounded-[2.5rem] border-2 border-brand/20 bg-surface p-8 shadow-panel">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {t.result}
        </span>

        <div className="mt-2 flex items-baseline gap-3 text-6xl font-black text-brand">
          {(isMetric ? result.productMetric : result.productUS).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
          <span className="text-2xl font-bold text-white/50">{resultUnit}</span>
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <p>
            {t.total}:{' '}
            <span className="font-bold text-white">
              {isMetric ? result.totalMetric : result.totalUS}
            </span>{' '}
            {totalUnit}
          </p>
        </div>

        <ActionButtons valueText={exportText} fileName="xagria-fertiliser-rate.txt" />
      </div>
    </div>
  );
}
