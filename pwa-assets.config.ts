import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

/**
 * PWA icon/splash generation from the brand mark (document/phase/11 §App Icons,
 * §Splash Screen). Run with `npm run generate-pwa-assets`. The maskable variant
 * is padded onto the brand red so the icon fills the safe zone on Android.
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.3,
      resizeOptions: { background: '#E23744' },
    },
    apple: {
      sizes: [180],
      padding: 0.3,
      resizeOptions: { background: '#E23744' },
    },
  },
  images: ['public/logo.svg'],
})
