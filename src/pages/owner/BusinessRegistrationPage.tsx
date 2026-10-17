import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, PartyPopper, Plus, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/icons/Logo'
import { Spinner } from '@/components/feedback/Spinner'
import { Stepper } from '@/components/navigation/Stepper'
import { TextField } from '@/components/forms/TextField'
import { Confetti } from '@/components/motion/Confetti'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { LegalFooter } from '@/components/navigation/LegalFooter'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { fadeInUp } from '@/animations'
import { businessFormDefaults, businessSchema, type BusinessSchema } from '@/features/owner/businessSchema'
import { useOwnerBusiness, useRegisterBusiness } from '@/features/owner/hooks/useOwner'
import { useProductActions } from '@/features/owner/hooks/useProducts'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ShopLocationField } from '@/features/owner/components/BusinessFields'
import { CategorySelect } from '@/features/owner/components/CategorySelect'
import { ProductEssentials } from '@/features/owner/components/ProductEssentials'
import {
  pricing,
  validateEssentials,
  type ProductEssentialsErrors,
  type ProductEssentialsValue,
} from '@/features/owner/productEssentials'

const STEPS = ['Your shop', 'First product']

type Stage = 'shop' | 'welcome' | 'product'

const EMPTY_PRODUCT: ProductEssentialsValue = {
  image: null,
  name: '',
  price: '',
  discount: null,
  foodType: null,
  section: { id: null, name: null },
}

/**
 * Owner onboarding in two short steps. First the shop: name, category and a
 * one-tap address. Then a confetti welcome, and straight into adding a first
 * product (photo, name, price). Logo, cover, hours and socials are all set
 * later from the business profile.
 */
export function BusinessRegistrationPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: existing, isLoading } = useOwnerBusiness()
  const register = useRegisterBusiness()
  const { create } = useProductActions()

  const [stage, setStage] = useState<Stage>('shop')
  const [shopName, setShopName] = useState('')
  const [product, setProduct] = useState<ProductEssentialsValue>(EMPTY_PRODUCT)
  const [productErrors, setProductErrors] = useState<ProductEssentialsErrors>({})

  const form = useForm<BusinessSchema>({
    resolver: zodResolver(businessSchema),
    // The owner's account mobile doubles as the shop phone — never asked twice.
    defaultValues: { ...businessFormDefaults, phone: user?.phone ?? '' },
    mode: 'onTouched',
  })

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Loading" />
      </div>
    )
  }

  // Already registered → dashboard. Not mid-onboarding, though: registering
  // here is what makes `existing` appear.
  if (existing && stage === 'shop') {
    return <Navigate to={ROUTES.owner.dashboard} replace />
  }

  async function onSubmitShop(values: BusinessSchema) {
    try {
      const business = await register.mutateAsync({ ...values, logo: null, cover: null })
      setShopName(business.name)
      setStage('welcome')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create your shop.')
    }
  }

  async function saveProduct() {
    const found = validateEssentials(product)
    setProductErrors(found)
    if (Object.keys(found).length > 0) return
    try {
      const discount = product.discount && product.discount.value > 0 ? product.discount : null
      await create.mutateAsync({
        name: product.name.trim(),
        ...pricing(Number(product.price), discount),
        discount,
        foodType: product.foodType,
        categoryId: product.section.id,
        categoryName: product.section.name?.trim() || null,
        image: product.image,
      })
      toast.success('Your first product is live!')
      navigate(ROUTES.owner.dashboard, { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  const finish = () => navigate(ROUTES.owner.dashboard, { replace: true })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 bg-background px-5 py-8">
      <AnimatePresence mode="wait">
        {stage === 'shop' && (
          <motion.form
            key="shop"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onSubmit={form.handleSubmit(onSubmitShop)}
            className="flex flex-1 flex-col gap-6"
          >
            <Header title="Set up your shop" subtitle="Takes a minute. Add the rest anytime later." />
            <Stepper steps={STEPS} current={0} />

            <div className="flex-1 space-y-5">
              <TextField
                label="Shop name"
                placeholder="e.g. Sharma Sweets"
                autoFocus
                error={form.formState.errors.name?.message}
                {...form.register('name')}
              />
              <CategorySelect
                value={form.watch('category')}
                onChange={(v) => form.setValue('category', v, { shouldValidate: true, shouldTouch: true })}
                error={form.formState.errors.category?.message}
              />
              <ShopLocationField
                register={form.register}
                errors={form.formState.errors}
                setValue={form.setValue}
                watch={form.watch}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={register.isPending}
              leftIcon={<Store className="size-4" />}
            >
              Create my shop
            </Button>
          </motion.form>
        )}

        {stage === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
          >
            <Confetti count={90} />
            <motion.span
              initial={{ rotate: -20, scale: 0.4 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
              className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-primary to-gold text-white shadow-premium"
            >
              <PartyPopper className="size-11" aria-hidden />
            </motion.span>
            <div className="space-y-2">
              <h1 className="text-title font-bold text-foreground">Welcome to Listee!</h1>
              <p className="text-body-lg text-text-secondary">
                <span className="font-semibold text-foreground">{shopName}</span> is ready. Add your first product so
                customers have something to order.
              </p>
            </div>
            <div className="w-full space-y-2">
              <Button fullWidth size="lg" leftIcon={<Plus className="size-4" />} onClick={() => setStage('product')}>
                Add my first product
              </Button>
              <Button fullWidth variant="ghost" onClick={finish}>
                I'll do it later
              </Button>
            </div>
          </motion.div>
        )}

        {stage === 'product' && (
          <motion.div
            key="product"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-1 flex-col gap-6"
          >
            <Header title="Your first product" subtitle="Photo, name and price. Everything else is optional." />
            <Stepper steps={STEPS} current={1} />

            <div className="flex-1">
              <ProductEssentials
                value={product}
                onChange={(patch) => setProduct((p) => ({ ...p, ...patch }))}
                errors={productErrors}
              />
            </div>

            <div className="space-y-2">
              <Button
                fullWidth
                size="lg"
                isLoading={create.isPending}
                rightIcon={<ArrowRight className="size-4" />}
                onClick={() => void saveProduct()}
              >
                Add product & finish
              </Button>
              <Button fullWidth variant="ghost" onClick={finish} disabled={create.isPending}>
                Skip for now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LegalFooter className="w-full border-0 bg-transparent py-0" />
    </div>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Logo size={44} />
      <h1 className="text-title font-bold text-foreground">{title}</h1>
      <p className="text-caption text-text-secondary">{subtitle}</p>
    </div>
  )
}
