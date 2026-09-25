import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UpdatePrompt from '@/ui/UpdatePrompt.vue'
import { cliquer } from './helpers'
import { needRefresh, updateServiceWorker } from './pwa-register-stub'

describe('UpdatePrompt', () => {
  it('propose la mise à jour sans l’imposer', async () => {
    const w = mount(UpdatePrompt)
    expect(w.find('.maj').exists()).toBe(false)
    needRefresh.value = true
    await w.vm.$nextTick()
    expect(w.text()).toContain('Une nouvelle version du jeu est disponible.')
    await cliquer(w, 'Plus tard')
    expect(w.find('.maj').exists()).toBe(false)
    expect(updateServiceWorker).not.toHaveBeenCalled()
    needRefresh.value = true
    await w.vm.$nextTick()
    await cliquer(w, 'Recharger')
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
