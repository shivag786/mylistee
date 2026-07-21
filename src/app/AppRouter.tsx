import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { lazyPage } from '@/app/lazyPage'
import { SuspenseOutlet } from '@/app/PageLoader'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { HomePage } from '@/pages/customer/HomePage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RequireAuth } from '@/features/auth/components/RequireAuth'
import { RequireRole } from '@/features/auth/components/RequireRole'
import { OwnerLayout } from '@/layouts/OwnerLayout'
import { OwnerEntry } from '@/pages/owner/OwnerEntry'
import { AdminLayout } from '@/layouts/AdminLayout'

// Code-split (Milestone 15): everything past the customer landing loads on demand,
// so the owner and admin apps never ship in the customer's first bundle.
const NearbyPage = lazyPage(() => import('@/pages/customer/NearbyPage'), 'NearbyPage')
const SearchPage = lazyPage(() => import('@/pages/customer/SearchPage'), 'SearchPage')
const BusinessProfilePage = lazyPage(() => import('@/pages/customer/BusinessProfilePage'), 'BusinessProfilePage')
const WalletPage = lazyPage(() => import('@/pages/customer/WalletPage'), 'WalletPage')
const NotificationsPage = lazyPage(() => import('@/pages/customer/NotificationsPage'), 'NotificationsPage')
const ProfilePage = lazyPage(() => import('@/pages/customer/ProfilePage'), 'ProfilePage')
const FavoritesPage = lazyPage(() => import('@/pages/customer/FavoritesPage'), 'FavoritesPage')

const BusinessRegistrationPage = lazyPage(() => import('@/pages/owner/BusinessRegistrationPage'), 'BusinessRegistrationPage')
const OwnerDashboardPage = lazyPage(() => import('@/pages/owner/OwnerDashboardPage'), 'OwnerDashboardPage')
const OffersPage = lazyPage(() => import('@/pages/owner/OffersPage'), 'OffersPage')
const LoyaltyPage = lazyPage(() => import('@/pages/owner/LoyaltyPage'), 'LoyaltyPage')
const AnalyticsPage = lazyPage(() => import('@/pages/owner/AnalyticsPage'), 'AnalyticsPage')
const OwnerReviewsPage = lazyPage(() => import('@/pages/owner/OwnerReviewsPage'), 'OwnerReviewsPage')
const SubscriptionPage = lazyPage(() => import('@/pages/owner/SubscriptionPage'), 'SubscriptionPage')
const RedeemPage = lazyPage(() => import('@/pages/owner/RedeemPage'), 'RedeemPage')
const QrPage = lazyPage(() => import('@/pages/owner/QrPage'), 'QrPage')
const OwnerProfilePage = lazyPage(() => import('@/pages/owner/OwnerProfilePage'), 'OwnerProfilePage')

const AdminDashboardPage = lazyPage(() => import('@/pages/admin/AdminDashboardPage'), 'AdminDashboardPage')
const AdminBusinessesPage = lazyPage(() => import('@/pages/admin/AdminBusinessesPage'), 'AdminBusinessesPage')
const AdminCustomersPage = lazyPage(() => import('@/pages/admin/AdminCustomersPage'), 'AdminCustomersPage')
const AdminOffersPage = lazyPage(() => import('@/pages/admin/AdminOffersPage'), 'AdminOffersPage')
const AdminReviewsPage = lazyPage(() => import('@/pages/admin/AdminReviewsPage'), 'AdminReviewsPage')
const AdminPlansPage = lazyPage(() => import('@/pages/admin/AdminPlansPage'), 'AdminPlansPage')
const AdminBroadcastPage = lazyPage(() => import('@/pages/admin/AdminBroadcastPage'), 'AdminBroadcastPage')
const AdminFeatureFlagsPage = lazyPage(() => import('@/pages/admin/AdminFeatureFlagsPage'), 'AdminFeatureFlagsPage')
const AdminCmsPage = lazyPage(() => import('@/pages/admin/AdminCmsPage'), 'AdminCmsPage')
const AdminFraudPage = lazyPage(() => import('@/pages/admin/AdminFraudPage'), 'AdminFraudPage')
const AdminAuditLogsPage = lazyPage(() => import('@/pages/admin/AdminAuditLogsPage'), 'AdminAuditLogsPage')
const AdminReportsPage = lazyPage(() => import('@/pages/admin/AdminReportsPage'), 'AdminReportsPage')
const AdminSettingsPage = lazyPage(() => import('@/pages/admin/AdminSettingsPage'), 'AdminSettingsPage')

