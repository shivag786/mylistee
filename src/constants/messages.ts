/**
 * User-facing copy. Brand voice = simple, warm, human (document-00 §Brand
 * Voice / §Error Messages). Keep all customer-visible strings here so tone
 * stays consistent and localization is possible later.
 */
export const MESSAGES = {
  errors: {
    generic: "We couldn't complete that. Please try again.",
    network: "You're offline. Please check your connection.",
    login: "Google login couldn't be completed. Please try again.",
    notFound: "We couldn't find that page.",
    qrInvalid: "This QR code isn't valid. Please try scanning again.",
    offerExpired: 'This offer has ended.',
    spinLimit: "You've already spun here today. Come back tomorrow!",
  },
  success: {
    rewardAdded: 'Reward added to your wallet!',
    walletUpdated: 'Wallet updated',
    offerSaved: 'Offer saved',
    profileUpdated: 'Profile updated',
    welcomeBack: 'Welcome back!',
    signedIn: "You're signed in",
  },
  empty: {
    wallet: {
      title: 'No rewards yet',
      description: 'Visit a nearby shop and spin to win your first reward.',
      action: 'Explore nearby',
    },
    nearby: {
      title: 'No businesses found',
      description: "We couldn't find places around you right now. Try again soon.",
      action: 'Retry',
    },
    search: {
      title: 'No results',
      description: 'Try a different name, category, or area.',
      action: 'Clear search',
    },
    favorites: {
      title: 'Nothing saved yet',
      description: 'Tap the heart on a business to save it here.',
      action: 'Explore nearby',
    },
    notifications: {
      title: "You're all caught up",
      description: 'New offers and reward updates will show up here.',
    },
  },
  cta: {
    spinNow: 'Spin Now',
    signInGoogle: 'Continue with Google',
    unlockSpin: "Sign in with Google to unlock today's reward.",
    useReward: 'Use Reward',
    visitNearby: 'Visit Nearby Shops',
  },
} as const
