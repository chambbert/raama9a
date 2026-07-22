'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/ui/spinner'
import {
  CheckCircle2, Circle, ArrowLeft, Calendar,
  Camera, Trash2, AlertTriangle, Plus, X, Loader2,
} from 'lucide-react'

type Task = {
  id: string
  title: string
  description: string | null
  frequency: 'EVERY_VISIT' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  order: number
}

const FREQUENCY_LABELS: Record<Task['frequency'], string> = {
  EVERY_VISIT: 'Every visit',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
}

type Completion = {
  taskId: string
  mediaUrls: string[]
}

type Incident = {
  id: string
  type: string
  description: string
  mediaUrls: string[]
  createdAt: string
}

type VisitData = {
  id: string
  checkIn: string
  checkOut: string | null
  apartment: {
    name: string
    address: string
    cleaningTasks: Task[]
  }
  taskCompletions: Completion[]
  incidentReports: Incident[]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm)$/i.test(url)
}

const INCIDENT_TYPES = [
  { value: 'broken', label: 'Something is broken' },
  { value: 'stolen', label: 'Something is missing/stolen' },
  { value: 'other', label: 'Other issue' },
]

const TYPE_BADGE: Record<string, string> = {
  broken: 'bg-orange-100 text-orange-700',
  stolen: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm'

export default function CleanerVisitPage() {
  const params = useParams()
  const router = useRouter()
  const visitId = params.visitId as string

  const [visit, setVisit] = useState<VisitData | null>(null)
  const [completions, setCompletions] = useState<Map<string, Completion>>(new Map())
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Task toggling
  const [toggling, setToggling] = useState<string | null>(null)

  // Per-task media upload
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null) // taskId
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const activeTaskId = useRef<string | null>(null)

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Incident modal
  const [incidentModalOpen, setIncidentModalOpen] = useState(false)
  const [incidentForm, setIncidentForm] = useState({ type: 'broken', description: '' })
  const [incidentFile, setIncidentFile] = useState<File | null>(null)
  const [incidentPreview, setIncidentPreview] = useState<string | null>(null)
  const [incidentError, setIncidentError] = useState('')
  const [submittingIncident, setSubmittingIncident] = useState(false)

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await fetch('/api/cleaner/assignments', { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) { router.push('/login'); return }
          setError('Failed to load visit data')
          return
        }
        const data = await res.json()
        const found = data.visits.find((v: VisitData) => v.id === visitId)
        if (!found) { setError('Visit not found or not assigned to you'); return }
        setVisit(found)
        const map = new Map<string, Completion>()
        for (const c of found.taskCompletions) map.set(c.taskId, c)
        setCompletions(map)
        setIncidents(found.incidentReports ?? [])
      } catch {
        setError('An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchVisit()
  }, [visitId, router])

  // ── Task toggle ─────────────────────────────────────────────────────────────
  const toggleTask = async (taskId: string) => {
    if (toggling) return
    setToggling(taskId)
    const isCompleted = completions.has(taskId)

    // Optimistic update
    setCompletions((prev) => {
      const next = new Map(prev)
      if (isCompleted) next.delete(taskId)
      else next.set(taskId, { taskId, mediaUrls: [] })
      return next
    })

    try {
      const res = await fetch('/api/cleaner/completions', {
        method: isCompleted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, visitId }),
        credentials: 'include',
      })
      if (!res.ok) {
        // Revert
        setCompletions((prev) => {
          const next = new Map(prev)
          if (isCompleted) next.set(taskId, { taskId, mediaUrls: [] })
          else next.delete(taskId)
          return next
        })
      }
    } catch {
      setCompletions((prev) => {
        const next = new Map(prev)
        if (isCompleted) next.set(taskId, { taskId, mediaUrls: [] })
        else next.delete(taskId)
        return next
      })
    } finally {
      setToggling(null)
    }
  }

  // ── Task media upload ────────────────────────────────────────────────────────
  const openMediaPicker = (taskId: string) => {
    activeTaskId.current = taskId
    mediaInputRef.current?.click()
  }

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const taskId = activeTaskId.current
    if (!file || !taskId) return
    e.target.value = ''

    setUploadingMedia(taskId)
    try {
      const fd = new FormData()
      fd.append('taskId', taskId)
      fd.append('visitId', visitId)
      fd.append('file', file)

      const res = await fetch('/api/cleaner/task-media', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setCompletions((prev) => {
          const next = new Map(prev)
          next.set(taskId, { taskId, mediaUrls: data.completion.mediaUrls })
          return next
        })
      }
    } finally {
      setUploadingMedia(null)
      activeTaskId.current = null
    }
  }

  const removeTaskMedia = async (taskId: string, url: string) => {
    const res = await fetch('/api/cleaner/task-media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, visitId, url }),
      credentials: 'include',
    })
    if (res.ok) {
      setCompletions((prev) => {
        const next = new Map(prev)
        const c = next.get(taskId)
        if (c) next.set(taskId, { ...c, mediaUrls: c.mediaUrls.filter((u) => u !== url) })
        return next
      })
    }
  }

  // ── Incident report ──────────────────────────────────────────────────────────
  const handleIncidentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIncidentFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setIncidentPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setIncidentPreview(null)
    }
  }

  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incidentForm.description.trim()) {
      setIncidentError('Please describe the issue')
      return
    }
    setIncidentError('')
    setSubmittingIncident(true)

    try {
      const fd = new FormData()
      fd.append('visitId', visitId)
      fd.append('type', incidentForm.type)
      fd.append('description', incidentForm.description.trim())
      if (incidentFile) fd.append('file', incidentFile)

      const res = await fetch('/api/cleaner/incidents', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setIncidents((prev) => [data.incident, ...prev])
        setIncidentModalOpen(false)
        setIncidentForm({ type: 'broken', description: '' })
        setIncidentFile(null)
        setIncidentPreview(null)
      } else {
        const data = await res.json()
        setIncidentError(data.error || 'Failed to submit report')
      }
    } catch {
      setIncidentError('An error occurred')
    } finally {
      setSubmittingIncident(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />
  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/cleaner" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to assignments
        </Link>
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }
  if (!visit) return null

  const tasks = visit.apartment.cleaningTasks
  const totalTasks = tasks.length
  const completedCount = completions.size
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  const isDone = totalTasks > 0 && completedCount === totalTasks

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Hidden file input for task media */}
      <input
        ref={mediaInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleMediaFileChange}
      />

      {/* Header */}
      <div>
        <Link href="/cleaner" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to assignments
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{visit.apartment.name}</h1>
        <p className="text-gray-500">{visit.apartment.address}</p>
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(visit.checkIn)}
            {visit.checkOut ? ` – ${formatDate(visit.checkOut)}` : ''}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {isDone ? 'All tasks complete!' : `${completedCount} of ${totalTasks} tasks done`}
              </span>
              <span className={`text-sm font-bold ${isDone ? 'text-green-600' : 'text-amber-600'}`}>
                {progress}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-green-500' : 'bg-amber-400'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Cleaning Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-4 text-center">
              No cleaning tasks defined for this apartment yet.
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const completion = completions.get(task.id)
                const isCompleted = !!completion
                const isToggling = toggling === task.id
                const isUploading = uploadingMedia === task.id
                const media = completion?.mediaUrls ?? []

                return (
                  <div key={task.id} className={`rounded-lg border transition-colors ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    {/* Task row */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      disabled={isToggling}
                      className={`w-full flex items-start gap-3 p-4 text-left ${isToggling ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted
                          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                          : <Circle className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </p>
                          {task.frequency !== 'EVERY_VISIT' && (
                            <span className="text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-2 py-0.5 flex-shrink-0">
                              {FREQUENCY_LABELS[task.frequency]}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className={`text-sm mt-0.5 ${isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Media section — only visible when completed */}
                    {isCompleted && (
                      <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {media.map((url, i) => (
                            <div key={i} className="relative group">
                              <button onClick={() => setLightboxUrl(url)} className="block">
                                {isVideo(url) ? (
                                  <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                                    ▶ Video
                                  </div>
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={url} alt="Proof" className="w-16 h-16 object-cover rounded-lg" />
                                )}
                              </button>
                              <button
                                onClick={() => removeTaskMedia(task.id, url)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white items-center justify-center hidden group-hover:flex"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}

                          {/* Add proof button */}
                          <button
                            onClick={() => openMediaPicker(task.id)}
                            disabled={isUploading}
                            className="w-16 h-16 rounded-lg border-2 border-dashed border-green-300 bg-green-50 hover:bg-green-100 flex flex-col items-center justify-center text-green-600 transition-colors"
                          >
                            {isUploading
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <><Camera className="h-4 w-4" /><span className="text-xs mt-0.5">Proof</span></>}
                          </button>
                        </div>
                        {media.length === 0 && (
                          <p className="text-xs text-gray-400">Tap the camera to add a photo or video as proof</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All-done banner */}
      {isDone && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-full font-medium">
            <CheckCircle2 className="h-5 w-5" /> Cleaning complete — great work!
          </div>
        </div>
      )}

      {/* Incident reports section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Incident Reports
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => { setIncidentModalOpen(true); setIncidentError('') }}
              className="h-8 text-sm"
            >
              <Plus className="h-3 w-3 mr-1" /> Report Issue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">
              No incidents reported for this visit.
            </p>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[incident.type] ?? TYPE_BADGE.other}`}>
                      {incident.type === 'broken' ? 'Broken' : incident.type === 'stolen' ? 'Stolen' : 'Other'}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(incident.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{incident.description}</p>
                  {incident.mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {incident.mediaUrls.map((url, i) => (
                        <button key={i} onClick={() => setLightboxUrl(url)}>
                          {isVideo(url) ? (
                            <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs">▶</div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="Incident" className="w-16 h-16 object-cover rounded-lg hover:opacity-90" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident report modal */}
      <Modal
        isOpen={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        title="Report an Issue"
      >
        <form onSubmit={submitIncident} className="space-y-4">
          {incidentError && <Alert variant="error">{incidentError}</Alert>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
            <select
              value={incidentForm.type}
              onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}
              className="w-full h-10 rounded-md border border-gray-300 px-3"
            >
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={incidentForm.description}
              onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo / Video (Optional)
            </label>
            {incidentFile ? (
              <div className="space-y-2">
                {incidentPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={incidentPreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 bg-gray-900 rounded-lg flex items-center justify-center text-white text-sm">
                    {incidentFile.name}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setIncidentFile(null); setIncidentPreview(null) }}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                <Camera className="h-5 w-5" />
                <span>Tap to add photo or video</span>
                <input
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={handleIncidentFileChange}
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIncidentModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submittingIncident} className="flex-1">
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>

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