const OwnerSignupPage = lazyPage(() => import('@/pages/auth/OwnerSignupPage'), 'OwnerSignupPage')
const OwnerLoginPage = lazyPage(() => import('@/pages/auth/OwnerLoginPage'), 'OwnerLoginPage')
const UiShowcasePage = lazyPage(() => import('@/pages/dev/UiShowcasePage'), 'UiShowcasePage')

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route
        path={ROUTES.ownerLogin}
        element={
          <SuspenseOutlet>
            <OwnerLoginPage />
          </SuspenseOutlet>
        }
      />
      {/* Admins share the single staff sign-in link with business owners. */}
      <Route path={ROUTES.adminLogin} element={<Navigate to={ROUTES.ownerLogin} replace />} />
      <Route
        path={ROUTES.ownerSignup}
        element={
          <SuspenseOutlet>
            <OwnerSignupPage />
          </SuspenseOutlet>
        }
      />
      {import.meta.env.DEV && <Route path="/dev/ui" element={<UiShowcasePage />} />}

      {/* Customer app shell */}
      <Route element={<CustomerLayout />}>
        {/* Public browsing (no sign-in required) */}
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.nearby} element={<NearbyPage />} />
        <Route path={ROUTES.search} element={<SearchPage />} />
        <Route path={ROUTES.businessProfile()} element={<BusinessProfilePage />} />

        {/* Requires an authenticated customer */}
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.wallet} element={<WalletPage />} />
          <Route path={ROUTES.notifications} element={<NotificationsPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
          <Route path={ROUTES.favorites} element={<FavoritesPage />} />
        </Route>
      </Route>

      {/* Business owner app (document/phase/07) */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allow="business_owner" />}>
          <Route path={ROUTES.owner.root} element={<OwnerEntry />} />
          <Route path={ROUTES.owner.register} element={<BusinessRegistrationPage />} />
          <Route element={<OwnerLayout />}>
            <Route path={ROUTES.owner.dashboard} element={<OwnerDashboardPage />} />
            <Route path={ROUTES.owner.offers} element={<OffersPage />} />
            <Route path={ROUTES.owner.loyalty} element={<LoyaltyPage />} />
            <Route path={ROUTES.owner.analytics} element={<AnalyticsPage />} />
            <Route path={ROUTES.owner.reviews} element={<OwnerReviewsPage />} />
            <Route path={ROUTES.owner.subscription} element={<SubscriptionPage />} />
            <Route path={ROUTES.owner.redeem} element={<RedeemPage />} />
            <Route path={ROUTES.owner.qr} element={<QrPage />} />
            <Route path={ROUTES.owner.profile} element={<OwnerProfilePage />} />
          </Route>
        </Route>
      </Route>

      {/* Super Admin panel (document/phase/14) — role:admin */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allow="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.admin.root} element={<AdminDashboardPage />} />
            <Route path={ROUTES.admin.dashboard} element={<AdminDashboardPage />} />
            <Route path={ROUTES.admin.businesses} element={<AdminBusinessesPage />} />
            <Route path={ROUTES.admin.customers} element={<AdminCustomersPage />} />
            <Route path={ROUTES.admin.offers} element={<AdminOffersPage />} />
            <Route path={ROUTES.admin.reviews} element={<AdminReviewsPage />} />
            <Route path={ROUTES.admin.plans} element={<AdminPlansPage />} />
            <Route path={ROUTES.admin.broadcast} element={<AdminBroadcastPage />} />
            <Route path={ROUTES.admin.featureFlags} element={<AdminFeatureFlagsPage />} />
            <Route path={ROUTES.admin.cms} element={<AdminCmsPage />} />
            <Route path={ROUTES.admin.fraud} element={<AdminFraudPage />} />
            <Route path={ROUTES.admin.auditLogs} element={<AdminAuditLogsPage />} />
            <Route path={ROUTES.admin.reports} element={<AdminReportsPage />} />
            <Route path={ROUTES.admin.settings} element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path={ROUTES.notFound} element={<NotFoundPage />} />
    </Routes>
  )
}
