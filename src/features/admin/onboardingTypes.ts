/** Who joined lately — extra blocks on GET /admin/dashboard. */
export interface RecentCustomer {
  id: string
  name: string
  phone: string | null
  email: string | null
  /** How they signed up: 'google', 'phone', … */
  via: string
  status: string
  /** The shop that brought them in (first order, else first visit). */
  firstShop: { name: string; slug: string } | null
  orders: number
  joinedAt: string | null
}

export interface RecentBusiness {
  id: string
  name: string
  slug: string
  city: string | null
  category: string | null
  owner: string | null
  ownerPhone: string | null
  status: string
  plan: string | null
  joinedAt: string | null
}

export interface DashboardOnboarding {
  stats: {
    newCustomersToday?: number
    newCustomersWeek?: number
    newBusinessesToday?: number
    newBusinessesWeek?: number
    ordersToday?: number
  }
  recentCustomers?: RecentCustomer[]
  recentBusinesses?: RecentBusiness[]
}
