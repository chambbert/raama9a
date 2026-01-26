import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/landing/navbar'
import { HeroCarousel } from '@/components/landing/hero-carousel'
import { AmenitiesSection } from '@/components/landing/amenities-section'
import { LocationSection } from '@/components/landing/location-section'
import { ContactSection } from '@/components/landing/contact-section'
import { ReviewsSection } from '@/components/landing/reviews-section'
import { Footer } from '@/components/landing/footer'

async function getPageData() {
  const [heroImages, reviews, settings, sections] = await Promise.all([
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
  ])

  return { heroImages, reviews, settings, sections }
}

export default async function HomePage() {
  const { heroImages, reviews, settings, sections } = await getPageData()

  return (
    <main className="min-h-screen">
      <Navbar />

      <HeroCarousel
        images={heroImages}
        siteName={settings?.siteName || 'Welcome to Our Apartment'}
      />

      <div id="amenities">
        <AmenitiesSection />
      </div>

      <div id="location">
        <LocationSection
          address={settings?.address || null}
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

      {/* Dynamic Sections */}
      {sections.map((section) => (
        <section key={section.id} className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">{section.title}</h2>
            <div
              className="prose prose-lg mx-auto"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        </section>
      ))}

      <Footer />
    </main>
  )
}
