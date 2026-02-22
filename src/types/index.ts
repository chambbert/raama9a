export type Role = 'ADMIN' | 'CLIENT'

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: Role
  createdAt: Date
}

export interface Apartment {
  id: string
  name: string
  address: string
  description: string | null
  latitude: number | null
  longitude: number | null
  createdAt: Date
}

export interface Visit {
  id: string
  userId: string
  apartmentId: string
  checkIn: Date
  checkOut: Date | null
  revenue: number
  costs: number
  notes: string | null
  createdAt: Date
  user?: User
  apartment?: Apartment
}

export interface KeyCode {
  id: string
  apartmentId: string
  code: string
  description: string
  validFrom: Date | null
  validTo: Date | null
  apartment?: Apartment
}

export interface Instruction {
  id: string
  category: string
  title: string
  content: string
  imageUrl: string | null
  order: number
}

export interface Sightseeing {
  id: string
  name: string
  description: string
  address: string | null
  category: string
  imageUrl: string | null
  order: number
}

export interface Review {
  id: string
  userId: string | null
  name: string
  rating: number
  comment: string
  approved: boolean
  createdAt: Date
  user?: User | null
}

export interface HeroImage {
  id: string
  imageUrl: string
  title: string | null
  order: number
  active: boolean
}

export interface Section {
  id: string
  type: string
  title: string
  content: string
  order: number
  active: boolean
}

export interface SiteSettings {
  id: string
  siteName: string
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  mapUrl: string | null
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form state types
export interface FormState {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[]>
}

// Client card type for admin panel
export interface ClientCard extends User {
  totalVisits: number
  totalRevenue: number
  totalCosts: number
  lastVisit: Date | null
  visits: Visit[]
}
