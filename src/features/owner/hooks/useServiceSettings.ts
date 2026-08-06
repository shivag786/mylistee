/**
 * TanStack Query hooks for owner service settings + dining tables (Phase 7.6).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  serviceSettingsService,
  type OwnerTable,
  type ServiceSettings,
  type ServiceSettingsInput,
  type TableInput,
} from '../services/serviceSettingsService'

const settingsKey = ['owner', 'service-settings'] as const
const tablesKey = ['owner', 'tables'] as const

export function useServiceSettings() {
  return useQuery<ServiceSettings>({
    queryKey: settingsKey,
    queryFn: () => serviceSettingsService.getSettings(),
  })
}

export function useUpdateServiceSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ServiceSettingsInput) => serviceSettingsService.updateSettings(input),
    onSuccess: (settings) => qc.setQueryData<ServiceSettings>(settingsKey, settings),
  })
}

export function useTables() {
  return useQuery<OwnerTable[]>({
    queryKey: tablesKey,
    queryFn: () => serviceSettingsService.listTables(),
  })
}

export function useCreateTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TableInput) => serviceSettingsService.createTable(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: tablesKey }),
  })
}

export function useUpdateTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TableInput }) =>
      serviceSettingsService.updateTable(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: tablesKey }),
  })
}

export function useDeleteTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => serviceSettingsService.deleteTable(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: tablesKey }),
  })
}
