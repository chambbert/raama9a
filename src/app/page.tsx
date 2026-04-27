import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/landing/navbar'
import { HeroCarousel } from '@/components/landing/hero-carousel'
import { AmenitiesSection } from '@/components/landing/amenities-section'
import { BookingSection } from '@/components/landing/booking-section'
import { LocationSection } from '@/components/landing/location-section'
import { ContactSection } from '@/components/landing/contact-section'
import { ReviewsSection } from '@/components/landing/reviews-section'
import { Footer } from '@/components/landing/footer'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://raama9a.ee'

export const metadata: Metadata = {
  title: 'Rääma 9a – Riverside Apartment in Pärnu | River View Accommodation',
  description:
    'Rääma 9a is a cozy riverside apartment in Pärnu, Estonia. ' +
    'Enjoy stunning river views, modern amenities and a peaceful location. ' +
    'The perfect Pärnu apartment for holidays, short stays and weekend getaways.',
  alternates: {
    canonical: siteUrl,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  '@id': siteUrl,
  name: 'Rääma 9a – Riverside Apartment Pärnu',
  alternateName: ['raama9a', 'Rääma 9a Pärnu', 'Riverside Apartment Pärnu'],
  description:
    'Cozy riverside apartment in Pärnu, Estonia with beautiful river views. ' +
    'Modern accommodation at Rääma 9a offering a relaxing stay by the river.',
  url: siteUrl,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rääma 9a',
    addressLocality: 'Pärnu',
    addressCountry: 'EE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 58.3858,
    longitude: 24.4972,
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'River view', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Riverside location', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'WiFi', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Kitchen', value: true },
  ],
  containedInPlace: {
    '@type': 'City',
    name: 'Pärnu',
    containedInPlace: {
      '@type': 'Country',
      name: 'Estonia',
    },
  },
}

async function getPageData() {
  const [heroImages, reviews, settings, sections, apartments] = await Promise.all([
    prisma.heroImage.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    }),
    prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.siteSettings.findFirst(),
    prisma.section.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    }),
    prisma.apartment.findMany({
      orderBy: { name: 'asc' },
      include: { pricing: { orderBy: { dayOfWeek: 'asc' } }, datePrices: true },
    }),
  ])

  return { heroImages, reviews, settings, sections, apartments }
}

export default async function HomePage() {
  const { heroImages, reviews, settings, sections, apartments } = await getPageData()

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <HeroCarousel
        images={heroImages}
        siteName={settings?.siteName || 'Rääma 9a – Riverside Apartment Pärnu'}
      />

      <div id="booking">
        <BookingSection apartments={apartments} />
      </div>

      <div id="amenities">
        <AmenitiesSection />
      </div>

      <div id="location">
        <LocationSection
          address={settings?.address || 'Rääma 9a, Pärnu, Estonia'}
          mapUrl={settings?.mapUrl}
        />
      </div>

      <div id="reviews">
        <ReviewsSection reviews={reviews} />
      </div>

      <div id="contact">
        <ContactSection
          email={settings?.contactEmail || null}
          phone={settings?.contactPhone || null}
        />
      </div>

      {sections.map((section) => (
        <section key={section.id} className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">{section.title}</h2>
            <div className="prose prose-lg mx-auto whitespace-pre-wrap">
              {section.content}
            </div>
          </div>
        </section>
      ))}

      <Footer />
    </main>
  )
}
