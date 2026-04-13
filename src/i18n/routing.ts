import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'es', 'it'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Only show the locale in the URL when it's not the default
  localePrefix: 'as-needed'
});

// Lightweight wrappers around Next.js navigation APIs
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
