import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/icons/Logo'
import { Spinner } from '@/components/feedback/Spinner'
import { Stepper } from '@/components/navigation/Stepper'
import { ImageUploadField } from '@/components/forms/ImageUploadField'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { fadeInUp } from '@/animations'
import {
  businessFormDefaults,
  businessSchema,
  wizardStepFields,
  type BusinessSchema,
} from '@/features/owner/businessSchema'
import { useOwnerBusiness, useRegisterBusiness } from '@/features/owner/hooks/useOwner'
import {
  BasicsFields,
  ContactLocationFields,
  SocialsFields,
} from '@/features/owner/components/BusinessFields'

const STEPS = ['Basics', 'Contact', 'Media', 'Finish']

export function BusinessRegistrationPage() {
  const navigate = useNavigate()
  const { data: existing, isLoading } = useOwnerBusiness()
  const register = useRegisterBusiness()

  const [step, setStep] = useState(0)
  const [logo, setLogo] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)

  const form = useForm<BusinessSchema>({
    resolver: zodResolver(businessSchema),
    defaultValues: businessFormDefaults,
    mode: 'onTouched',
  })

  // Already registered → straight to the dashboard.
  if (!isLoading && existing) {
    navigate(ROUTES.owner.dashboard, { replace: true })
    return null
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Loading" />
      </div>
    )
  }

  const isLast = step === STEPS.length - 1

  async function next() {
    const valid = await form.trigger(wizardStepFields[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function onSubmit(values: BusinessSchema) {
    try {
      await register.mutateAsync({ ...values, logo, cover })
      toast.success('Business created! Welcome to Listee.')
      navigate(ROUTES.owner.dashboard, { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create your business.')
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 bg-background px-5 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo size={44} />
        <h1 className="text-title font-bold text-foreground">Set up your business</h1>
        <p className="text-caption text-text-secondary">Takes about 3 minutes. You can edit anything later.</p>
      </div>

      <Stepper steps={STEPS} current={step} />

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={step} variants={fadeInUp} initial="hidden" animate="visible" exit="hidden">
              {step === 0 && (
                <BasicsFields
                  register={form.register}
                  errors={form.formState.errors}
                  category={form.watch('category')}
                  onCategoryChange={(v) =>
                    form.setValue('category', v, { shouldValidate: true, shouldTouch: true })
                  }
                />
              )}
              {step === 1 && (
                <ContactLocationFields register={form.register} errors={form.formState.errors} />
              )}
              {step === 2 && (
                <div className="space-y-6">
                  <ImageUploadField
                    label="Logo"
                    aspect="square"
                    value={logo}
                    onChange={setLogo}
                    hint="Square image works best (PNG, JPG or WebP)."
                  />
                  <ImageUploadField
                    label="Cover image"
                    aspect="cover"
                    value={cover}
                    onChange={setCover}
                    hint="Shown at the top of your public profile."
                  />
                </div>
              )}
              {step === 3 && (
                <SocialsFields register={form.register} errors={form.formState.errors} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              size="md"
              leftIcon={<ArrowLeft className="size-4" />}
              onClick={() => setStep((s) => s - 1)}
              disabled={register.isPending}
            >
              Back
            </Button>
          )}
          {isLast ? (
            <Button
              type="submit"
              fullWidth
              size="md"
              isLoading={register.isPending}
              leftIcon={<Store className="size-4" />}
            >
              Create business
            </Button>
          ) : (
            <Button
              type="button"
              fullWidth
              size="md"
              rightIcon={<ArrowRight className="size-4" />}
              onClick={() => void next()}
            >
              Continue
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
