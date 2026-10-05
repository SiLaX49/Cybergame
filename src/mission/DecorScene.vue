<script setup lang="ts">
import type { Decor } from '@/content/schema'

// Décor purement illustratif : le nom du lieu est toujours donné en texte à côté.
defineProps<{ decor: Decor }>()
</script>

<template>
  <svg class="decor-scene" viewBox="0 0 320 160" aria-hidden="true" focusable="false" :data-decor="decor">
    <template v-if="decor === 'cour'">
      <rect width="320" height="160" fill="#cfe8ff" />
      <rect y="110" width="320" height="50" fill="#b9b9c6" />
      <rect x="20" y="40" width="150" height="70" fill="#f2d7b6" />
      <rect x="20" y="30" width="150" height="12" fill="#c46a4a" />
      <rect v-for="x in [35, 70, 105, 140]" :key="x" :x="x" y="55" width="20" height="18" fill="#7fb3e0" />
      <rect x="80" y="85" width="30" height="25" fill="#7a4f2a" />
      <rect x="240" y="70" width="10" height="40" fill="#7a4f2a" />
      <circle cx="245" cy="60" r="28" fill="#4f9a55" />
      <rect x="190" y="98" width="40" height="6" fill="#8a5a33" />
      <rect x="194" y="104" width="4" height="8" fill="#8a5a33" />
      <rect x="222" y="104" width="4" height="8" fill="#8a5a33" />
      <circle cx="285" cy="30" r="14" fill="#ffd34d" />
    </template>

    <template v-else-if="decor === 'cantine'">
      <rect width="320" height="160" fill="#fbe7b0" />
      <rect y="115" width="320" height="45" fill="#d9c08a" />
      <rect x="20" y="20" width="280" height="10" fill="#e3b75d" />
      <g v-for="x in [30, 180]" :key="x">
        <rect :x="x" y="85" width="110" height="10" fill="#c97b3a" />
        <rect :x="x + 8" y="95" width="6" height="25" fill="#9b5a26" />
        <rect :x="x + 96" y="95" width="6" height="25" fill="#9b5a26" />
        <rect :x="x + 15" y="77" width="34" height="8" rx="2" fill="#7fb3e0" />
        <circle :cx="x + 32" cy="76" r="7" fill="#ffffff" />
        <rect :x="x + 60" y="77" width="34" height="8" rx="2" fill="#e88a8a" />
        <circle :cx="x + 77" cy="76" r="7" fill="#ffffff" />
      </g>
      <circle cx="160" cy="50" r="14" fill="#ffffff" stroke="#9b5a26" stroke-width="3" />
      <line x1="160" y1="50" x2="160" y2="41" stroke="#9b5a26" stroke-width="2" />
      <line x1="160" y1="50" x2="167" y2="50" stroke="#9b5a26" stroke-width="2" />
    </template>

    <template v-else-if="decor === 'cdi'">
      <rect width="320" height="160" fill="#e7e2f7" />
      <rect y="120" width="320" height="40" fill="#b9a98f" />
      <g v-for="y in [25, 55, 85]" :key="y">
        <rect x="15" :y="y + 26" width="120" height="4" fill="#7a4f2a" />
        <rect v-for="(c, i) in ['#c46a4a', '#4f9a55', '#3b2fc9', '#e3b75d', '#7fb3e0', '#b3261e']" :key="i" :x="20 + i * 18" :y="y" width="14" height="26" :fill="c" />
      </g>
      <rect x="170" y="90" width="130" height="8" fill="#8a5a33" />
      <rect x="180" y="98" width="6" height="22" fill="#8a5a33" />
      <rect x="284" y="98" width="6" height="22" fill="#8a5a33" />
      <rect x="200" y="58" width="50" height="32" rx="3" fill="#1b1b2f" />
      <rect x="205" y="62" width="40" height="22" fill="#7fb3e0" />
      <rect x="260" y="80" width="30" height="10" fill="#ffffff" stroke="#4a4a63" />
    </template>

    <template v-else-if="decor === 'classe'">
      <rect width="320" height="160" fill="#f3efe4" />
      <rect y="120" width="320" height="40" fill="#c9b79a" />
      <rect x="70" y="20" width="180" height="70" fill="#2f5d3a" stroke="#8a5a33" stroke-width="5" />
      <line x1="90" y1="45" x2="160" y2="45" stroke="#ffffff" stroke-width="3" />
      <line x1="90" y1="62" x2="200" y2="62" stroke="#ffffff" stroke-width="3" />
      <g v-for="x in [30, 130, 230]" :key="x">
        <rect :x="x" y="105" width="60" height="8" fill="#c97b3a" />
        <rect :x="x + 5" y="113" width="5" height="18" fill="#9b5a26" />
        <rect :x="x + 50" y="113" width="5" height="18" fill="#9b5a26" />
      </g>
    </template>

    <template v-else-if="decor === 'parc'">
      <rect width="320" height="160" fill="#cfe8ff" />
      <rect y="100" width="320" height="60" fill="#8cc97a" />
      <path d="M130 160 Q160 120 190 100 L210 100 Q180 125 170 160 Z" fill="#e0cfa3" />
      <circle cx="40" cy="30" r="16" fill="#ffd34d" />
      <rect x="60" y="60" width="12" height="45" fill="#7a4f2a" />
      <circle cx="66" cy="50" r="32" fill="#4f9a55" />
      <rect x="250" y="70" width="10" height="35" fill="#7a4f2a" />
      <circle cx="255" cy="60" r="24" fill="#3f8a46" />
      <rect x="215" y="112" width="50" height="6" fill="#8a5a33" />
      <rect x="219" y="118" width="4" height="10" fill="#8a5a33" />
      <rect x="257" y="118" width="4" height="10" fill="#8a5a33" />
    </template>

    <template v-else-if="decor === 'salle-jeux'">
      <rect width="320" height="160" fill="#2b2650" />
      <rect y="125" width="320" height="35" fill="#1b1b2f" />
      <rect x="30" y="40" width="60" height="90" rx="6" fill="#3b2fc9" />
      <rect x="38" y="50" width="44" height="34" fill="#7fe0c4" />
      <circle cx="50" cy="100" r="5" fill="#ffd34d" />
      <circle cx="70" cy="100" r="5" fill="#e88a8a" />
      <rect x="140" y="45" width="110" height="65" rx="4" fill="#111" />
      <rect x="146" y="51" width="98" height="53" fill="#4f9ae0" />
      <rect x="180" y="112" width="30" height="8" fill="#444" />
      <rect x="170" y="128" width="50" height="14" rx="7" fill="#e3e3ee" />
      <circle cx="270" cy="30" r="6" fill="#ffd34d" />
      <circle cx="290" cy="45" r="4" fill="#e88a8a" />
      <circle cx="110" cy="25" r="4" fill="#7fe0c4" />
    </template>

    <template v-else-if="decor === 'salon'">
      <rect width="320" height="160" fill="#f6dccb" />
      <rect y="120" width="320" height="40" fill="#b98a6a" />
      <rect x="30" y="80" width="140" height="40" rx="10" fill="#6a7fc9" />
      <rect x="30" y="65" width="140" height="25" rx="10" fill="#5468b5" />
      <rect x="200" y="40" width="90" height="55" rx="4" fill="#1b1b2f" />
      <rect x="206" y="46" width="78" height="43" fill="#7fb3e0" />
      <rect x="215" y="95" width="60" height="25" fill="#8a5a33" />
      <rect x="10" y="40" width="4" height="80" fill="#4a4a63" />
      <path d="M0 40 L24 40 L18 25 L6 25 Z" fill="#ffd34d" />
      <circle cx="300" cy="112" r="10" fill="#4f9a55" />
    </template>

    <template v-else-if="decor === 'chambre'">
      <rect width="320" height="160" fill="#dfeef6" />
      <rect y="125" width="320" height="35" fill="#c9a98a" />
      <rect x="20" y="25" width="70" height="55" fill="#cfe8ff" stroke="#ffffff" stroke-width="5" />
      <line x1="55" y1="25" x2="55" y2="80" stroke="#ffffff" stroke-width="4" />
      <rect x="20" y="95" width="130" height="30" rx="4" fill="#e88a8a" />
      <rect x="20" y="85" width="35" height="15" rx="5" fill="#ffffff" />
      <rect x="190" y="90" width="110" height="8" fill="#8a5a33" />
      <rect x="198" y="98" width="6" height="27" fill="#8a5a33" />
      <rect x="286" y="98" width="6" height="27" fill="#8a5a33" />
      <rect x="215" y="62" width="50" height="28" rx="3" fill="#1b1b2f" />
      <rect x="219" y="66" width="42" height="20" fill="#7fe0c4" />
      <rect x="262" y="64" width="8" height="8" fill="#ffd34d" />
      <rect x="120" y="20" width="40" height="50" fill="#3b2fc9" />
    </template>

    <template v-else-if="decor === 'cuisine'">
      <rect width="320" height="160" fill="#f3f3f3" />
      <g v-for="x in [0, 40, 80, 120, 160, 200, 240, 280]" :key="x">
        <rect :x="x" y="60" width="40" height="20" fill="none" stroke="#c9c9d9" />
      </g>
      <rect y="120" width="320" height="40" fill="#d9c08a" />
      <rect x="20" y="30" width="55" height="95" rx="4" fill="#e3e3ee" stroke="#4a4a63" />
      <line x1="20" y1="65" x2="75" y2="65" stroke="#4a4a63" />
      <rect x="120" y="85" width="190" height="35" fill="#8a5a33" />
      <rect x="130" y="76" width="30" height="10" rx="3" fill="#b3261e" />
      <rect x="230" y="20" width="60" height="40" fill="#cfe8ff" stroke="#ffffff" stroke-width="4" />
    </template>

    <template v-else-if="decor === 'gare'">
      <rect width="320" height="160" fill="#d9e4ef" />
      <rect y="115" width="320" height="45" fill="#9a9aa8" />
      <rect y="112" width="320" height="5" fill="#ffd34d" />
      <rect x="10" y="55" width="200" height="55" rx="10" fill="#3b2fc9" />
      <rect v-for="x in [25, 70, 115, 160]" :key="x" :x="x" y="65" width="32" height="20" fill="#cfe8ff" />
      <rect x="230" y="20" width="80" height="30" fill="#1b1b2f" />
      <rect x="236" y="27" width="50" height="5" fill="#ffd34d" />
      <rect x="236" y="37" width="35" height="5" fill="#7fe0c4" />
      <rect x="250" y="75" width="40" height="30" rx="3" fill="#4a4a63" />
      <rect x="255" y="80" width="30" height="18" fill="#7fb3e0" />
      <rect x="267" y="105" width="6" height="10" fill="#4a4a63" />
    </template>

    <template v-else-if="decor === 'magasin'">
      <rect width="320" height="160" fill="#fdf1e6" />
      <rect y="125" width="320" height="35" fill="#c9c9d9" />
      <g v-for="y in [35, 70, 105]" :key="y">
        <rect x="15" :y="y" width="150" height="5" fill="#8a5a33" />
        <rect v-for="(c, i) in ['#e88a8a', '#7fb3e0', '#ffd34d', '#4f9a55', '#c46a4a']" :key="i" :x="22 + i * 28" :y="y - 18" width="20" height="18" rx="2" :fill="c" />
      </g>
      <rect x="200" y="90" width="110" height="35" fill="#3b2fc9" />
      <rect x="230" y="70" width="40" height="20" rx="2" fill="#1b1b2f" />
      <path d="M262 30 a22 22 0 0 1 36 0" fill="none" stroke="#3b2fc9" stroke-width="4" />
      <path d="M268 36 a13 13 0 0 1 24 0" fill="none" stroke="#3b2fc9" stroke-width="4" />
      <circle cx="280" cy="42" r="3" fill="#3b2fc9" />
    </template>

    <template v-else-if="decor === 'rue'">
      <rect width="320" height="160" fill="#cfe8ff" />
      <rect y="120" width="320" height="40" fill="#6f6f7f" />
      <rect y="112" width="320" height="10" fill="#b9b9c6" />
      <rect x="10" y="35" width="90" height="77" fill="#e3b75d" />
      <rect x="110" y="20" width="80" height="92" fill="#c46a4a" />
      <rect x="200" y="45" width="110" height="67" fill="#d9c08a" />
      <rect v-for="x in [20, 55]" :key="x" :x="x" y="50" width="22" height="20" fill="#7fb3e0" />
      <rect v-for="x in [122, 157]" :key="x" :x="x" y="35" width="22" height="20" fill="#7fb3e0" />
      <rect x="220" y="60" width="60" height="40" fill="#ffffff" stroke="#3b2fc9" stroke-width="3" />
      <rect x="258" y="82" width="16" height="16" fill="#1b1b2f" />
      <rect x="295" y="40" width="4" height="72" fill="#4a4a63" />
      <circle cx="297" cy="38" r="7" fill="#ffd34d" />
      <rect v-for="x in [20, 90, 160, 230, 300]" :key="x" :x="x" y="138" width="30" height="4" fill="#ffffff" />
    </template>

    <template v-else-if="decor === 'bus'">
      <rect width="320" height="160" fill="#e3e3ee" />
      <rect y="130" width="320" height="30" fill="#9a9aa8" />
      <rect v-for="x in [15, 95, 175, 255]" :key="x" :x="x" y="25" width="60" height="45" rx="6" fill="#cfe8ff" stroke="#4a4a63" stroke-width="3" />
      <g v-for="x in [20, 110, 200]" :key="x">
        <rect :x="x" y="85" width="50" height="35" rx="6" fill="#3b2fc9" />
        <rect :x="x" y="118" width="50" height="10" rx="3" fill="#2b2650" />
      </g>
      <rect x="290" y="0" width="6" height="130" fill="#ffd34d" />
    </template>
  </svg>
</template>

<style scoped>
.decor-scene { display: block; width: 100%; height: auto; border-radius: var(--rayon); }
</style>
