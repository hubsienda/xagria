import { useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { redirect } from 'next/navigation';

export default async function IndexPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    redirect('/en');
  }

  // If you are using 'useTranslations' in a Server Component:
  // Note: For the dashboard, we usually make this a client component 
  // or use the 'getTranslations' async function.
  
  return (
    <div className="p-6 pt-12 text-center">
      <h1 className="text-5xl font-black tracking-tighter text-brand italic">XAGRIA</h1>
      <p className="text-gray-400 mt-4 uppercase tracking-widest text-xs">Select a tool to begin</p>
      {/* Tool links here */}
    </div>
  );
}
