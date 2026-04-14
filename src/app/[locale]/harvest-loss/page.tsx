'use client';

import React, {useMemo, useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {useLocale} from 'next-intl';
import {Link} from '@/i18n/routing';
import {useAgri} from '@/context/AgriContext';
import RuggedInput from '@/components/RuggedInput';
import ActionButtons from '@/components/ActionButtons';

type LocaleCode = 'en' | 'es' | 'it';
type CropType = 'corn' | 'soybean' | 'wheat';

const copy = {
  en: {
    back: 'Back',
    title: 'Harvest Loss',
    desc: 'Estimate combine grain loss from crop-specific field counts.',
    crop: 'Crop',
    count: 'Seeds counted',
    sampleArea: 'Sample area',
    expectedYield: 'Expected yield',
    result: 'Estimated loss',
    resultUnit: 'bu/ac',
    resultPercent: 'Estimated loss',
    resultPercentUnit: '%',
    note: 'Quick field estimate. Check several sample spots and subtract pre-harvest loss where possible.',
    warning:
      'Input out of realistic range. Please check the seed count, crop and sample area.'
  },
  es: {
    back: 'Atrás',
    title: 'Pérdida de cosecha',
    desc: 'Estima la pérdida de grano de la cosechadora con recuentos específicos por cultivo.',
    crop: 'Cultivo',
    count: 'Semillas contadas',
    sampleArea: 'Área de muestra',
    expectedYield: 'Rendimiento esperado',
    result: 'Pérdida estimada',
    resultUnit: 'bu/ac',
    resultPercent: 'Pérdida estimada',
    resultPercentUnit: '%',
    note: 'Estimación rápida de campo. Comprueba varios puntos y resta la pérdida previa a la cosecha cuando sea posible.',
    warning:
      'Valor fuera de un rango realista. Revisa el recuento, el cultivo y el área de muestra.'
  },
  it: {
    back: 'Indietro',
    title: 'Perdita di raccolta',
    desc: 'Stima la perdita di granella della mietitrebbia con conteggi specifici per coltura.',
    crop: 'Coltura',
    count: 'Semi contati',
    sampleArea: 'Area campione',
    expectedYield: 'Resa attesa',
    result: 'Perdita stimata',
    resultUnit: 'bu/ac',
    resultPercent: 'Perdita stimata',
    resultPercentUnit: '%',
    note: 'Stima rapida di campo. Controlla più punti campione e sottrai, se possibile, le perdite pre-raccolta.',
    warning:
      'Valore fuori da un intervallo realistico. Controlla conteggio, coltura e area campione.'
  }
} satisfies Record<LocaleCode, Record<string, string>>;

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function m2ToFt2(value: number) {
  return value * 10.7639;
}

function getCropFactor(crop: CropType) {
  if (crop === 'corn') return 2;
  if (crop === 'soybean') return 4;
  return 20;
}

function getCropLabel(locale: LocaleCode, crop: CropType) {
  const labels = {
    en: {corn: 'Corn', soybean: 'Soybean', wheat: 'Wheat'},
    es: {corn: 'Maíz', soybean: 'Soja', wheat: 'Trigo'},
    it: {corn: 'Mais', soybean: 'Soia', wheat: 'Grano'}
  };

  return labels[locale][crop];
}

export default function HarvestLossPage() {
  const locale = (useLocale() as LocaleCode) || 'en';
  const t = copy[locale] || copy.en;
  const {units} = useAgri();
  const isMetric = units === 'metric';

  const [crop, setCrop] = useState<CropType>('wheat');
  const [count, setCount] = useState<number | ''>('');
  const [sampleArea, setSampleArea] = useState<number | ''>('');
  const [expectedYield, setExpectedYield] = useState<number | ''>('');

  const result = useMemo(() => {
    const seeds = Number(count || 0);
    const area = Number(sampleArea || 0);
    const expected = Number(expectedYield || 0);

    if (seeds <= 0 || area <= 0) {
      return {
        lossBuAc: 0,
        lossPercent: 0,
        invalid: false
      };
    }

    const areaFt2 = isMetric ? m2ToFt2(area) : area;
    const seedsPerFt2 = seeds / areaFt2;
    const factor = getCropFactor(crop);
    const lossBuAc = seedsPerFt2 / factor;

    const unrealistic =
      seedsPerFt2 > 500 || lossBuAc > 150 || areaFt2 <= 0 || !Number.isFinite(lossBuAc);

    const lossPercent =
      expected > 0 && lossBuAc > 0 ? (lossBuAc / expected) * 100 : 0;

    return {
      lossBuAc: unrealistic ? 0 : round(lossBuAc, 2),
      lossPercent: unrealistic ? 0 : round(lossPercent, 2),
      invalid: unrealistic
    };
  }, [count, sampleArea, expectedYield, crop, isMetric]);

  const sampleAreaUnit = isMetric ? 'm²' : 'ft²';

  const exportText =
    `${t.title}\n` +
    `${t.crop}: ${getCropLabel(locale, crop)}\n` +
    `${t.count}: ${count || 0}\n` +
    `${t.sampleArea}: ${sampleArea || 0} ${sampleAreaUnit}\n` +
    `${t.expectedYield}: ${expectedYield || 0} bu/ac\n` +
    `${t.result}: ${result.lossBuAc} ${t.resultUnit}\n` +
    `${t.resultPercent}: ${result.lossPercent} ${t.resultPercentUnit}`;

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link
        href="/"
        locale={locale}
        className="mb-8 inline-flex items-center text-gray-300 transition-colors hover:text-brand"
      >
        <ArrowLeft size={20} className="mr-2" />
        <span className="text-xs font-bold uppercase tracking-widest">{t.back}</span>
      </Link>

      <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-brand italic sm:text-4xl">
        {t.title}
      </h1>

      <p className="mb-8 text-sm text-gray-300">{t.desc}</p>

      <div className="mb-5 px-1">
        <div className="mb-2 flex items-end justify-between gap-3">
          <label className="text-[11px] font-bold uppercase tracking-widest leading-none text-gray-300">
            {t.crop}
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['corn', 'soybean', 'wheat'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCrop(item)}
              className={`rounded-[1.25rem] border p-4 text-sm font-black transition-all ${
                crop === item
                  ? 'border-brand bg-brand text-black'
                  : 'border-white/5 bg-surface text-white'
              }`}
            >
              {getCropLabel(locale, item)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <RuggedInput
          label={t.count}
          unit=""
          value={count}
          onChange={setCount}
        />

        <RuggedInput
          label={t.sampleArea}
          unit={sampleAreaUnit}
          value={sampleArea}
          onChange={setSampleArea}
        />

        <RuggedInput
          label={t.expectedYield}
          unit="bu/ac"
          value={expectedYield}
          onChange={setExpectedYield}
        />
      </div>

      <div className="mt-10 rounded-[2.5rem] border-2 border-brand/20 bg-surface p-8 shadow-panel">
        {result.invalid ? (
          <div className="text-sm font-bold text-brand">{t.warning}</div>
        ) : (
          <>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
              {t.result}
            </span>

            <div className="mt-2 flex items-baseline gap-3 text-6xl font-black text-brand">
              {result.lossBuAc.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
              <span className="text-2xl font-bold text-white/50">{t.resultUnit}</span>
            </div>

            {Number(expectedYield || 0) > 0 ? (
              <div className="mt-4 text-sm text-gray-300">
                {t.resultPercent}:{' '}
                <span className="font-bold text-white">{result.lossPercent}</span>{' '}
                {t.resultPercentUnit}
              </div>
            ) : null}

            <p className="pt-4 text-xs text-gray-300">{t.note}</p>

            <ActionButtons valueText={exportText} fileName="xagria-harvest-loss.txt" />
          </>
        )}
      </div>
    </div>
  );
}
