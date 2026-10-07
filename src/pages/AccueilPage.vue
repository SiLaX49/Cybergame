<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { TRANCHES, TRANCHE_LIBELLES } from '@/content/schema'
import { MODES, type Mode } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import Hulotte from '@/ui/Hulotte.vue'

const store = useProgress()
const router = useRouter()

const MODE_INFOS: Record<Mode, { titre: string; description: string }> = {
  solo: { titre: 'Solo', description: 'Je joue seul·e, à mon rythme.' },
  binome: { titre: 'Binôme', description: 'On joue à deux sur le même écran et on discute avant chaque choix.' },
  classe: { titre: 'Classe entière', description: 'Le jeu est projeté, la classe vote, l’adulte valide.' },
}

const aDejaJoue = computed(() => Object.keys(store.etat.missions).length > 0)
const pret = computed(() => store.etat.tranche !== null && store.etat.mode !== null)

function commencer() {
  if (pret.value) void router.push({ name: 'carte' })
}
</script>

<template>
  <main class="conteneur accueil">
    <div class="carte heros">
      <Hulotte expression="accueil" :taille="112" />
      <div class="heros-texte">
        <h1>Cyber Réflexes</h1>
        <p class="accroche">
          Des situations du quotidien pour apprendre les bons réflexes sur Internet. Pas de compte, rien à
          installer.
        </p>
      </div>
    </div>
    <form @submit.prevent="commencer">
      <fieldset>
        <legend>Je suis en…</legend>
        <div class="choix-grille">
          <label v-for="t in TRANCHES" :key="t" class="option">
            <input
              type="radio"
              name="tranche"
              :value="t"
              :checked="store.etat.tranche === t"
              @change="store.choisirTranche(t)"
            />
            {{ TRANCHE_LIBELLES[t] }}
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Comment on joue ?</legend>
        <div class="choix-grille">
          <label v-for="m in MODES" :key="m" class="option">
            <input
              type="radio"
              name="mode"
              :value="m"
              :checked="store.etat.mode === m"
              @change="store.choisirMode(m)"
            />
            <span>
              <strong>{{ MODE_INFOS[m].titre }}</strong>
              <span class="description"> : {{ MODE_INFOS[m].description }}</span>
            </span>
          </label>
        </div>
      </fieldset>
      <button type="submit" class="btn btn-primaire cta" :disabled="!pret">
        {{ aDejaJoue ? 'Continuer' : 'C’est parti' }}
      </button>
    </form>
    <nav aria-label="Liens utiles" class="liens">
      <RouterLink to="/enseignants">Espace enseignants</RouterLink>
      <RouterLink to="/confidentialite">Confidentialité</RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.heros { display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap; margin-block: 1rem 1.5rem; }
.heros-texte { flex: 1 1 16rem; }
.heros h1 { margin: 0 0 0.25rem; }
.accroche { font-size: 1.1em; color: var(--texte-doux); margin: 0; }
.choix-grille {
  display: grid; gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
}
.choix-grille .option { min-height: 64px; margin: 0; font-family: var(--police-titres); font-weight: 600; }
.description { color: var(--texte-doux); font-family: var(--police-texte); font-weight: 400; }
.cta { font-size: 1.15em; padding: 0.8em 1.6em; }
.liens { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin-top: 2rem; }
.liens a { display: inline-flex; align-items: center; min-height: 44px; }
</style>
