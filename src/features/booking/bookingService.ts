import { apiClient } from '@/services/apiClient'
import type { Availability, Booking, BookingPage, BookingSettings, FloorArea, Occasion, RazorpaySession } from './bookingTypes'

export interface CreateBookingInput {
  date: string
  time: string
  guests: number
  tableIds: string[]
  occasion?: Occasion | null
  occasionNote?: string
  addons?: { name: string; qty: number }[]
  request?: string
  name: string
  phone: string
}

export const bookingService = {
  // Customer
  page: (slug: string) => apiClient.get<BookingPage>(`businesses/${slug}/booking`, { auth: false }),
  availability: (slug: string, date: string) =>
    apiClient.get<Availability>(`businesses/${slug}/booking/availability`, { query: { date }, auth: false }),
  create: (slug: string, input: CreateBookingInput) =>
    apiClient.post<{ booking: Booking; checkout: RazorpaySession | null }>(`businesses/${slug}/bookings`, input),
  pay: (id: string) => apiClient.post<{ checkout: RazorpaySession }>(`bookings/${id}/pay`),
  verify: (id: string, body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    apiClient.post<Booking>(`bookings/${id}/verify`, body),
  mine: () => apiClient.get<Booking[]>('bookings'),
  one: (id: string) => apiClient.get<Booking>(`bookings/${id}`),
  cancel: (id: string) => apiClient.post<Booking>(`bookings/${id}/cancel`),

  // Shop
  settings: () => apiClient.get<BookingSettings>('business/booking/settings'),
  saveSettings: (input: Partial<BookingSettings>) => apiClient.put<BookingSettings>('business/booking/settings', input),
  floor: () => apiClient.get<FloorArea[]>('business/booking/floor'),
  saveFloor: (areas: FloorArea[]) =>
    apiClient.put<FloorArea[]>('business/booking/floor', {
      areas: areas
        .filter((a) => a.kind !== 'unplaced')
        .map((a) => ({
          id: a.id,
          name: a.name,
          kind: a.kind,
          width: a.width,
          height: a.height,
          active: a.active,
          tables: a.tables.map((t) => ({
            id: t.id,
            label: t.label,
            seats: t.seats,
            shape: t.shape,
            x: t.x ?? 1,
            y: t.y ?? 1,
            rotation: t.rotation,
            tags: t.tags,
            bookable: t.bookable,
          })),
        })),
    }),
  dayBookings: (date: string) =>
    apiClient.get<{ date: string; items: Booking[]; pendingCount: number }>('business/bookings', { query: { date } }),
  addBooking: (input: Omit<CreateBookingInput, 'phone' | 'addons'> & { phone?: string; source: 'phone' | 'walkin' }) =>
    apiClient.post<Booking>('business/bookings', input),
  setStatus: (id: string, status: string, reason?: string) => apiClient.patch<Booking>(`business/bookings/${id}`, { status, reason }),
}
