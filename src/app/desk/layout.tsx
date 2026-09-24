import DeskShell from '@/components/DeskShell';
export const dynamic = 'force-dynamic';
export const metadata = {title: 'Private Desk · XAGRIA', robots: {index: false, follow: false}};
export default function DeskLayout({children}: {children: React.ReactNode}) {
  return <DeskShell>{children}</DeskShell>;
}
