import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'CLIENT']).default('CLIENT'),
})

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'CLIENT']).optional(),
})

// Apartment schemas
export const apartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

// Visit schemas
export const visitSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  apartmentId: z.string().min(1, 'Apartment ID is required'),
  checkIn: z.string().transform((str) => new Date(str)),
  checkOut: z.string().nullable().optional().transform((str) => str ? new Date(str) : undefined),
  revenue: z.number().default(0),
  costs: z.number().default(0),
  notes: z.string().nullable().optional(),
})

// KeyCode schemas
export const keyCodeSchema = z.object({
  apartmentId: z.string().min(1, 'Apartment ID is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().min(1, 'Description is required'),
  validFrom: z.string().nullable().optional().transform((str) => str ? new Date(str) : undefined),
  validTo: z.string().nullable().optional().transform((str) => str ? new Date(str) : undefined),
})

// Instruction schemas
export const instructionSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  imageUrl: z.string().optional().nullable(),
  order: z.number().default(0),
})

// Sightseeing schemas
export const sightseeingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  address: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string().optional(),
  order: z.number().default(0),
})

// Review schemas
export const reviewSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
})

export const updateReviewSchema = z.object({
  approved: z.boolean().optional(),
  name: z.string().min(1).optional(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(10).optional(),
})

// Hero Image schemas
export const heroImageSchema = z.object({
  imageUrl: z.string().min(1, 'Image URL is required'),
  title: z.string().optional(),
  order: z.number().default(0),
  active: z.boolean().default(true),
})

// Section schemas
export const sectionSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  order: z.number().default(0),
  active: z.boolean().default(true),
})

// Site Settings schemas
export const siteSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  mapUrl: z.string().url().optional().nullable(),
})

// Helper function to sanitize string inputs (XSS prevention)
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Helper to validate and sanitize input
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.parse(data)

  // Recursively sanitize string values
  const sanitize = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      return sanitizeString(obj)
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value)
      }
      return sanitized
    }
    return obj
  }

  return sanitize(result) as T
}
