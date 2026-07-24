import type { ReactNode } from 'react'
import { Clock, MapPin, Phone, Globe, AtSign, Link2, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { PublicBusiness } from '../publicTypes'

function hhmm(t: string | null): string | null {
  return t ? t.slice(0, 5) : null
}

/** Business info tab (Phase 7.4) — about, timings, address + map, contacts. */
export function BusinessInfo({ business }: { business: PublicBusiness }) {
  const open = hhmm(business.openingTime)
  const close = hhmm(business.closingTime)
  const mapsUrl =
    business.latitude != null && business.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : business.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
        : null

  return (
    <div className="space-y-4">
      {business.description && (
        <Card padding="md">
          <h3 className="mb-1 text-body font-semibold text-foreground">About</h3>
          <p className="text-body text-text-secondary">{business.description}</p>
        </Card>
      )}

      {open && close && (
        <Card className="flex items-center gap-3" padding="md">
          <Clock className="size-5 shrink-0 text-text-secondary" aria-hidden />
          <div>
            <p className="text-body font-medium text-foreground">Timings</p>
            <p className="text-caption text-text-secondary">
              {open} – {close}
              <span className={`ml-2 font-medium ${business.isOpen ? 'text-success' : 'text-destructive'}`}>
                {business.isOpen ? 'Open now' : 'Closed now'}
              </span>
            </p>
          </div>
        </Card>
      )}

      {business.address && (
        <Card className="space-y-2" padding="md">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-text-secondary" aria-hidden />
            <p className="text-body text-text-secondary">{business.address}</p>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-caption font-medium text-primary hover:underline"
            >
              Open in Maps
            </a>
          )}
        </Card>
      )}

      <Card className="space-y-3" padding="md">
        <h3 className="text-body font-semibold text-foreground">Contact</h3>
        {business.phone && <ContactRow icon={<Phone className="size-4" />} label={business.phone} href={`tel:${business.phone}`} />}
        {business.whatsapp && (
          <ContactRow icon={<MessageCircle className="size-4" />} label="WhatsApp" href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`} />
        )}
        {business.website && <ContactRow icon={<Globe className="size-4" />} label="Website" href={business.website} />}
        {business.instagram && <ContactRow icon={<AtSign className="size-4" />} label="Instagram" href={business.instagram} />}
        {business.facebook && <ContactRow icon={<Link2 className="size-4" />} label="Facebook" href={business.facebook} />}
        {!business.phone && !business.whatsapp && !business.website && (
          <p className="text-caption text-text-muted">No contact details added yet.</p>
        )}
      </Card>
    </div>
  )
}

function ContactRow({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="flex items-center gap-3 text-body text-text-secondary hover:text-primary"
    >
      <span className="text-text-muted">{icon}</span>
      <span className="truncate">{label}</span>
    </a>
  )
}
