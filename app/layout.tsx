import { Poppins } from 'next/font/google';
import './globals.css';
import './nprogress.css';
import NavigationProgress from '@/components/layout/navigation-progress';
import { Suspense } from 'react';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Telink Mötesstatistik',
  description: 'Bokningsstatistik och möteshantering för Telink',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={poppins.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
