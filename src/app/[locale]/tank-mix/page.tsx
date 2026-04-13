'use client';
  const isMetric = units === 'metric';

  const result = useMemo(() => {
    return round(
      calculateTankMixProductAmount(Number(tankSize || 0), Number(appRate || 0), Number(dose || 0)),
      2
    );
  }, [tankSize, appRate, dose]);

  const unitLabels = {
    tank: isMetric ? 'L' : 'GAL',
    rate: isMetric ? 'L/HA' : 'GPA',
    dose: isMetric ? 'L/HA' : 'QT/AC',
    result: isMetric ? 'L' : 'QT'
  };

  const exportText = `${t('TankMix.name')}\n${t('TankMix.labelTank')}: ${tankSize || 0} ${unitLabels.tank}\n${t('TankMix.labelRate')}: ${appRate || 0} ${unitLabels.rate}\n${t('TankMix.labelConcentration')}: ${dose || 0} ${unitLabels.dose}\n${t('TankMix.result')}: ${result} ${unitLabels.result}`;

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
        {t('TankMix.name')}
      </h1>
      <p className="mb-8 text-sm text-gray-500">{t('TankMix.desc')}</p>

      <div className="space-y-4">
        <RuggedInput
          label={t('TankMix.labelTank')}
          unit={unitLabels.tank}
          value={tankSize}
          onChange={setTankSize}
        />
        <RuggedInput
          label={t('TankMix.labelRate')}
          unit={unitLabels.rate}
          value={appRate}
          onChange={setAppRate}
        />
        <RuggedInput
          label={t('TankMix.labelConcentration')}
          unit={unitLabels.dose}
          value={dose}
          onChange={setDose}
        />
      </div>

      <div className="mt-10 rounded-[2.5rem] border-2 border-brand/20 bg-surface p-8 shadow-panel">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {t('TankMix.result')}
        </span>
        <div className="mt-2 flex items-baseline gap-3 text-6xl font-black text-brand">
          {result.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
          <span className="text-2xl font-bold text-white/50">{unitLabels.result}</span>
        </div>

        <ActionButtons valueText={exportText} fileName="xagria-tank-mix.txt" />
      </div>
    </div>
  );
}
