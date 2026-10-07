<script setup lang="ts">
import type { Aide } from '@/content/schema'

defineProps<{ aides: Aide[] }>()

/** Petits écrans : la barre collante amène le focus sur le bandeau complet. */
function allerAuBandeau() {
  const bandeau = document.getElementById('bandeau-aide')
  bandeau?.scrollIntoView({ block: 'center' })
  bandeau?.focus()
}

const TYPES: Record<Aide['type'], string> = {
  humaine: 'Parler à quelqu’un',
  urgence: 'Urgence',
  signalement: 'Signaler un contenu',
  technique: 'Aide technique',
}
</script>

<template>
  <aside id="bandeau-aide" tabindex="-1" class="bandeau-aide encadre encadre-doux" aria-label="Besoin d’aide ?">
    <p><strong>Besoin d’aide ? C’est gratuit et confidentiel.</strong></p>
    <ul>
      <li v-for="aide in aides" :key="aide.numero">
        <span class="type">{{ TYPES[aide.type] }}</span>
        <strong>{{ aide.numero }}</strong> : {{ aide.libelle }}
      </li>
    </ul>
    <Teleport to="body">
      <div class="barre-aide no-print">
        <a href="#bandeau-aide" class="btn btn-primaire" @click.prevent="allerAuBandeau">Besoin d’aide ?</a>
      </div>
    </Teleport>
  </aside>
</template>

<style scoped>
.bandeau-aide {
  position: sticky;
  bottom: 0;
  margin-top: 1.5rem;
  font-size: 0.95em;
  box-shadow: 0 -2px 0 var(--fond), 0 -6px 12px var(--fond);
}
.bandeau-aide ul { margin: 0.25rem 0 0; padding-left: 1.2rem; }
.bandeau-aide li strong { font-weight: 700; }
.type { display: inline-block; min-width: 11rem; color: var(--texte-doux); }
/* Petit écran : le bandeau ne masque plus le contenu et les libellés passent au-dessus des numéros. */
.barre-aide { display: none; }
@media (max-width: 40rem) {
  .bandeau-aide { position: static; box-shadow: none; margin-bottom: 4.5rem; }
  .type { display: block; min-width: 0; }
  /* Barre compacte collée en bas : le bandeau complet reste dans le flux, la barre y mène. */
  .barre-aide {
    display: flex; justify-content: center;
    position: fixed; inset-inline: 0; bottom: 0; z-index: 5;
    padding: 0.5rem 1rem; background: var(--surface); border-top: 2px solid var(--bord);
  }
}
</style>
