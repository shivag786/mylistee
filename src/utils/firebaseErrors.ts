/**
 * Maps raw Firebase Auth error codes to warm, human messages
 * (document-00 §Error Messages). UI never shows a Firebase code directly.
 */
import { FirebaseError } from 'firebase/app'
import { MESSAGES } from '@/constants/messages'

/** Firebase codes we deliberately treat as "user cancelled" (no error UI). */
const SILENT_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
])

const CODE_MESSAGES: Record<string, string> = {
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups and try again.',
  'auth/network-request-failed': MESSAGES.errors.network,
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/account-exists-with-different-credential':
    'This email is already linked to another sign-in method.',
  'auth/unauthorized-domain': 'Sign-in is not enabled for this site yet.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled. Please try again later.',
  // Storage is off (private browsing, "block all cookies", a locked-down
  // WebView). Firebase cannot hold the sign-in state, so no amount of retrying
  // in place will help — the message has to say what to change.
  'auth/web-storage-unsupported':
    'Your browser is blocking the storage sign-in needs. Turn off private browsing or allow cookies for this site, then try again.',
  // Reported by in-app browsers (Instagram, Facebook, Gmail) that cannot open
  // a sign-in window at all.
  'auth/operation-not-supported-in-this-environment':
    'This in-app browser cannot complete Google sign-in. Please open Listee in Chrome or Safari.',
  'auth/timeout': 'Sign-in timed out. Please try again.',
  'auth/internal-error': 'Sign-in could not be completed here. Please try again, or open Listee in Chrome or Safari.',
}

/** True when the failure is just the user closing/cancelling the popup. */
export function isCancelledSignIn(error: unknown): boolean {
  return error instanceof FirebaseError && SILENT_CODES.has(error.code)
}

/** A friendly, user-facing message for any Firebase (or unknown) auth error. */
export function firebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return CODE_MESSAGES[error.code] ?? MESSAGES.errors.login
  }
  return MESSAGES.errors.login
}
