import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ImageUploadField } from '@/components/forms/ImageUploadField'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { businessSchema, type BusinessSchema } from '@/features/owner/businessSchema'
import { useOwnerBusiness, useUpdateBusiness } from '@/features/owner/hooks/useOwner'
import {
  BasicsFields,
  ContactLocationFields,
  SocialsFields,
} from '@/features/owner/components/BusinessFields'
import { GalleryManager } from '@/features/owner/components/GalleryManager'
import type { OwnerBusiness } from '@/features/owner/types'

function toFormValues(b: OwnerBusiness): BusinessSchema {
  return {
    name: b.name,
    category: b.category?.id ?? '',
    description: b.description ?? '',
    phone: b.phone ?? '',
    email: b.email ?? '',
    website: b.website ?? '',
    address: b.address ?? '',
    latitude: b.latitude != null ? String(b.latitude) : '',
    longitude: b.longitude != null ? String(b.longitude) : '',
    openingTime: b.openingTime?.slice(0, 5) ?? '',
    closingTime: b.closingTime?.slice(0, 5) ?? '',
    facebook: b.facebook ?? '',
    instagram: b.instagram ?? '',
    whatsapp: b.whatsapp ?? '',
    gst: b.gst ?? '',
  }
}

export function OwnerProfilePage() {
  const { data: business, isLoading, isError, refetch } = useOwnerBusiness()

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner size={32} label="Loading profile" />
      </div>
    )
  }

  if (isError || !business) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  return <ProfileForm business={business} />
}

function ProfileForm({ business }: { business: OwnerBusiness }) {
  const update = useUpdateBusiness()
  const [logo, setLogo] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)

  const form = useForm<BusinessSchema>({
    resolver: zodResolver(businessSchema),
    defaultValues: toFormValues(business),
    mode: 'onTouched',
  })

  async function onSubmit(values: BusinessSchema) {
    try {
      await update.mutateAsync({
        ...values,
        ...(logo ? { logo } : {}),
        ...(cover ? { cover } : {}),
      })
      setLogo(null)
      setCover(null)
      toast.success('Business updated')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save your changes.')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-4">
      <h1 className="text-title font-bold text-foreground">Business profile</h1>

      <Link
        to={ROUTES.owner.subscription}
        className="block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Card interactive className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-premium-soft text-premium">
            <CreditCard className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-body font-medium text-foreground">Plan &amp; billing</span>
            <span className="block text-caption text-text-secondary">
              Manage your subscription and invoices
            </span>
          </span>
          <ChevronRight className="size-5 text-text-muted" aria-hidden />
        </Card>
      </Link>

      <Card className="space-y-4">
        <h2 className="text-body-lg font-semibold text-foreground">Basics</h2>
        <BasicsFields
          register={form.register}
          errors={form.formState.errors}
          category={form.watch('category')}
          onCategoryChange={(v) => form.setValue('category', v, { shouldValidate: true, shouldDirty: true })}
        />
      </Card>

      <Card className="grid gap-6 sm:grid-cols-2">
        <ImageUploadField label="Logo" aspect="square" value={logo} previewUrl={business.logoUrl} onChange={setLogo} />
        <ImageUploadField label="Cover image" aspect="cover" value={cover} previewUrl={business.coverUrl} onChange={setCover} />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-body-lg font-semibold text-foreground">Gallery</h2>
        <GalleryManager images={business.gallery} />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-body-lg font-semibold text-foreground">Contact & location</h2>
        <ContactLocationFields
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-body-lg font-semibold text-foreground">Social links</h2>
        <SocialsFields register={form.register} errors={form.formState.errors} />
      </Card>

      <div className="sticky bottom-[76px] z-10">
        <Button type="submit" fullWidth isLoading={update.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  )
}
