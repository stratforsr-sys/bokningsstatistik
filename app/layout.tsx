import { Poppins } from 'next/font/google';
import './globals.css';

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
    <html lang="sv" className={poppins.className}>
      <body>{children}</body>
    </html>
  );
}
