import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Cake, Heart, Pencil, Plus, Trash2, UserRound, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/feedback/Spinner'
import { apiClient } from '@/services/apiClient'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'

type Gender = 'male' | 'female' | 'other'

interface Person {
  id: string
  name: string
  relation: string | null
  gender: Gender | null
  dob: string | null
  anniversary: string | null
}

interface Profile {
  name: string
  email: string | null
  phone: string | null
  phoneLocked: boolean
  dob: string | null
  gender: Gender | null
  anniversary: string | null
  people: Person[]
  maxPeople: number
}

type PersonValues = Omit<Person, 'id'>

const profileKey = ['customer-profile'] as const

const profileApi = {
  get: () => apiClient.get<Profile>('profile'),
  save: (values: Partial<Profile>) => apiClient.put<Profile>('profile', values),
  addPerson: (values: PersonValues) => apiClient.post<Person>('profile/people', values),
  updatePerson: (id: string, values: PersonValues) => apiClient.put<Person>(`profile/people/${id}`, values),
  removePerson: (id: string) => apiClient.delete<null>(`profile/people/${id}`),
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
]

const RELATIONS = ['Mother', 'Father', 'Wife', 'Husband', 'Son', 'Daughter', 'Sister', 'Brother', 'Friend']

const today = () => new Date().toISOString().slice(0, 10)

function fail(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
}

function niceDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/**
 * The customer's own details and the people they celebrate. Favourite shops
 * use the dates for birthday and anniversary offers, and Listee reminds the
 * customer two days before each one.
 */
