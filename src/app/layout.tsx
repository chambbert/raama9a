import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://raama9a.ee'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Raama 9a – Riverside Apartment in Pärnu | River View Accommodation',
    template: '%s | Raama 9a Pärnu',
  },
  description:
    'Raama 9a – a cozy riverside apartment in Pärnu, Estonia with stunning river views. ' +
    'Modern, comfortable Pärnu accommodation perfect for short stays, holidays and business trips. ' +
    'Book your stay at this unique river view apartment today.',
  keywords: [
    'raama9a',
    'raama 9a',
    'Pärnu apartments',
    'Pärnu apartment',
    'riverside apartment Pärnu',
    'river view apartment Pärnu',
    'river view cozy apartment',
    'cozy apartment Pärnu',
    'Pärnu accommodation',
    'Pärnu short-term rental',
    'Pärnu holiday apartment',
    'apartment Pärnu Estonia',
    'Pärnu jõe äärne korter',
    'üürikorter Pärnu',
    'Pärnu riverfront apartment',
    'Estonia apartment rental',
  ],
  authors: [{ name: 'Raama 9a' }],
  creator: 'Raama 9a',
  publisher: 'Raama 9a',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'et_EE',
    url: siteUrl,
    siteName: 'Raama 9a – Riverside Apartment Pärnu',
    title: 'Raama 9a – Cozy Riverside Apartment in Pärnu',
    description:
      'Stay at Raama 9a, a beautiful riverside apartment in Pärnu, Estonia. ' +
      'Enjoy river views, modern amenities, and a cozy atmosphere in the heart of Pärnu.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Raama 9a – Riverside Apartment in Pärnu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raama 9a – Riverside Apartment in Pärnu',
    description:
      'Cozy river view apartment in Pärnu, Estonia. Modern amenities, stunning riverside location.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  )
}
