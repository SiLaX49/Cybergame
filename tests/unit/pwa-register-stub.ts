import { ref } from 'vue'
import { vi } from 'vitest'

export const needRefresh = ref(false)
export const offlineReady = ref(false)
export const updateServiceWorker = vi.fn(async () => {})

export function useRegisterSW() {
  return { needRefresh, offlineReady, updateServiceWorker }
}
