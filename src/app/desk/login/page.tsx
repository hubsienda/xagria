import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getConfig, CONFIG_ERROR} from '@/lib/desk/session';
import {hasDeskSession} from '@/lib/desk/auth';
export default async function LoginPage({searchParams}: {searchParams: Promise<{error?: string}>}) {
  const configured = !!getConfig();
  if (configured && await hasDeskSession()) redirect('/desk');
  const {error} = await searchParams;
  return <div className="mx-auto max-w-md rounded-2xl border border-white/15 bg-surface p-6 sm:p-8">
    <p className="text-sm font-bold uppercase tracking-widest text-brand">Owner access</p>
    <h1 className="mt-3 text-3xl font-bold">Private Desk</h1>
    <p className="my-5 text-muted">Enter your passphrase to open Sienda Ltd’s internal workspace. Sessions last eight hours.</p>
    {!configured ? <p role="alert">{CONFIG_ERROR}</p> : <form action="/desk/login/submit" method="post" className="space-y-5">
      {error && <p role="alert" className="text-red-300">Unable to sign in. Check your passphrase and try again.</p>}
      <div><label htmlFor="passphrase" className="mb-2 block font-bold">Passphrase</label>
        <input id="passphrase" name="passphrase" type="password" required maxLength={1024} autoComplete="current-password" className="w-full rounded-lg border border-white/25 bg-background p-3 focus:outline-brand" /></div>
      <button className="w-full rounded-lg bg-brand px-5 py-3 font-bold text-black">Open Private Desk</button>
    </form>}
    <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">Back to XAGRIA</Link>
  </div>;
}
