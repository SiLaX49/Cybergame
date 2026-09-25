import { Eye, Fish, Gamepad2, HeartHandshake, KeyRound, Newspaper, Users, Wifi } from '@lucide/vue'
import type { Component } from 'vue'
import type { Theme } from '@/content/schema'

export const ICONES_THEMES: Record<Theme['icone'], Component> = {
  Fish,
  KeyRound,
  Eye,
  Users,
  Gamepad2,
  HeartHandshake,
  Newspaper,
  Wifi,
}
