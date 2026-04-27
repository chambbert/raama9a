'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { AlertTriangle, Calendar, User, Building, CheckCircle, CheckCircle2 } from 'lucide-react'

type IncidentWithRelations = {
  id: string
  type: string
  description: string
  mediaUrls: string[]
  resolved: boolean
  resolvedAt: string | null
  createdAt: string
  visit: {
    id: string
    checkIn: string
    apartment: { name: string }
    cleaner: { name: string; email: string } | null
  }
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  broken: { label: 'Broken', color: 'bg-orange-100 text-orange-700' },
  stolen: { label: 'Stolen', color: 'bg-red-100 text-red-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm)$/i.test(url)
}

const ACTIVE_TAB = 'bg-gray-900 text-white'
const INACTIVE_TAB = 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/incidents', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setIncidents(data.incidents)
      } else {
        setError('Failed to load incidents')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  const toggleResolved = async (id: string) => {
    setTogglingId(id)
    try {
      await fetch(`/api/admin/incidents/${id}`, {
        method: 'PUT',
        credentials: 'include',
      })
      await fetchIncidents()
    } catch {
      // silently fail — fetchIncidents will leave state intact
    } finally {
      setTogglingId(null)
    }
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesType = typeFilter === 'all' || incident.type === typeFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' && !incident.resolved) ||
      (statusFilter === 'resolved' && incident.resolved)
    return matchesType && matchesStatus
  })

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
        <p className="text-gray-500">Issues reported by cleaners</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Type filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 w-12">Type:</span>
          <div className="flex gap-2 flex-wrap">
            {['all', 'broken', 'stolen', 'other'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                  typeFilter === t ? ACTIVE_TAB : INACTIVE_TAB
                }`}
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t]?.label ?? t}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 w-12">Status:</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Open' },
              { value: 'resolved', label: 'Resolved' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                  statusFilter === value ? ACTIVE_TAB : INACTIVE_TAB
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {filteredIncidents.length === 0 && !error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Incidents</h3>
              <p className="text-gray-500">
                {incidents.length === 0
                  ? 'No incident reports have been filed yet.'
                  : 'No incidents match the current filters.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => {
            const typeInfo = TYPE_LABELS[incident.type] ?? TYPE_LABELS.other
            const isToggling = togglingId === incident.id
            return (
              <Card
                key={incident.id}
                className={`transition-opacity ${
                  incident.resolved
                    ? 'border-l-4 border-emerald-400 opacity-60'
                    : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <CardTitle className="text-base">{incident.description}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{formatDate(incident.createdAt)}</span>
                      {incident.resolved ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm text-emerald-600 font-medium">Resolved</span>
                          <button
                            onClick={() => toggleResolved(incident.id)}
                            disabled={isToggling}
                            className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 disabled:opacity-50"
                          >
                            Undo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleResolved(incident.id)}
                          disabled={isToggling}
                          className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark resolved
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      <span>{incident.visit.apartment.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(incident.visit.checkIn)}</span>
                    </div>
                    {incident.visit.cleaner && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{incident.visit.cleaner.name}</span>
                      </div>
                    )}
                  </div>

                  {incident.resolved && incident.resolvedAt && (
                    <p className="text-xs text-emerald-600">
                      Resolved on {formatDate(incident.resolvedAt)}
                    </p>
                  )}

                  {incident.mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {incident.mediaUrls.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxUrl(url)}
                          className="relative group"
                        >
                          {isVideo(url) ? (
                            <div className="w-24 h-24 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs">
                              ▶ Video
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt="Incident media"
                              className="w-24 h-24 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {isVideo(lightboxUrl) ? (
            <video
              src={lightboxUrl}
              controls
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxUrl}
              alt="Media"
              className="max-w-full max-h-full rounded-lg object-contain"
            />
          )}
        </div>
      )}
    </div>
  )
}
