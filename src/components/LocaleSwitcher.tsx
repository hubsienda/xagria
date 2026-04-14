'use client';

import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/routing';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Common');

  const changeLocale = (nextLocale: 'en' | 'es' | 'it') => {
    router.replace(pathname, {locale: nextLocale});
  };

  return (
    <div className="flex items-center gap-1 overflow-hidden rounded-full border border-white/10 bg-surface p-1">
      {(['en', 'es', 'it'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => changeLocale(code)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase transition-all sm:px-3 ${
            locale === code ? 'bg-brand text-black' : 'text-gray-300 hover:text-white'
          }`}
          aria-label={`${t('language')} ${code.toUpperCase()}`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
