import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  // .claude/ : skills de design tiers (unslop), lintés par leurs auteurs, pas par ce projet.
  { ignores: ['dist/**', 'dev-dist/**', 'playwright-report/**', 'test-results/**', '.claude/**'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  // Le faux téléphone imite des noms d’écran courts (Telephone, Avatar, Bulle).
  { files: ['src/phone/**/*.vue'], rules: { 'vue/multi-word-component-names': 'off' } },
  skipFormatting,
)
