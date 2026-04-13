import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Await the locale since it's a Promise in Next.js 15
  let locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid 
  // by checking against our shared routing config
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
