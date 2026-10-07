<script setup lang="ts">
import { computed } from 'vue'
import { getThemes, missionsPour } from '@/content'
import type { Tranche } from '@/content/schema'
import PersonnageG from '@/parcours/PersonnageG.vue'
import { useProgress } from '@/store/useProgress'
import Hulotte from '@/ui/Hulotte.vue'
import { CHEMIN, estIleCalme, ILES_CALMES, POSITIONS_LARGES } from './archipel'
import IleLien from './IleLien.vue'
import { etatIle, positionPersonnage } from './progression'

const props = defineProps<{ tranche: Tranche }>()
const store = useProgress()
const personnage = computed(() => store.etat.personnage ?? null)

const themes = computed(() => getThemes())
const ici = computed(() =>
  positionPersonnage(
    themes.value.flatMap((t) => missionsPour(props.tranche, t.id)),
    store.etat.missions,
  ),
)

function ile(id: string) {
  const theme = themes.value.find((t) => t.id === id)
  if (!theme) return null
  const calme = estIleCalme(id)
  const sur = ici.value === id
  return {
    id,
    props: {
      theme: id,
      titreTheme: theme.titre,
      etat: etatIle(missionsPour(props.tranche, id), store.etat.missions, calme),
      ici: sur,
      personnage: sur ? personnage.value : null,
    },
  }
}
const chemin = computed(() => CHEMIN.map(ile).filter((i) => i !== null))
const calmes = computed(() => ILES_CALMES.map(ile).filter((i) => i !== null))

type Cle = keyof typeof POSITIONS_LARGES
const pos = (id: string) => ({ '--x': `${POSITIONS_LARGES[id as Cle].x}%`, '--y': `${POSITIONS_LARGES[id as Cle].y}%` })

// Tracé du chemin dans le repère du fond (100 × 62,5) : port puis îles du chemin, en courbes douces.
const tracePoints = computed(() =>
  ['port', ...chemin.value.map((i) => i.id)].map((id) => {
    const p = POSITIONS_LARGES[id as Cle]
    return { x: p.x, y: p.y * 0.625 }
  }),
)
const trace = computed(() => {
  const pts = tracePoints.value
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    const mx = (a.x + b.x) / 2
    d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
  }
  return d
})
</script>

<template>
  <div class="archipel">
    <div class="cadre">
      <svg class="mer" aria-hidden="true" focusable="false" preserveAspectRatio="none" viewBox="0 0 100 62.5">
        <rect class="mer-fond" width="100" height="62.5" />
        <g class="vagues" fill="none" stroke-linecap="round">
          <path d="M4 8 q2 -1.4 4 0 t4 0" />
          <path d="M40 4 q2 -1.4 4 0 t4 0" />
          <path d="M88 6 q2 -1.4 4 0 t4 0" />
          <path d="M24 33 q2 -1.4 4 0 t4 0" />
          <path d="M72 29 q2 -1.4 4 0 t4 0" />
          <path d="M44 58 q2 -1.4 4 0 t4 0" />
          <path d="M6 40 q2 -1.4 4 0 t4 0" />
          <path d="M92 20 q2 -1.4 4 0 t4 0" />
        </g>
        <rect class="lagon-fond" x="79" y="4" width="20" height="50" rx="10" />
        <path class="chemin-dessous" :d="trace" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        <path class="chemin-dessus" :d="trace" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke" />
      </svg>

      <div class="port" :style="pos('port')">
        <svg v-if="ici === 'port' && personnage" class="ile-perso" viewBox="-20 -60 40 62" aria-hidden="true" focusable="false">
          <PersonnageG :id="personnage" />
        </svg>
        <Hulotte v-else-if="ici === 'port'" expression="accueil" :taille="48" />
        <svg class="port-quai" viewBox="0 0 80 30" aria-hidden="true" focusable="false">
          <ellipse cx="40" cy="22" rx="36" ry="6" fill="#2b6f8f" opacity="0.2" />
          <rect x="6" y="12" width="68" height="9" rx="3" fill="#a77b52" stroke="#6b4a2b" stroke-width="1.5" />
          <path d="M18 12v9M30 12v9M42 12v9M54 12v9M66 12v9" stroke="#6b4a2b" stroke-width="1.2" />
          <rect x="10" y="20" width="4" height="8" fill="#6b4a2b" />
          <rect x="66" y="20" width="4" height="8" fill="#6b4a2b" />
        </svg>
        <span class="port-nom">Port<span v-if="ici === 'port'" class="visually-hidden"> — tu es ici</span></span>
      </div>

      <ol class="iles-chemin">
        <li v-for="i in chemin" :key="i.id" :style="pos(i.id)"><IleLien v-bind="i.props" /></li>
      </ol>

      <section class="lagon" aria-labelledby="titre-lagon">
        <h2 id="titre-lagon">Lagon calme</h2>
        <ul>
          <li v-for="i in calmes" :key="i.id" :style="pos(i.id)"><IleLien v-bind="i.props" /></li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.archipel { container: archipel / inline-size; }
