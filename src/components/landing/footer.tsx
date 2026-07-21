import Link from 'next/link'
import { MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Brand */}
          <div>
            <h3 className="font-serif-display text-2xl font-light tracking-widest text-white uppercase mb-2">
              Rääma 9a
            </h3>
            <p className="text-xs tracking-widest uppercase text-sky-500 mb-6">
              Riverside Apartment · Pärnu, Estonia
            </p>
            <p className="text-sm text-stone-500 leading-relaxed">
              A cozy river view apartment in the heart of Pärnu.
              Perfect for holidays, short stays, and weekend getaways by the river.
            </p>
            <address className="not-italic mt-6 flex items-start gap-2 text-sm text-stone-500">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-sky-600" />
              <span>Rääma 9a, Pärnu, Estonia</span>
            </address>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-stone-300 mb-6">Navigate</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/#amenities', label: 'Amenities' },
                { href: '/#location', label: 'Location & Map' },
                { href: '/#reviews', label: 'Guest Reviews' },
                { href: '/#contact', label: 'Contact' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-stone-500 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-stone-300 mb-6">About</h4>
            <ul className="space-y-2 text-sm text-stone-500">
              <li>Rääma 9a, Pärnu</li>
              <li>Riverside &amp; river view location</li>
              <li>Cozy, fully-equipped apartment</li>
              <li>Central Pärnu accommodation</li>
              <li>Short-term &amp; holiday rentals</li>
            </ul>
            <div className="mt-6">
              <Link href="/login" className="text-xs tracking-widest uppercase text-stone-500 hover:text-white transition-colors">
                Guest Portal →
              </Link>
            </div>
          </div>

        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-stone-600">
          <p>&copy; {new Date().getFullYear()} Rääma 9a – Riverside Apartment Pärnu. All rights reserved.</p>
          <p>Pärnu apartment · River view · Estonia</p>
        </div>
      </div>
    </footer>
  )
}
