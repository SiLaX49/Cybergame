<script setup lang="ts">
import { Paperclip } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import Avatar from '../parts/Avatar.vue'
import TexteRiche from '../parts/TexteRiche.vue'

defineProps<{ ecran: Extract<Ecran, { app: 'mail' }> }>()
const t = useTexte()
</script>

<template>
  <div class="mail">
    <p v-if="ecran.sujet" class="sujet"><span class="visually-hidden">Objet : </span>{{ ecran.sujet }}</p>
    <div class="expediteur">
      <Avatar :nom="ecran.contact" />
      <p class="identite">
        <span><span class="visually-hidden">De : </span><strong>{{ ecran.contact }}</strong></span>
        <span v-if="ecran.adresse" class="adresse">{{ ecran.adresse }}</span>
      </p>
      <span v-if="ecran.messages[0]?.heure" class="heure">{{ ecran.messages[0].heure }}</span>
    </div>
    <p v-for="(m, i) in ecran.messages" :key="i" class="corps"><TexteRiche :texte="t(m.texte, m.texteSimple)" /></p>
    <p v-if="ecran.pieceJointe" class="piece-jointe">
      <Paperclip aria-hidden="true" :size="16" />
      <span class="visually-hidden">Pièce jointe : </span>{{ ecran.pieceJointe.nom }}
    </p>
  </div>
</template>

<style scoped>
.sujet { margin: 0 0 0.75rem; font-size: 1.15em; font-weight: 700; overflow-wrap: anywhere; }
.expediteur { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.identite { display: flex; flex-direction: column; margin: 0; min-width: 0; flex: 1; overflow-wrap: anywhere; }
.adresse, .heure { font-size: 0.8em; color: var(--tel-doux); }
.corps { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
.piece-jointe { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.7rem; border: 1px solid var(--tel-bord); border-radius: 10px; overflow-wrap: anywhere; }
</style>
