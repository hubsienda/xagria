import {requireDeskSession} from '@/lib/desk/auth';
export default async function PrivateLayout({children}: {children: React.ReactNode}) {
  await requireDeskSession();
  return children;
}
