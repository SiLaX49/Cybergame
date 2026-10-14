<script setup lang="ts">
defineProps<{ contact: string }>()
</script>

<template>
  <p class="ecrit">
    <span class="points" aria-hidden="true"><span /><span /><span /></span>
    {{ contact }} est en train d’écrire…
  </p>
</template>

<style scoped>
.ecrit { align-self: flex-start; display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0 0; padding: 0.5rem 0.75rem; border-radius: 18px; border-bottom-left-radius: 4px; background: var(--tel-recu); color: var(--tel-doux); font-size: 0.85em; }
.points { display: inline-flex; gap: 3px; }
.points span { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
/* Trois points qui sautillent doucement ; immobiles en mouvement réduit. */
@media (prefers-reduced-motion: no-preference) {
  .points span { animation: sautiller 1.2s ease-in-out infinite; }
  .points span:nth-child(2) { animation-delay: 0.2s; }
  .points span:nth-child(3) { animation-delay: 0.4s; }
}
@keyframes sautiller { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-3px); } }
</style>
