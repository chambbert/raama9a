'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Save, Globe, Mail, Phone, MapPin, Map } from 'lucide-react'
import type { SiteSettings } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      } else {
        setError('Failed to load settings')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/settings', { credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save settings')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your site settings</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">Site Information</CardTitle>
            </div>
            <CardDescription>
              Configure the basic site information displayed on the landing page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="siteName"
              label="Site Name"
              value={settings?.siteName || ''}
              onChange={(e) => setSettings({ ...settings!, siteName: e.target.value })}
              placeholder="Welcome to Our Apartment"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </div>
            <CardDescription>
              Contact details displayed on the landing page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="contactEmail"
              type="email"
              label="Contact Email"
              value={settings?.contactEmail || ''}
              onChange={(e) => setSettings({ ...settings!, contactEmail: e.target.value })}
              placeholder="contact@example.com"
            />
            <Input
              id="contactPhone"
              type="tel"
              label="Contact Phone"
              value={settings?.contactPhone || ''}
              onChange={(e) => setSettings({ ...settings!, contactPhone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">Location</CardTitle>
            </div>
            <CardDescription>
              Location details for the landing page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="address"
              label="Address"
              value={settings?.address || ''}
              onChange={(e) => setSettings({ ...settings!, address: e.target.value })}
              placeholder="123 Main Street, City, Country"
            />
            <div>
              <Input
                id="mapUrl"
                label="Google Maps Embed URL (Optional)"
                value={settings?.mapUrl || ''}
                onChange={(e) => setSettings({ ...settings!, mapUrl: e.target.value })}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Get the embed URL from Google Maps: Click Share → Embed a map → Copy the src URL
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" loading={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </form>
    </div>
  )
}
