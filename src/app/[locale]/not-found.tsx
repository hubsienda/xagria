import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';

export default function NotFoundPage() {
  const t = useTranslations('NotFoundPage');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-black italic text-brand">404</h1>
      <p className="mt-3 text-lg font-bold text-white">{t('title')}</p>
      <p className="mt-2 max-w-md text-sm text-gray-500">{t('body')}</p>
      <Link href="/" className="mt-6 rounded-full bg-brand px-5 py-3 text-sm font-black text-black">
        {t('cta')}
      </Link>
    </div>
  );
}
