import {getTranslations, setRequestLocale} from 'next-intl/server';
import {
  Droplets,
  Gauge,
  ChevronRight,
  Sprout,
  FlaskConical,
  Wheat,
  SlidersHorizontal
} from 'lucide-react';
import {Link} from '@/i18n/routing';

export default async function IndexPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Index');

  const tools = [
    {
      id: 'tank-mix',
      title:
        locale === 'es'
          ? 'Mezcla de tanque'
          : locale === 'it'
            ? 'Miscela serbatoio'
            : 'Tank Mix',
      desc:
        locale === 'es'
          ? 'Calcula la cantidad exacta de producto necesaria para un tanque completo.'
          : locale === 'it'
            ? 'Calcola la quantità esatta di prodotto necessaria per un pieno completo.'
            : 'Calculate the exact product amount needed for one full tank.',
      icon: <Droplets className="text-brand" size={28} />,
      href: '/tank-mix'
    },
    {
      id: 'harvest-loss',
      title:
        locale === 'es'
          ? 'Pérdida de cosecha'
          : locale === 'it'
            ? 'Perdita di raccolta'
            : 'Harvest Loss',
      desc:
        locale === 'es'
          ? 'Estima la pérdida de grano en el campo detrás de la cosechadora.'
          : locale === 'it'
            ? 'Stima la perdita di granella dietro la mietitrebbia.'
            : 'Estimate grain loss behind the combine in the field.',
      icon: <Gauge className="text-brand" size={28} />,
      href: '/harvest-loss'
    },
    {
      id: 'seed-rate',
      title:
        locale === 'es'
          ? 'Dosis de siembra'
          : locale === 'it'
            ? 'Dose di semina'
            : 'Seed Rate',
      desc:
        locale === 'es'
          ? 'Calcula la dosis de semilla para alcanzar la población objetivo.'
          : locale === 'it'
            ? 'Calcola la dose di seme per raggiungere la densità obiettivo.'
            : 'Calculate seed rate to reach the target plant population.',
      icon: <Sprout className="text-brand" size={28} />,
      href: '/seed-rate'
    },
    {
      id: 'fertiliser-rate',
      title:
        locale === 'es'
          ? 'Dosis de fertilizante'
          : locale === 'it'
            ? 'Dose fertilizzante'
            : 'Fertiliser Rate',
      desc:
        locale === 'es'
          ? 'Calcula cuánto producto se necesita para aportar la dosis objetivo.'
          : locale === 'it'
            ? 'Calcola quanto prodotto serve per fornire la dose obiettivo.'
            : 'Calculate how much product is needed to deliver the target nutrient rate.',
      icon: <FlaskConical className="text-brand" size={28} />,
      href: '/fertiliser-rate'
    },
    {
      id: 'moisture-correction',
      title:
        locale === 'es'
          ? 'Corrección por humedad'
          : locale === 'it'
            ? 'Correzione umidità'
            : 'Moisture Correction',
      desc:
        locale === 'es'
          ? 'Corrige un peso o rendimiento entre dos niveles de humedad.'
          : locale === 'it'
            ? "Corregge peso o resa tra due livelli d'umidità."
            : 'Correct a weight or yield between two moisture levels.',
      icon: <Wheat className="text-brand" size={28} />,
      href: '/moisture-correction'
    },
    {
      id: 'sprayer-calibration',
      title:
        locale === 'es'
          ? 'Calibración de pulverizador'
          : locale === 'it'
            ? 'Calibrazione irroratrice'
            : 'Sprayer Calibration',
      desc:
        locale === 'es'
          ? 'Calcula la dosis de aplicación según caudal, velocidad y separación.'
          : locale === 'it'
            ? 'Calcola il volume di distribuzione da portata, velocità e distanza.'
            : 'Calculate application rate from nozzle flow, speed and spacing.',
      icon: <SlidersHorizontal className="text-brand" size={28} />,
      href: '/sprayer-calibration'
    }
  ];

  return (
    <div className="px-2 pt-4 pb-6 sm:px-4 sm:pt-6">
      <div className="mb-8 sm:mb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-gray-400 sm:text-xs">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            locale={locale}
            className="group flex items-center rounded-[1.75rem] border border-white/5 bg-surface p-5 transition-all hover:border-brand/40 active:scale-[0.98] sm:rounded-[2rem] sm:p-6"
          >
            <div className="mr-4 rounded-2xl bg-black p-3 sm:mr-5">
              {tool.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold leading-tight text-white sm:text-lg">
                {tool.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{tool.desc}</p>
            </div>

            <ChevronRight className="ml-3 shrink-0 text-gray-700 transition-all group-hover:translate-x-1 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  );
}
