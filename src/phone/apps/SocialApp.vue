<script setup lang="ts">
import { BadgeCheck, Image, MessageCircle, Share2, ThumbsDown, ThumbsUp } from '@lucide/vue'
import { computed } from 'vue'
import type { Ecran } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import { APPLIS } from '../applis'
import Avatar from '../parts/Avatar.vue'
import TexteRiche from '../parts/TexteRiche.vue'
import { texteStats } from '../stats'

const props = defineProps<{ ecran: Extract<Ecran, { app: 'social' }> }>()
const t = useTexte()
/** StreamTube : « S’abonner » et pilule d’actions, inertes et décoratifs. */
const streamtube = computed(() => APPLIS[props.ecran.appNom]?.marque === 'streamtube')
</script>

<template>
  <article class="publication">
    <div class="compte">
      <Avatar :nom="ecran.contact" />
      <p class="identite">
        <span>
          <strong><TexteRiche :texte="ecran.contact" sans-liens /></strong>
          <span v-if="ecran.certifie" class="certifie"><BadgeCheck aria-hidden="true" :size="16" /><span class="visually-hidden"> (compte certifié)</span></span>
        </span>
        <span v-if="ecran.abonnes" class="doux"><TexteRiche :texte="`${ecran.abonnes} abonnés`" sans-liens /></span>
        <span v-if="ecran.bio" class="doux"><TexteRiche :texte="ecran.bio" sans-liens /></span>
      </p>
      <span v-if="streamtube" class="abonner" aria-hidden="true">S’abonner</span>
    </div>
    <p v-for="(m, i) in ecran.messages" :key="i" class="texte"><TexteRiche :texte="t(m.texte, m.texteSimple)" /></p>
    <p v-if="ecran.media" class="media">
      <Image aria-hidden="true" :size="20" />
      <span><TexteRiche :texte="t(ecran.media.description, ecran.media.descriptionSimple)" sans-liens /></span>
    </p>
    <p v-if="ecran.stats" class="stats">{{ texteStats(ecran.stats) }}</p>
    <p v-if="streamtube" class="pilule" aria-hidden="true">
      <span><ThumbsUp :size="18" /><ThumbsDown :size="18" /></span><span><MessageCircle :size="18" /></span><span><Share2 :size="18" /></span>
    </p>
    <template v-if="ecran.commentaires">
      <p class="visually-hidden">Commentaires</p>
      <ol class="commentaires">
        <li v-for="(c, i) in ecran.commentaires" :key="i"><strong>{{ c.de }}</strong> <TexteRiche :texte="t(c.texte, c.texteSimple)" /></li>
      </ol>
    </template>
  </article>
</template>

<style scoped>
.compte { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.6rem; }
.identite { flex: 1 1 8em; display: flex; flex-direction: column; margin: 0; min-width: 0; overflow-wrap: anywhere; }
.certifie { color: var(--tel-accent); vertical-align: middle; }
.doux, .stats { font-size: 0.85em; color: var(--tel-doux); }
.texte { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
.media svg { flex: none; }
.media { display: flex; gap: 0.5rem; align-items: center; margin: 0 0 0.6rem; padding: 1.25rem 0.75rem; border-radius: 12px; background: var(--tel-recu); font-style: italic; }
.abonner { flex: none; padding: 0.35rem 0.9rem; border-radius: 999px; background: var(--tel-texte); color: var(--tel-fond); font-weight: 700; }
/* Pilule d’actions : j’aime / je n’aime pas, commentaires, partages, séparés par un trait. */
.pilule { display: inline-flex; margin: 0 0 0.6rem; border-radius: 999px; background: var(--tel-recu); }
.pilule > span { display: inline-flex; gap: 0.6rem; padding: 0.4rem 0.8rem; }
.pilule > span + span { border-left: 1px solid var(--tel-bord); }
.commentaires { list-style: none; margin: 0.5rem 0 0; padding: 0.5rem 0 0; border-top: 1px solid var(--tel-bord); display: flex; flex-direction: column; gap: 0.4rem; overflow-wrap: anywhere; }
</style>
