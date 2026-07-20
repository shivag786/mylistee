import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Gift, PartyPopper } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from '@/components/a11y/VisuallyHidden'
import { ROUTES } from '@/constants/routes'
import type { WonReward } from '@/features/businesses/publicTypes'

interface RewardModalProps {
  reward: WonReward | null
  onClose: () => void
}

/** Celebratory reward reveal after a spin (document/phase/06 §Reward Popup). */
export function RewardModal({ reward, onClose }: RewardModalProps) {
  const navigate = useNavigate()
  const open = reward !== null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm overflow-hidden text-center">
        <VisuallyHidden>
          <DialogTitle>You won a reward</DialogTitle>
        </VisuallyHidden>

        {reward && (
          <div className="flex flex-col items-center gap-4 py-2">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="grid size-20 place-items-center rounded-full bg-premium-soft text-premium-foreground"
            >
              <Gift className="size-10" aria-hidden />
            </motion.div>

            <div className="space-y-1">
              <p className="flex items-center justify-center gap-2 text-caption font-medium uppercase tracking-wide text-primary">
                <PartyPopper className="size-4" aria-hidden /> You won
              </p>
              <h2 className="text-title font-bold text-foreground">
                {reward.rewardValue || reward.title}
              </h2>
              {reward.rewardValue && reward.title !== reward.rewardValue && (
                <p className="text-body text-text-secondary">{reward.title}</p>
              )}
            </div>

            <div className="w-full rounded-2xl border border-dashed border-border-strong bg-surface-muted px-4 py-3">
              <p className="text-small text-text-muted">Show this code to redeem</p>
              <p className="text-subtitle font-bold tracking-[0.2em] text-foreground">{reward.code}</p>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Button fullWidth onClick={() => navigate(ROUTES.wallet)}>
                View in wallet
              </Button>
              <Button fullWidth variant="ghost" onClick={onClose}>
                Keep exploring
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
