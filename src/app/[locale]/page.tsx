import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Droplets, Gauge, ChevronRight} from 'lucide-react';
import {Link} from '@/i18n/routing';

export default async function IndexPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Index');
  const tank = await getTranslations('TankMix');
  const harvest = await getTranslations('HarvestLoss');

  const tools = [
    {
      id: 'tank-mix',
      title: tank('name'),
      desc: tank('desc'),
      icon: <Droplets className="text-brand" size={28} />,
      href: '/tank-mix'
    },
    {
      id: 'harvest-loss',
      title: harvest('name'),
      desc: harvest('desc'),
      icon: <Gauge className="text-brand" size={28} />,
      href: '/harvest-loss'
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
              <p className="mt-1 text-sm text-gray-500">
                {tool.desc}
              </p>
            </div>

            <ChevronRight className="ml-3 shrink-0 text-gray-700 transition-all group-hover:translate-x-1 group-hover:text-brand" />
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 p-6 sm:rounded-[2rem]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
          {t('comingSoon')}
        </span>
      </div>
    </div>
  );
}
