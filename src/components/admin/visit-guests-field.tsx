'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { UserPlus, Shuffle, Copy, Check as CheckIcon, X } from 'lucide-react'
import { generatePassword } from '@/lib/utils'
import type { User } from '@/types'

type Props = {
  /** Client accounts available to attach. The primary guest is filtered out of the list. */
  users: User[]
  primaryUserId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
  /** Lets the parent add a freshly created account to its own list without a refetch. */
  onUserCreated: (user: User) => void
}

/**
 * Picks the extra people sharing a stay. Each one is a real account with its own login, so they
 * see the same key codes and instructions as the guest who booked.
 */
export function VisitGuestsField({ users, primaryUserId, selectedIds, onChange, onUserCreated }: Props) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', email: '', password: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  // Kept after creation so the admin can still copy the password to send to the guest.
  const [lastCreated, setLastCreated] = useState<{ name: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const selectable = users.filter((u) => u.id !== primaryUserId)

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id])
  }

  const openNewForm = () => {
    setNewGuest({ name: '', email: '', password: generatePassword() })
    setCreateError('')
    setShowNewForm(true)
  }

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      (err) => {
        console.error('[visit-guests] clipboard write failed:', err)
        setCreateError('Could not copy to clipboard — select the password and copy it manually.')
      }
    )
  }

  const createGuest = async () => {
    setCreateError('')
    setCreating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newGuest, role: 'CLIENT' }),
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok) {
        setCreateError(data.error || 'Failed to create the account')
        return
      }

      onUserCreated(data.user)
      onChange([...selectedIds, data.user.id])
      setLastCreated({ name: data.user.name, password: newGuest.password })
      setShowNewForm(false)
      setNewGuest({ name: '', email: '', password: '' })
    } catch (err) {
      console.error('[visit-guests] create account request failed:', err)
      setCreateError('An error occurred while creating the account')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Also staying {selectedIds.length > 0 && `(${selectedIds.length})`}
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Everyone listed here gets their own login and sees the same key codes and instructions.
      </p>

      {selectable.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 divide-y">
          {selectable.map((user) => (
            <label
              key={user.id}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(user.id)}
                onChange={() => toggle(user.id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">
                {user.name} <span className="text-gray-500">{user.email}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {selectable.length === 0 && !showNewForm && (
        <p className="text-sm text-gray-500">No other client accounts yet — create one below.</p>
      )}

      {lastCreated && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm">
          <span className="text-emerald-800">
            Created <strong>{lastCreated.name}</strong> — password{' '}
            <code className="font-mono bg-white px-1 rounded">{lastCreated.password}</code>
          </span>
          <button
            type="button"
            onClick={() => copyPassword(lastCreated.password)}
            className="p-1 hover:bg-emerald-100 rounded"
            title="Copy password"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 text-emerald-700" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setLastCreated(null)}
            className="p-1 hover:bg-emerald-100 rounded ml-auto"
            title="Dismiss"
          >
            <X className="h-4 w-4 text-emerald-700" />
          </button>
        </div>
      )}

      {showNewForm ? (
        <div className="mt-2 rounded-md border border-gray-300 p-3 space-y-3 bg-gray-50">
          {createError && <Alert variant="error">{createError}</Alert>}
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="newGuestName"
              label="Full name"
              value={newGuest.name}
              onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
            />
            <Input
              id="newGuestEmail"
              type="email"
              label="Email"
              value={newGuest.email}
              onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="newGuestPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="flex items-center gap-2">
              <input
                id="newGuestPassword"
                type="text"
                value={newGuest.password}
                onChange={(e) => setNewGuest({ ...newGuest, password: e.target.value })}
                className="flex-1 h-10 rounded-md border border-gray-300 px-3 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setNewGuest({ ...newGuest, password: generatePassword() })}
                className="p-2 hover:bg-gray-200 rounded-lg"
                title="Generate a new password"
              >
                <Shuffle className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewForm(false)}
              className="flex-1 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={createGuest}
              loading={creating}
              disabled={!newGuest.name || !newGuest.email || newGuest.password.length < 8}
              className="flex-1 h-9 text-sm"
            >
              Create &amp; attach
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={openNewForm} className="mt-2 h-9 text-sm">
          <UserPlus className="h-4 w-4 mr-2" />
          New account
        </Button>
      )}
    </div>
  )
}
