<script setup lang="ts">
import { BadgeCheck, Image } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import Avatar from '../parts/Avatar.vue'
import TexteRiche from '../parts/TexteRiche.vue'
import { texteStats } from '../stats'

defineProps<{ ecran: Extract<Ecran, { app: 'social' }> }>()
const t = useTexte()
</script>

<template>
  <article class="publication">
    <div class="compte">
      <Avatar :nom="ecran.contact" />
      <p class="identite">
        <span>
          <strong>{{ ecran.contact }}</strong>
          <span v-if="ecran.certifie" class="certifie"><BadgeCheck aria-hidden="true" :size="16" /><span class="visually-hidden"> (compte certifié)</span></span>
        </span>
        <span v-if="ecran.abonnes" class="doux">{{ ecran.abonnes }} abonnés</span>
        <span v-if="ecran.bio" class="doux">{{ ecran.bio }}</span>
      </p>
    </div>
    <p v-for="(m, i) in ecran.messages" :key="i" class="texte"><TexteRiche :texte="t(m.texte, m.texteSimple)" /></p>
    <p v-if="ecran.media" class="media">
      <Image aria-hidden="true" :size="20" />
      <span>{{ t(ecran.media.description, ecran.media.descriptionSimple) }}</span>
    </p>
    <p v-if="ecran.stats" class="stats">{{ texteStats(ecran.stats) }}</p>
    <template v-if="ecran.commentaires">
      <p class="visually-hidden">Commentaires</p>
      <ol class="commentaires">
        <li v-for="(c, i) in ecran.commentaires" :key="i"><strong>{{ c.de }}</strong> <TexteRiche :texte="t(c.texte, c.texteSimple)" /></li>
      </ol>
    </template>
  </article>
</template>

<style scoped>
.compte { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.6rem; }
.identite { display: flex; flex-direction: column; margin: 0; min-width: 0; overflow-wrap: anywhere; }
.certifie { color: var(--tel-accent); vertical-align: middle; }
.doux, .stats { font-size: 0.85em; color: var(--tel-doux); }
.texte { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
.media svg { flex: none; }
.media { display: flex; gap: 0.5rem; align-items: center; margin: 0 0 0.6rem; padding: 1.25rem 0.75rem; border-radius: 12px; background: var(--tel-recu); font-style: italic; }
.commentaires { list-style: none; margin: 0.5rem 0 0; padding: 0.5rem 0 0; border-top: 1px solid var(--tel-bord); display: flex; flex-direction: column; gap: 0.4rem; overflow-wrap: anywhere; }
</style>
