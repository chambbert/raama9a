'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { LoadingScreen } from '@/components/ui/spinner'
import { formatCurrency, formatDate, getInitials, generatePassword } from '@/lib/utils'
import { Plus, Edit, Trash2, User, Mail, Phone, DollarSign, Calendar, Eye, EyeOff, Copy, Check as CheckIcon, Shuffle } from 'lucide-react'
import type { ClientCard } from '@/types'

export default function UsersPage() {
  const [users, setUsers] = useState<ClientCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ClientCard | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CLIENT' as 'ADMIN' | 'CLIENT' | 'CLEANER',
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showGenPassword, setShowGenPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      } else {
        setError('Failed to load users')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', phone: '', password: '', role: 'CLIENT' as 'ADMIN' | 'CLIENT' | 'CLEANER' })
    setFormError('')
    setShowGenPassword(false)
    setShowPassword(false)
    setCopied(false)
    setIsModalOpen(true)
  }

  const openEditModal = (user: ClientCard) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
    })
    setFormError('')
    setShowGenPassword(false)
    setShowPassword(false)
    setCopied(false)
    setIsModalOpen(true)
  }

  const handleGeneratePassword = () => {
    setFormData((prev) => ({ ...prev, password: generatePassword() }))
    setShowPassword(true)
  }

  const copyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
      }

      if (formData.password) {
        body.password = formData.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchUsers()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Failed to save user')
      }
    } catch {
      setFormError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { credentials: 'include', method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        alert('Failed to delete user')
      }
    } catch {
      alert('An error occurred')
    }
  }

  const roleTabs = [
    { key: 'all', label: 'All' },
    { key: 'CLIENT', label: 'Client' },
    { key: 'ADMIN', label: 'Admin' },
    { key: 'CLEANER', label: 'Cleaner' },
  ]

  const filteredUsers = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter)

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage clients and administrators</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-2">
        {roleTabs.map((tab) => {
          const count = tab.key === 'all' ? users.length : users.filter((u) => u.role === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first user</p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <div className={`h-2 ${user.role === 'ADMIN' ? 'bg-purple-500' : user.role === 'CLEANER' ? 'bg-green-500' : 'bg-blue-500'}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {getInitials(user.name)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'CLEANER'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                        {user.generatedPassword && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            From booking
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="pt-3 border-t grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      Visits
                    </div>
                    <p className="font-semibold">{user.totalVisits}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <DollarSign className="h-3 w-3" />
                      Revenue
                    </div>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(user.totalRevenue)}
                    </p>
                  </div>
                </div>
                {user.lastVisit && (
                  <p className="text-xs text-gray-500">
                    Last visit: {formatDate(user.lastVisit)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            id="name"
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            id="email"
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            id="phone"
            type="tel"
            label="Phone (Optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          {/* System-generated password (read-only reveal) */}
          {editingUser?.generatedPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showGenPassword ? 'text' : 'password'}
                    readOnly
                    value={editingUser.generatedPassword}
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 pr-10 text-sm font-mono text-gray-800 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGenPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title={showGenPassword ? 'Hide password' : 'Show password'}
                  >
                    {showGenPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => copyPassword(editingUser.generatedPassword!)}
                  className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copy password"
                >
                  {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {editingUser ? 'Set new password (leave blank to keep current)' : 'Password (min 8 characters)'}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  minLength={editingUser ? undefined : 8}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Generate random password"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              {formData.password && (
                <button
                  type="button"
                  onClick={() => copyPassword(formData.password)}
                  className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copy password"
                >
                  {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          <Select
            id="role"
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CLIENT' | 'CLEANER' })}
            options={[
              { value: 'CLIENT', label: 'Client' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'CLEANER', label: 'Cleaner' },
            ]}
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
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
