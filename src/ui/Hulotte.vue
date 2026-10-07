<!-- eslint-disable vue/multi-word-component-names -- nom imposé : « Hulotte » est le nom de la mascotte -->
<script setup lang="ts">
import type { ExpressionHulotte } from './hulotte'

withDefaults(defineProps<{ expression?: ExpressionHulotte; taille?: number }>(), {
  expression: 'accueil',
  taille: 96,
})
</script>

<template>
  <svg
    class="hulotte"
    :data-expression="expression"
    :width="taille"
    :height="taille"
    viewBox="0 0 64 64"
    aria-hidden="true"
    focusable="false"
  >
    <!-- aigrettes -->
    <path class="h-corps" d="M13 12 L23 21 L15 25 Z M51 12 L41 21 L49 25 Z" />
    <!-- ailes, selon l’expression -->
    <g v-if="expression === 'accueil'" class="h-corps">
      <path d="M12 38 Q2 26 7 16 Q13 27 16 34 Z" />
      <path d="M52 38 Q62 26 57 16 Q51 27 48 34 Z" />
    </g>
    <g v-else-if="expression === 'encourage'" class="h-corps">
      <path d="M12 44 Q6 40 9 32 Q13 38 15 40 Z" />
      <path d="M52 38 Q62 26 57 16 Q51 27 48 34 Z" />
    </g>
    <g v-else class="h-corps">
      <path d="M12 44 Q6 40 9 32 Q13 38 15 40 Z" />
      <path d="M52 44 Q58 40 55 32 Q51 38 49 40 Z" />
    </g>
    <!-- corps et ventre -->
    <ellipse class="h-corps" cx="32" cy="37" rx="21" ry="23" />
    <ellipse class="h-ventre" cx="32" cy="46" rx="12.5" ry="11.5" />
    <path class="h-plume" d="M27 44 q2 2 4 0 M33 44 q2 2 4 0 M30 49 q2 2 4 0" />
    <!-- yeux -->
    <circle class="h-oeil" cx="23" cy="29" r="8.5" />
    <circle class="h-oeil" cx="41" cy="29" r="8.5" />
    <template v-if="expression === 'bravo'">
      <path class="h-trait" d="M18.5 30 Q23 25 27.5 30 M36.5 30 Q41 25 45.5 30" />
    </template>
    <template v-else-if="expression === 'douce'">
      <path class="h-trait" d="M18.5 29 Q23 33 27.5 29 M36.5 29 Q41 33 45.5 29" />
    </template>
    <template v-else-if="expression === 'reflechit'">
      <circle class="h-pupille" cx="21.5" cy="26.5" r="4" />
      <circle class="h-pupille" cx="39.5" cy="26.5" r="4" />
      <circle class="h-oeil" cx="20.5" cy="25.5" r="1.2" />
      <circle class="h-oeil" cx="38.5" cy="25.5" r="1.2" />
    </template>
    <template v-else>
      <circle class="h-pupille" cx="24" cy="30" r="4.2" />
      <circle class="h-pupille" cx="40" cy="30" r="4.2" />
      <circle class="h-oeil" cx="25.4" cy="28.6" r="1.3" />
      <circle class="h-oeil" cx="41.4" cy="28.6" r="1.3" />
    </template>
    <!-- bec -->
    <path class="h-bec" d="M29 36 L32 41 L35 36 Z" />
    <!-- aile au menton (réfléchit) -->
    <path v-if="expression === 'reflechit'" class="h-corps h-contour" d="M44 52 Q36 50 34 44 Q40 44 46 47 Z" />
    <!-- pattes -->
    <path class="h-patte" d="M24 59 q3 -3 6 0 M34 59 q3 -3 6 0" />
    <!-- étoiles (bravo seulement) -->
    <g v-if="expression === 'bravo'" class="h-etoiles">
      <path d="M8 8 l1.5 3.2 3.5 .4 -2.6 2.4 .7 3.4 -3.1 -1.7 -3.1 1.7 .7 -3.4 -2.6 -2.4 3.5 -.4 Z" />
      <path d="M56 6 l1.2 2.5 2.7 .3 -2 1.9 .5 2.6 -2.4 -1.3 -2.4 1.3 .5 -2.6 -2 -1.9 2.7 -.3 Z" />
    </g>
  </svg>
</template>

<style scoped>
.hulotte { display: block; flex: none; overflow: visible; }
.h-corps { fill: var(--hulotte-corps); }
.h-contour { stroke: var(--hulotte-pupille); stroke-width: 0.6; stroke-opacity: 0.25; }
.h-ventre { fill: var(--hulotte-ventre); }
.h-plume { fill: none; stroke: var(--hulotte-corps); stroke-width: 1.2; stroke-linecap: round; }
.h-oeil { fill: var(--hulotte-oeil); }
.h-pupille { fill: var(--hulotte-pupille); }
.h-trait { fill: none; stroke: var(--hulotte-pupille); stroke-width: 2.4; stroke-linecap: round; }
.h-bec { fill: var(--hulotte-bec); }
.h-patte { fill: none; stroke: var(--hulotte-bec); stroke-width: 3; stroke-linecap: round; }
.h-etoiles { fill: var(--hulotte-bec); }
</style>
