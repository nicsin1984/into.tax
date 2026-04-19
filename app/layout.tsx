import type { Metadata, Viewport } from 'next'
import { Source_Serif_4, IBM_Plex_Mono, Instrument_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CookieConsent } from '@/components/cookie-consent'
import './globals.css'

const _sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const _ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

const _instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'into.tax — UK Tax Intelligence',
  description: 'Real-time UK tax news aggregator for professionals. HMRC updates, case law, Budget analysis, and deadline tracking.',
  generator: 'next',
  openGraph: {
    title: 'into.tax — UK Tax Intelligence',
    description: 'Real-time UK tax news for accountancy firms. Every Friday.',
    url: 'https://into.tax',
    siteName: 'into.tax',
    images: [
      {
        url: 'https://into.tax/og-image.png',
        width: 1200,
        height: 630,
        alt: 'into.tax — UK Tax Intelligence',
      }
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'into.tax — UK Tax Intelligence',
    description: 'Real-time UK tax news for accountancy firms. Every Friday.',
    images: ['https://into.tax/og-image.png'],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1C1412',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
