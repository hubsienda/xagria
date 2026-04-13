import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es', 'it'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Optional: removes the prefix for the default locale (xagria.com instead of xagria.com/en)
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|es|it)/:path*']
};
