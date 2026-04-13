import './globals.css';

export const metadata = {
  title: 'XAGRIA',
  description: 'Precision without friction for the modern agricultural sector',
  applicationName: 'XAGRIA',
  icons: {
    icon: [
      {url: '/favicon.ico'},
      {url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png'},
      {url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png'}
    ],
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
