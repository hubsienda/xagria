import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FiDroplet, FiTarget, FiChevronRight } from 'react-icons/fi';

export default function HomePage() {
  const t = useTranslations('Index');
  const tools = useTranslations('TankMix');

  return (
    <div className="p-6">
      <h1 className="text-4xl font-black text-brand mb-2">{t('title')}</h1>
      <p className="text-gray-400 mb-8">{t('subtitle')}</p>

      <div className="grid gap-4">
        <ToolCard 
          href="/tank-mix" 
          title={tools('name')} 
          desc={tools('desc')} 
          icon={<FiDroplet />} 
        />
        {/* Add more cards as you create pages */}
      </div>
    </div>
  );
}

function ToolCard({ href, title, desc, icon }: any) {
  return (
    <Link href={href} className="flex items-center p-5 bg-surface rounded-3xl border border-transparent hover:border-brand transition-all group">
      <div className="text-3xl mr-4 text-brand">{icon}</div>
      <div className="flex-1">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-gray-400 text-sm">{desc}</p>
      </div>
      <FiChevronRight className="text-gray-600 group-hover:text-brand" />
    </Link>
  );
}
