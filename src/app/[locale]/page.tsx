import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Droplets, Gauge, ChevronRight } from 'lucide-react';

export default async function IndexPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // CRITICAL: Next.js 15 requires awaiting params
  const { locale } = await params;
  const t = await getTranslations('Index');
  const tank = await getTranslations('TankMix');
  const harvest = await getTranslations('HarvestLoss');

  const tools = [
    {
      id: 'tank-mix',
      title: tank('name'),
      desc: tank('desc'),
      icon: <Droplets className="text-[#ADFF2F]" size={28} />,
      href: `/${locale}/tank-mix`
    },
    {
      id: 'harvest-loss',
      title: harvest('name'),
      desc: harvest('desc'),
      icon: <Gauge className="text-[#ADFF2F]" size={28} />,
      href: `/${locale}/harvest-loss`
    }
  ];

  return (
    <div className="p-6 pt-12">
      <div className="mb-10">
        <h1 className="text-5xl font-black tracking-tighter text-[#ADFF2F] italic">XAGRIA</h1>
        <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px] mt-1">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4">
        {tools.map((tool) => (
          <Link 
            key={tool.id}
            href={tool.href}
            className="flex items-center p-6 bg-[#171717] rounded-[2rem] border border-white/5 hover:border-[#ADFF2F]/40 transition-all active:scale-[0.98] group"
          >
            <div className="mr-5 p-3 bg-black rounded-2xl">
              {tool.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg leading-tight">{tool.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{tool.desc}</p>
            </div>
            <ChevronRight className="text-gray-700 group-hover:text-[#ADFF2F] group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      <div className="mt-8 p-6 rounded-[2rem] border border-dashed border-white/10 flex items-center justify-center">
        <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
          More Tools Coming Soon
        </span>
      </div>
    </div>
  );
}
