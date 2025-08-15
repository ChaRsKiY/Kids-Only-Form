import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  locales: ['en', 'de', 'ru', 'sk'],
 
  defaultLocale: 'de'
});