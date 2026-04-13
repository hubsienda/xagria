import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Sprout, Droplets, Gauge, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('Index');
  const common = useTranslations('Common');
  const tank = useTranslations('TankMix');
  const harvest = useTranslations('HarvestLoss');

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
    <div className="p-6 pt-12">
      <div className="mb-10">
        <h1 className="text-5xl font-black tracking-tighter text-brand italic">XAGRIA</h1>
        <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px] mt-1">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4">
        {tools.map((tool) => (
          <Link 
            key={tool.id}
            href={tool.href}
            className="flex items-center p-6 bg-surface rounded-[2rem] border border-white/5 hover:border-brand/40 transition-all active:scale-[0.98] group"
          >
            <div className="mr-5 p-3 bg-background rounded-2xl">
              {tool.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg leading-tight">{tool.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{tool.desc}</p>
            </div>
            <ChevronRight className="text-gray-700 group-hover:text-brand group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Placeholder for future tools */}
      <div className="mt-8 p-6 rounded-[2rem] border border-dashed border-white/10 flex items-center justify-center">
        <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">More Tools Coming Soon</span>
      </div>
    </div>
  );
}