.cadre {
  position: relative;
  isolation: isolate;
  background: var(--mer);
  border: 3px solid var(--bord-fort);
  border-radius: calc(var(--rayon-carte) + 8px);
  overflow: hidden;
  padding: 1rem 0.75rem 1.25rem;
}
.mer-fond { fill: var(--mer); }
.vagues path { stroke: var(--ecume); stroke-width: 0.5; opacity: 0.9; }
.lagon-fond { fill: var(--mer-profonde); }
.chemin-dessous { stroke: var(--mer-profonde); stroke-width: 9px; }
.chemin-dessus { stroke: var(--texte-doux); stroke-width: 4px; stroke-dasharray: 1 11; }

ul, ol { list-style: none; margin: 0; padding: 0; }

/* Mise en page étroite (par défaut) : flux normal, îles en zigzag sur deux colonnes. */
.mer { display: none; }
.port { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; margin: 0 auto 0.5rem; width: 8rem; }
.port-quai { width: 5.5rem; height: auto; }
.port-nom {
  font-family: var(--police-titres); font-weight: 700; font-size: 0.85em;
  background: var(--surface); border: 2px solid var(--bord-fort); border-radius: 14px; padding: 0.1em 0.7em;
}
.ile-perso { height: 3.5rem; width: auto; }
.iles-chemin {
  position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem 0.75rem;
  padding-bottom: 2.5rem;
}
.iles-chemin::before {
  content: ''; position: absolute; z-index: -1; top: -0.5rem; bottom: 1rem; left: 50%;
  border-left: 5px dotted var(--texte-doux);
}
.iles-chemin li:nth-child(even) { transform: translateY(2.5rem); }
/* En colonnes, le dessin garde une taille d’île (pas la largeur de la colonne) ; l’objet reste collé au dessin. */
.iles-chemin :deep(.ile-visuel), .lagon :deep(.ile-visuel) { max-width: 9.5rem; margin-inline: auto; }
.iles-chemin :deep(.ile-etiquette), .lagon :deep(.ile-etiquette) { max-width: 14rem; }
.lagon {
  position: relative; margin-top: 1rem; padding: 0.75rem 0.5rem 0.5rem;
  background: var(--mer-profonde); border-radius: 2rem;
}
.lagon h2 { font-size: 1em; text-align: center; margin: 0 0 0.25rem; }
.lagon ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }

/* Mise en page large : carte au ratio 16:10, îles posées par pourcentages. Le seuil est en em
   (relatif à la taille de texte choisie) : en très grand texte ou en mode classe, on reste en colonnes. */
@container archipel (min-width: 50em) {
  .iles-chemin :deep(.ile-visuel), .lagon :deep(.ile-visuel) { max-width: none; margin-inline: 0; }
  .iles-chemin :deep(.ile-etiquette), .lagon :deep(.ile-etiquette) { max-width: none; }
  .cadre { aspect-ratio: 16 / 10; padding: 0; }
  .mer { display: block; position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
  .port, .iles-chemin li, .lagon li {
    position: absolute; left: var(--x); top: var(--y); transform: translate(-50%, -50%);
    width: clamp(7rem, 17%, 12rem); margin: 0;
  }
  .lagon li { width: clamp(6rem, 13%, 9rem); }
  .port { width: 7rem; }
  .iles-chemin { position: static; display: block; padding: 0; }
  .iles-chemin::before { display: none; }
  .iles-chemin li:nth-child(even) { transform: translate(-50%, -50%); }
  .lagon { position: static; margin: 0; padding: 0; background: none; border-radius: 0; }
  .lagon ul { display: block; }
  .lagon h2 {
    position: absolute; left: 89%; top: 10%; transform: translateX(-50%); margin: 0; font-size: 0.9em;
  }
}
</style>