export function CustomerDetails() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: profileKey, queryFn: profileApi.get })
  const refresh = () => void qc.invalidateQueries({ queryKey: profileKey })
  const remove = useMutation({ mutationFn: profileApi.removePerson, onSuccess: refresh, onError: fail })
  const [editing, setEditing] = useState<Person | 'new' | null>(null)

  if (isLoading || !data) {
    return (
      <Card className="flex justify-center py-6">
        <Spinner size={24} label="Loading your details" />
      </Card>
    )
  }

  return (
    <>
      <MyDetailsCard profile={data} />

      <Card padding="md" className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-pink-100 text-pink-600">
            <Users className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-bold text-foreground">People I celebrate</p>
            <p className="text-small text-text-secondary">
              Family and friends. Get offers from your favourite shops before their birthday or anniversary.
            </p>
          </div>
          {data.people.length < data.maxPeople && (
            <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
              Add
            </Button>
          )}
        </div>

        {data.people.length > 0 && (
          <ul className="divide-y divide-border border-t border-border">
            {data.people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted font-bold text-text-secondary">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <button type="button" onClick={() => setEditing(p)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold text-foreground">
                    {p.name}
                    {p.relation && <span className="font-normal text-text-secondary"> · {p.relation}</span>}
                  </span>
                  <span className="block truncate text-small text-text-secondary">
                    {[p.dob && `🎂 ${niceDate(p.dob)}`, p.anniversary && `💐 ${niceDate(p.anniversary)}`].filter(Boolean).join('   ')}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => setEditing(p)}
                  className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-muted"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => remove.mutate(p.id, { onSuccess: () => toast.success(`${p.name} removed`) })}
                  className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <PersonDialog person={editing} onClose={() => setEditing(null)} onSaved={refresh} />
    </>
  )
}

function MyDetailsCard({ profile }: { profile: Profile }) {
  const qc = useQueryClient()
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [dob, setDob] = useState(profile.dob ?? '')
  const [gender, setGender] = useState<Gender | ''>(profile.gender ?? '')
  const [anniversary, setAnniversary] = useState(profile.anniversary ?? '')

  useEffect(() => {
    setPhone(profile.phone ?? '')
    setDob(profile.dob ?? '')
    setGender(profile.gender ?? '')
    setAnniversary(profile.anniversary ?? '')
  }, [profile])

  const dirty =
    phone !== (profile.phone ?? '') ||
    dob !== (profile.dob ?? '') ||
    gender !== (profile.gender ?? '') ||
    anniversary !== (profile.anniversary ?? '')

  const save = useMutation({
    mutationFn: () =>
      profileApi.save({
        ...(profile.phoneLocked ? {} : { phone: phone || null }),
        dob: dob || null,
        gender: gender || null,
        anniversary: anniversary || null,
      }),
    onSuccess: (p) => {
      qc.setQueryData(profileKey, p)
      toast.success('Details saved')
    },
    onError: fail,
  })

  return (
    <Card padding="md" className={cn('space-y-3 transition-colors', dirty && 'border-warning')}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <UserRound className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-bold text-foreground">My details</p>
          <p className="text-small text-text-secondary">Shops can surprise you on your birthday and anniversary.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="me-phone">Mobile number</Label>
        <Input
          id="me-phone"
          inputMode="numeric"
          value={phone}
          disabled={profile.phoneLocked}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile"
        />
        {profile.phoneLocked && <p className="text-small text-text-muted">Your mobile is how you sign in, so it stays as it is.</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="me-dob" className="flex items-center gap-1">
            <Cake className="size-3.5" aria-hidden /> Date of birth
          </Label>
          <Input id="me-dob" type="date" max={today()} value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="me-ann" className="flex items-center gap-1">
            <Heart className="size-3.5" aria-hidden /> Anniversary
          </Label>
          <Input id="me-ann" type="date" max={today()} value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
        </div>
      </div>

      <GenderPicker value={gender} onChange={setGender} />

      {dirty && (
        <div className="flex items-center gap-2 rounded-xl bg-warning-soft p-2 pl-3">
          <p className="min-w-0 flex-1 text-caption font-semibold text-foreground">Unsaved changes</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPhone(profile.phone ?? '')
              setDob(profile.dob ?? '')
              setGender(profile.gender ?? '')
              setAnniversary(profile.anniversary ?? '')
            }}
          >
            Cancel
          </Button>
          <Button size="sm" isLoading={save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        </div>
      )}
    </Card>
  )
}

function GenderPicker({ value, onChange }: { value: Gender | ''; onChange: (g: Gender | '') => void }) {
  return (
    <div className="space-y-1.5">
      <Label>Gender</Label>
      <div className="flex gap-2" role="radiogroup" aria-label="Gender">
        {GENDERS.map((g) => (
          <button
            key={g.value}
            type="button"
            role="radio"
            aria-checked={value === g.value}
            onClick={() => onChange(value === g.value ? '' : g.value)}
            className={cn(
              'flex-1 rounded-lg border px-3 py-2 text-caption font-semibold transition-colors',
              value === g.value ? 'border-primary bg-primary-soft text-primary' : 'border-border text-text-secondary',
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PersonDialog({ person, onClose, onSaved }: { person: Person | 'new' | null; onClose: () => void; onSaved: () => void }) {
  const existing = person && person !== 'new' ? person : null
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [dob, setDob] = useState('')
  const [anniversary, setAnniversary] = useState('')

  useEffect(() => {
    if (!person) return
    setName(existing?.name ?? '')
    setRelation(existing?.relation ?? '')
    setGender(existing?.gender ?? '')
    setDob(existing?.dob ?? '')
    setAnniversary(existing?.anniversary ?? '')
  }, [person, existing])

  const save = useMutation({
    mutationFn: () => {
      const values: PersonValues = {
        name: name.trim(),
        relation: relation.trim() || null,
        gender: gender || null,
        dob: dob || null,
        anniversary: anniversary || null,
      }
      return existing ? profileApi.updatePerson(existing.id, values) : profileApi.addPerson(values)
    },
    onSuccess: () => {
      toast.success(existing ? 'Saved' : `${name.trim()} added`)
      onSaved()
      onClose()
    },
    onError: fail,
  })

  return (
    <Dialog open={person !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? `Edit ${existing.name}` : 'Add someone'}</DialogTitle>
          <DialogDescription>We remind you two days before — with offers from your favourite shops.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riya" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-rel">Relation (optional)</Label>
            <Input id="p-rel" list="p-relations" value={relation} maxLength={30} onChange={(e) => setRelation(e.target.value)} placeholder="Sister, friend…" />
            <datalist id="p-relations">
              {RELATIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <GenderPicker value={gender} onChange={setGender} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-dob">Birthday</Label>
              <Input id="p-dob" type="date" max={today()} value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-ann">Anniversary</Label>
              <Input id="p-ann" type="date" max={today()} value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
            </div>
          </div>
          {!dob && !anniversary && <p className="text-small text-text-muted">Add a birthday or an anniversary.</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            isLoading={save.isPending}
            disabled={name.trim().length < 2 || (!dob && !anniversary)}
          >
            {existing ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
