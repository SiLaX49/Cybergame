<script setup lang="ts">
import type { DessinObjet } from './dessins'

/**
 * Dessin d’un objet à collectionner, décoratif : le nom de l’objet est toujours écrit à côté.
 * Les attributs (x, y, width, height, class) passent sur le <svg>, ce qui permet de l’imbriquer dans une scène SVG.
 */
withDefaults(defineProps<{ dessin: DessinObjet; taille?: number | string; terne?: boolean }>(), { taille: 32, terne: false })
</script>

<template>
  <svg
    class="objet-dessin"
    :class="{ terne }"
    :data-dessin="dessin"
    viewBox="0 0 48 48"
    :width="taille"
    :height="taille"
    aria-hidden="true"
    focusable="false"
  >
    <ellipse cx="24" cy="44" rx="13" ry="2.5" fill="#000000" opacity="0.12" />
    <g stroke="#1b1b2e" stroke-opacity="0.3" stroke-width="1" stroke-linejoin="round">
      <template v-if="dessin === 'bouclier'">
        <path d="M24 5 L38 10 V22 Q38 34 24 41 Q10 34 10 22 V10 Z" fill="#2f7de1" />
        <path d="M24 5 L38 10 V22 Q38 34 24 41 Z" fill="#1d4f9e" stroke="none" />
        <path d="M17.5 22.5 l4.5 4.5 l9 -10" fill="none" stroke="#ffffff" stroke-opacity="1" stroke-width="3.2" stroke-linecap="round" />
      </template>

      <template v-else-if="dessin === 'coffre-fort'">
        <rect x="8" y="8" width="32" height="30" rx="4" fill="#7d7f86" />
        <rect x="12" y="12" width="24" height="22" rx="2.5" fill="#b8c4cf" />
        <circle cx="24" cy="23" r="6.5" fill="#4a4d55" />
        <circle cx="24" cy="23" r="2.6" fill="#f5b72e" />
        <path d="M24 16.5 v2.5 M30.5 23 h-2.5 M24 29.5 v-2.5 M17.5 23 h2.5" stroke="#f5b72e" stroke-opacity="1" stroke-width="1.6" stroke-linecap="round" />
        <rect x="11" y="38" width="6" height="3" rx="1" fill="#4a4d55" />
        <rect x="31" y="38" width="6" height="3" rx="1" fill="#4a4d55" />
      </template>

      <template v-else-if="dessin === 'cape'">
        <path d="M24 5 Q14 6 13 19 L8 39 Q24 44 40 39 L35 19 Q34 6 24 5 Z" fill="#3f6fb5" />
        <path d="M24 5 Q34 6 35 19 L40 39 Q32 41.5 24 42 Z" fill="#2f5591" stroke="none" />
        <ellipse cx="24" cy="18" rx="6.5" ry="7.5" fill="#1b1b2e" opacity="0.85" />
        <path d="M14 31 l1.2 2.6 l2.6 1.2 l-2.6 1.2 l-1.2 2.6 l-1.2 -2.6 l-2.6 -1.2 l2.6 -1.2 z M32 27 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z" fill="#ffffff" stroke="none" opacity="0.85" />
      </template>

      <template v-else-if="dessin === 'trophee'">
        <path d="M14 11 H9 Q8 21 16 22 M34 11 H39 Q40 21 32 22" fill="none" stroke="#d99a14" stroke-opacity="1" stroke-width="3" stroke-linecap="round" />
        <path d="M14 7 H34 V17 Q34 28 24 29 Q14 28 14 17 Z" fill="#f5b72e" />
        <rect x="17.5" y="10" width="3" height="12" rx="1.5" fill="#ffffff" stroke="none" opacity="0.5" />
        <rect x="21.5" y="29" width="5" height="6" fill="#d99a14" />
        <rect x="15" y="35" width="18" height="6" rx="2" fill="#8a5a00" />
      </template>

      <template v-else-if="dessin === 'loupe'">
        <path d="M30 30 L40 40" stroke="#8a5a00" stroke-opacity="1" stroke-width="6" stroke-linecap="round" />
        <circle cx="21" cy="21" r="12" fill="#cfe8ff" stroke="#4a4d55" stroke-opacity="1" stroke-width="4" />
        <path d="M14 19 Q15.5 13.5 21 12.5" fill="none" stroke="#ffffff" stroke-opacity="1" stroke-width="2.5" stroke-linecap="round" />
      </template>

      <template v-else-if="dessin === 'antenne'">
        <path d="M17 10 Q13 15 17 20 M31 10 Q35 15 31 20 M12 6 Q5 15 12 24 M36 6 Q43 15 36 24" fill="none" stroke="#1971c2" stroke-opacity="1" stroke-width="2.4" stroke-linecap="round" />
        <path d="M24 17 L16 42 M24 17 L32 42 M19.5 31 H28.5 M18 36.5 H30" fill="none" stroke="#6f7c88" stroke-opacity="1" stroke-width="3" stroke-linecap="round" />
        <circle cx="24" cy="15" r="4" fill="#c9504a" />
      </template>

      <template v-else-if="dessin === 'toque'">
        <path d="M12 20 V29 Q24 35 36 29 V20 L24 25 Z" fill="#5a66a8" />
        <polygon points="24,8 44,16 24,24 4,16" fill="#3f4a85" />
        <path d="M24 16 L38 18 V29" fill="none" stroke="#f5b72e" stroke-opacity="1" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="38" cy="31" r="2.8" fill="#f5b72e" />
      </template>

      <template v-else-if="dessin === 'chapeau'">
        <ellipse cx="24" cy="33" rx="20" ry="5.5" fill="#8a6a45" />
        <path d="M12 32 Q11 14 24 13 Q37 14 36 32 Z" fill="#a77b52" />
        <rect x="12" y="26" width="24" height="4.5" fill="#5c3d22" />
        <path d="M19.5 15 Q24 19.5 28.5 15" fill="none" stroke="#6b4a2b" stroke-opacity="1" stroke-width="1.6" stroke-linecap="round" />
      </template>

      <template v-else-if="dessin === 'cle'">
        <g transform="rotate(35 24 24)">
          <circle cx="13" cy="24" r="9" fill="#f5b72e" />
          <circle cx="13" cy="24" r="3.5" fill="#fff6db" />
          <rect x="20.5" y="21.5" width="22" height="5" rx="2" fill="#f5b72e" />
          <rect x="33" y="26" width="3" height="5" fill="#d99a14" />
          <rect x="38.5" y="26" width="3" height="7" fill="#d99a14" />
        </g>
      </template>

      <template v-else-if="dessin === 'boite-outils'">
        <path d="M18 14 V9.5 H30 V14" fill="none" stroke="#4a4d55" stroke-opacity="1" stroke-width="3" stroke-linejoin="round" />
        <rect x="6" y="14" width="36" height="25" rx="3" fill="#c9504a" />
        <rect x="6" y="14" width="36" height="8" rx="3" fill="#a63d38" />
        <rect x="21" y="19.5" width="6" height="5.5" rx="1" fill="#f5b72e" />
      </template>

      <template v-else-if="dessin === 'medaille'">
        <polygon points="15,4 22,4 28,20 21,22" fill="#4a5ff5" />
        <polygon points="33,4 26,4 20,20 27,22" fill="#c9504a" />
        <circle cx="24" cy="30" r="11" fill="#f5b72e" stroke="#d99a14" stroke-opacity="1" stroke-width="2" />
        <polygon points="24,24.5 25.6,28.2 29.5,28.3 26.5,30.8 27.5,34.5 24,32.4 20.5,34.5 21.5,30.8 18.5,28.3 22.4,28.2" fill="#fff6db" stroke="none" />
      </template>

      <template v-else-if="dessin === 'cadenas'">
        <path d="M15 22 V15 Q15 6 24 6 Q33 6 33 15 V22" fill="none" stroke="#6f7c88" stroke-opacity="1" stroke-width="4.5" />
        <rect x="10" y="20" width="28" height="21" rx="4" fill="#f5b72e" />
        <circle cx="24" cy="28.5" r="3" fill="#8a5a00" stroke="none" />
        <rect x="22.8" y="29" width="2.4" height="6.5" rx="1" fill="#8a5a00" stroke="none" />
      </template>

      <template v-else-if="dessin === 'eclair'">
        <polygon points="28,4 10,27 22,27 18,44 38,19 26,19 31,4" fill="#ffd43b" stroke="#d99a14" stroke-opacity="1" stroke-width="1.5" />
      </template>

      <template v-else-if="dessin === 'hulotte'">
        <polygon points="12,15 14.5,5 20,13" fill="#d99a14" />
        <polygon points="36,15 33.5,5 28,13" fill="#d99a14" />
        <ellipse cx="24" cy="27" rx="13" ry="15" fill="#f5b72e" />
        <ellipse cx="24" cy="31" rx="8" ry="9.5" fill="#fff1c2" stroke="none" />
        <circle cx="19" cy="21" r="5" fill="#ffffff" />
        <circle cx="29" cy="21" r="5" fill="#ffffff" />
        <circle cx="19.5" cy="21.5" r="2.3" fill="#0b1020" stroke="none" />
        <circle cx="28.5" cy="21.5" r="2.3" fill="#0b1020" stroke="none" />
        <polygon points="22.3,25 25.7,25 24,29" fill="#c4480a" stroke="none" />
      </template>

      <template v-else-if="dessin === 'fusee'">
        <path d="M19 31 Q24 46 29 31 Z" fill="#ff922b" stroke="none" />
        <path d="M21.5 31 Q24 40 26.5 31 Z" fill="#ffd43b" stroke="none" />
        <path d="M16 23 L9 34 L16 32 Z M32 23 L39 34 L32 32 Z" fill="#c9504a" />
        <path d="M24 4 Q33 12 32 31 H16 Q15 12 24 4 Z" fill="#e9edf5" />
        <path d="M24 4 Q29 7.5 30.6 12 H17.4 Q19 7.5 24 4 Z" fill="#c9504a" />
        <circle cx="24" cy="19" r="4.5" fill="#4dabf7" stroke="#3a4366" stroke-opacity="1" stroke-width="2" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.objet-dessin { display: inline-block; flex: none; vertical-align: middle; overflow: visible; }
/* Pas encore gagné : silhouette pâle, l’état est toujours écrit en texte à côté. */
.terne { filter: grayscale(1); opacity: 0.55; }
</style>
