<script setup lang="ts">
/**
 * Filtre SVG commun aux dessins (scènes, îles, objets) : une ombre portée douce et du volume
 * (reflet clair en haut à gauche, ombre propre en bas à droite). La lumière vient toujours d’en haut à gauche.
 * À placer dans un <defs> ; `echelle` adapte les distances à la taille du viewBox.
 */
withDefaults(defineProps<{ id: string; echelle?: number; ombre?: number }>(), { echelle: 1, ombre: 0.28 })
</script>

<template>
  <filter :id="id" x="-15%" y="-15%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <!-- ombre portée -->
    <feGaussianBlur in="SourceAlpha" :stdDeviation="2.2 * echelle" result="flou" />
    <feOffset in="flou" :dx="2.5 * echelle" :dy="3.5 * echelle" result="decale" />
    <feComponentTransfer in="decale" result="ombre"><feFuncA type="linear" :slope="ombre" /></feComponentTransfer>
    <!-- reflet : le bord haut-gauche de la silhouette -->
    <feOffset in="SourceAlpha" :dx="1.6 * echelle" :dy="1.6 * echelle" result="basDroite" />
    <feComposite in="SourceAlpha" in2="basDroite" operator="out" result="bordReflet" />
    <feGaussianBlur in="bordReflet" :stdDeviation="0.6 * echelle" result="refletFlou" />
    <feFlood flood-color="#ffffff" flood-opacity="0.5" />
    <feComposite in2="refletFlou" operator="in" result="refletCouleur" />
    <feComposite in="refletCouleur" in2="SourceAlpha" operator="in" result="reflet" />
    <!-- ombre propre : le bord bas-droit de la silhouette -->
    <feOffset in="SourceAlpha" :dx="-2.4 * echelle" :dy="-2.4 * echelle" result="hautGauche" />
    <feComposite in="SourceAlpha" in2="hautGauche" operator="out" result="bordOmbre" />
    <feGaussianBlur in="bordOmbre" :stdDeviation="1.2 * echelle" result="ombreFlou" />
    <feFlood flood-color="#0b1020" flood-opacity="0.22" />
    <feComposite in2="ombreFlou" operator="in" result="ombreCouleur" />
    <feComposite in="ombreCouleur" in2="SourceAlpha" operator="in" result="ombrePropre" />
    <feMerge>
      <feMergeNode in="ombre" />
      <feMergeNode in="SourceGraphic" />
      <feMergeNode in="ombrePropre" />
      <feMergeNode in="reflet" />
    </feMerge>
  </filter>
</template>
