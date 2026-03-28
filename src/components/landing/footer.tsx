import Link from 'next/link'
import { MapPin, Mail, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Property info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Raama 9a</h3>
            <p className="text-sm text-red-400 mb-3">Riverside Apartment · Pärnu, Estonia</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              A cozy river view apartment in the heart of Pärnu.
              Perfect for holidays, short stays, and weekend getaways by the river.
            </p>
            <address className="not-italic mt-4 flex items-start gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-400" />
              <span>Raama 9a, Pärnu, Estonia</span>
            </address>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#amenities" className="hover:text-white transition-colors">
                  Amenities
                </Link>
              </li>
              <li>
                <Link href="/#location" className="hover:text-white transition-colors">
                  Location &amp; Map
                </Link>
              </li>
              <li>
                <Link href="/#reviews" className="hover:text-white transition-colors">
                  Guest Reviews
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* About / keywords column */}
          <div>
            <h4 className="font-semibold text-white mb-4">About the Apartment</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li>📍 Raama 9a, Pärnu</li>
              <li>🌊 Riverside &amp; river view location</li>
              <li>🛋️ Cozy, fully-equipped apartment</li>
              <li>🏙️ Central Pärnu accommodation</li>
              <li>✈️ Short-term &amp; holiday rentals</li>
            </ul>
            <div className="mt-4">
              <Link href="/login" className="text-sm hover:text-white transition-colors">
                Guest Portal Login →
              </Link>
            </div>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Raama 9a – Riverside Apartment Pärnu. All rights reserved.</p>
          <p>Pärnu apartment · River view · Estonia</p>
        </div>
      </div>
    </footer>
  )
}
