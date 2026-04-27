'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { Plus, Edit, Trash2, ClipboardList, ChevronUp, ChevronDown } from 'lucide-react'
import type { Apartment, CleaningTask } from '@/types'

type CleaningTaskWithApartment = CleaningTask & {
  apartment: Pick<Apartment, 'id' | 'name'>
}

export default function CleaningTasksPage() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [tasks, setTasks] = useState<CleaningTaskWithApartment[]>([])
  const [selectedApartmentId, setSelectedApartmentId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<CleaningTaskWithApartment | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchApartments = async () => {
    try {
      const res = await fetch('/api/apartments', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setApartments(data.apartments)
        if (data.apartments.length > 0 && !selectedApartmentId) {
          setSelectedApartmentId(data.apartments[0].id)
        }
      }
    } catch {
      setError('Failed to load apartments')
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async (apartmentId: string) => {
    if (!apartmentId) return
    try {
      const res = await fetch(`/api/cleaning-tasks?apartmentId=${apartmentId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks)
      }
    } catch {
      setError('Failed to load tasks')
    }
  }

  useEffect(() => {
    fetchApartments()
  }, [])

  useEffect(() => {
    if (selectedApartmentId) {
      fetchTasks(selectedApartmentId)
    }
  }, [selectedApartmentId])

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= tasks.length) return

    const a = tasks[index]
    const b = tasks[targetIndex]

    await Promise.all([
      fetch(`/api/cleaning-tasks/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: a.title, description: a.description || null, order: b.order }),
        credentials: 'include',
      }),
      fetch(`/api/cleaning-tasks/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: b.title, description: b.description || null, order: a.order }),
        credentials: 'include',
      }),
    ])
    fetchTasks(selectedApartmentId)
  }

  const openCreateModal = () => {
    setEditingTask(null)
    setFormData({ title: '', description: '', order: tasks.length })
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (task: CleaningTaskWithApartment) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      order: task.order,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const url = editingTask ? `/api/cleaning-tasks/${editingTask.id}` : '/api/cleaning-tasks'
      const method = editingTask ? 'PUT' : 'POST'

      const body = editingTask
        ? { title: formData.title, description: formData.description || null, order: formData.order }
        : { apartmentId: selectedApartmentId, title: formData.title, description: formData.description || null, order: formData.order }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchTasks(selectedApartmentId)
      } else {
        const data = await res.json()
        setFormError(data.error || 'Failed to save task')
      }
    } catch {
      setFormError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this cleaning task?')) return

    try {
      const res = await fetch(`/api/cleaning-tasks/${taskId}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchTasks(selectedApartmentId)
      } else {
        alert('Failed to delete task')
      }
    } catch {
      alert('An error occurred')
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cleaning Tasks</h1>
          <p className="text-gray-500">Define task checklists per apartment</p>
        </div>
        <Button onClick={openCreateModal} disabled={!selectedApartmentId}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {apartments.length === 0 ? (
        <Alert variant="warning">Add an apartment first before creating cleaning tasks.</Alert>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Apartment</label>
            <select
              value={selectedApartmentId}
              onChange={(e) => setSelectedApartmentId(e.target.value)}
              className="h-10 rounded-md border border-gray-300 px-3 min-w-[240px]"
            >
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>{apt.name}</option>
              ))}
            </select>
          </div>

          {tasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Yet</h3>
                  <p className="text-gray-500 mb-4">Add cleaning tasks for this apartment</p>
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tasks ({tasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 flex items-center justify-center hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === tasks.length - 1}
                          className="h-6 w-6 flex items-center justify-center hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 truncate">{task.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">#{task.order + 1}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-2 hover:bg-white rounded-lg"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add Cleaning Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            id="title"
            label="Task Title"
            placeholder="e.g., Clean bathroom"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            id="description"
            label="Description (Optional)"
            placeholder="Additional details or instructions..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
