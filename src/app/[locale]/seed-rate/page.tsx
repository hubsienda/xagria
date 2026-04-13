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
    title: 'Seed Rate',
    desc: 'Calculate the seed rate needed to reach the target plant population.',
    targetPlants: 'Target plants',
    targetPlantsMetricUnit: 'plants/m²',
    targetPlantsUSUnit: 'plants/ft²',
    tgw: 'Thousand grain weight',
    tgwUnit: 'g',
    germination: 'Germination',
    germinationUnit: '%',
    establishment: 'Field establishment',
    establishmentUnit: '%',
    area: 'Field area',
    areaMetricUnit: 'ha',
    areaUSUnit: 'ac',
    result: 'Seed rate',
    resultMetricUnit: 'kg/ha',
    resultUSUnit: 'lb/ac',
    seedsNeeded: 'Seeds needed',
    totalSeed: 'Total seed required',
    totalMetricUnit: 'kg',
    totalUSUnit: 'lb',
    note: 'Field establishment is the expected percentage of plants that will successfully establish after sowing.'
  },
  es: {
    back: 'Atrás',
    title: 'Dosis de siembra',
    desc: 'Calcula la dosis de semilla necesaria para alcanzar la población objetivo de plantas.',
    targetPlants: 'Plantas objetivo',
    targetPlantsMetricUnit: 'plantas/m²',
    targetPlantsUSUnit: 'plantas/ft²',
    tgw: 'Peso de mil granos',
    tgwUnit: 'g',
    germination: 'Germinación',
    germinationUnit: '%',
    establishment: 'Implantación en campo',
    establishmentUnit: '%',
    area: 'Superficie del campo',
    areaMetricUnit: 'ha',
    areaUSUnit: 'ac',
    result: 'Dosis de semilla',
    resultMetricUnit: 'kg/ha',
    resultUSUnit: 'lb/ac',
    seedsNeeded: 'Semillas necesarias',
    totalSeed: 'Semilla total necesaria',
    totalMetricUnit: 'kg',
    totalUSUnit: 'lb',
    note: 'La implantación en campo es el porcentaje esperado de plantas que se establecerán correctamente tras la siembra.'
  },
  it: {
    back: 'Indietro',
    title: 'Dose di semina',
    desc: 'Calcola la dose di seme necessaria per raggiungere la densità obiettivo di piante.',
    targetPlants: 'Piante obiettivo',
    targetPlantsMetricUnit: 'piante/m²',
    targetPlantsUSUnit: 'piante/ft²',
    tgw: 'Peso di mille semi',
    tgwUnit: 'g',
    germination: 'Germinazione',
    germinationUnit: '%',
    establishment: 'Affrancamento in campo',
    establishmentUnit: '%',
    area: 'Superficie campo',
    areaMetricUnit: 'ha',
    areaUSUnit: 'ac',
    result: 'Dose di seme',
    resultMetricUnit: 'kg/ha',
    resultUSUnit: 'lb/ac',
    seedsNeeded: 'Semi necessari',
    totalSeed: 'Seme totale necessario',
    totalMetricUnit: 'kg',
    totalUSUnit: 'lb',
    note: "L'affrancamento in campo è la percentuale prevista di piante che si stabiliranno correttamente dopo la semina."
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

function haToAc(value: number) {
  return value * 2.47105;
}

function acToHa(value: number) {
  return value / 2.47105;
}

export default function SeedRatePage() {
  const locale = (useLocale() as LocaleCode) || 'en';
  const t = copy[locale] || copy.en;
  const {units} = useAgri();
  const isMetric = units === 'metric';

  const [targetPlants, setTargetPlants] = useState<number | ''>('');
  const [thousandGrainWeight, setThousandGrainWeight] = useState<number | ''>('');
  const [germination, setGermination] = useState<number | ''>('');
  const [establishment, setEstablishment] = useState<number | ''>('');
  const [area, setArea] = useState<number | ''>('');

  const result = useMemo(() => {
    const tp = Number(targetPlants || 0);
    const tgw = Number(thousandGrainWeight || 0);
    const g = Number(germination || 0);
    const e = Number(establishment || 0);

    if (tp <= 0 || tgw <= 0 || g <= 0 || e <= 0) {
      return {
        seedRateMetric: 0,
        seedRateUS: 0,
        seedsNeeded: 0,
        totalSeedMetric: 0,
        totalSeedUS: 0
      };
    }

    const targetPlantsPerM2 = isMetric ? tp : tp * 10.7639;
    const areaHa = isMetric ? Number(area || 0) : acToHa(Number(area || 0));
    const effectiveEstablishment = (g / 100) * (e / 100);

    if (effectiveEstablishment <= 0) {
      return {
        seedRateMetric: 0,
        seedRateUS: 0,
        seedsNeeded: 0,
        totalSeedMetric: 0,
        totalSeedUS: 0
      };
    }

    const seedsNeededPerM2 = targetPlantsPerM2 / effectiveEstablishment;
    const seedRateMetric = (seedsNeededPerM2 * tgw) / 100;
    const seedRateUS = kgHaToLbAc(seedRateMetric);
    const totalSeedMetric = areaHa > 0 ? seedRateMetric * areaHa : 0;
    const totalSeedUS = kgHaToLbAc(totalSeedMetric);

    return {
      seedRateMetric: round(seedRateMetric, 2),
      seedRateUS: round(seedRateUS, 2),
      seedsNeeded: round(isMetric ? seedsNeededPerM2 : seedsNeededPerM2 / 10.7639, 2),
      totalSeedMetric: round(totalSeedMetric, 2),
      totalSeedUS: round(totalSeedUS, 2)
    };
  }, [targetPlants, thousandGrainWeight, germination, establishment, area, isMetric]);

  const mainValue = isMetric ? result.seedRateMetric : result.seedRateUS;
  const mainUnit = isMetric ? t.resultMetricUnit : t.resultUSUnit;
  const targetPlantsUnit = isMetric ? t.targetPlantsMetricUnit : t.targetPlantsUSUnit;
  const areaUnit = isMetric ? t.areaMetricUnit : t.areaUSUnit;
  const totalUnit = isMetric ? t.totalMetricUnit : t.totalUSUnit;

  const exportText =
    `${t.title}\n` +
    `${t.targetPlants}: ${targetPlants || 0} ${targetPlantsUnit}\n` +
    `${t.tgw}: ${thousandGrainWeight || 0} ${t.tgwUnit}\n` +
    `${t.germination}: ${germination || 0} ${t.germinationUnit}\n` +
    `${t.establishment}: ${establishment || 0} ${t.establishmentUnit}\n` +
    `${t.area}: ${area || 0} ${areaUnit}\n` +
    `${t.result}: ${mainValue} ${mainUnit}\n` +
    `${t.seedsNeeded}: ${result.seedsNeeded} ${targetPlantsUnit}\n` +
    `${t.totalSeed}: ${isMetric ? result.totalSeedMetric : result.totalSeedUS} ${totalUnit}`;

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
          label={t.targetPlants}
          unit={targetPlantsUnit}
          value={targetPlants}
          onChange={setTargetPlants}
        />
        <RuggedInput
          label={t.tgw}
          unit={t.tgwUnit}
          value={thousandGrainWeight}
          onChange={setThousandGrainWeight}
        />
        <RuggedInput
          label={t.germination}
          unit={t.germinationUnit}
          value={germination}
          onChange={setGermination}
        />
        <RuggedInput
          label={t.establishment}
          unit={t.establishmentUnit}
          value={establishment}
          onChange={setEstablishment}
        />
        <RuggedInput
          label={t.area}
          unit={areaUnit}
          value={area}
          onChange={setArea}
        />
      </div>

      <div className="mt-10 rounded-[2.5rem] border-2 border-brand/20 bg-surface p-8 shadow-panel">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {t.result}
        </span>

        <div className="mt-2 flex items-baseline gap-3 text-6xl font-black text-brand">
          {mainValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
          <span className="text-2xl font-bold text-white/50">{mainUnit}</span>
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <p>
            {t.seedsNeeded}: <span className="font-bold text-white">{result.seedsNeeded}</span>{' '}
            {targetPlantsUnit}
          </p>
          <p>
            {t.totalSeed}:{' '}
            <span className="font-bold text-white">
              {isMetric ? result.totalSeedMetric : result.totalSeedUS}
            </span>{' '}
            {totalUnit}
          </p>
          <p className="pt-2 text-xs text-gray-500">{t.note}</p>
        </div>

        <ActionButtons valueText={exportText} fileName="xagria-seed-rate.txt" />
      </div>
    </div>
  );
}
