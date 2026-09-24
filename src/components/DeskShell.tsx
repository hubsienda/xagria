import Link from 'next/link';

export default function DeskShell({children}: {children: React.ReactNode}) {
  return <div lang="en" className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
    <header className="flex flex-wrap items-center justify-between gap-4 py-6">
      <Link href="/" aria-label="XAGRIA gateway"><img src="/xagria-white-logo.png" alt="XAGRIA" className="h-12 w-auto" /></Link>
      <span className="text-sm text-muted">International Agrifood Brokerage</span>
    </header>
    <main className="flex-1 py-10">{children}</main>
    <footer className="border-t border-white/10 py-6 text-sm text-muted">XAGRIA · International Agri Brokerage · with ❤️ by{' '}<a href="https://sienda.co.uk/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Sienda Ltd</a></footer>
  </div>;
}
