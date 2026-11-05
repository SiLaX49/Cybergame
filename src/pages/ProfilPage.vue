<script setup lang="ts">
import { Award, Check } from '@lucide/vue'
import { computed } from 'vue'
import { CHEMIN } from '@/archipel/archipel'
import { objetsSacoche } from '@/archipel/progression'
import Sacoche from '@/archipel/Sacoche.vue'
import { getThemes, missionsPour } from '@/content'
import { BADGES, type BadgeId } from '@/engine/badges'
import { solde, totalGagne } from '@/engine/portefeuille'
import ChoixPersonnage from '@/parcours/ChoixPersonnage.vue'
import { BOUTIQUE, objetBoutique, type ObjetBoutique } from '@/profil/boutique'
import type { PersonnageId } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import AgenteCyber from '@/ui/AgenteCyber.vue'
import ObjetDessin from '@/ui/ObjetDessin.vue'
import Octets from '@/ui/Octets.vue'

const store = useProgress()
const reserve = computed(() => solde(store.etat))
const gagne = computed(() => totalGagne(store.etat))
const titre = computed(() => (store.etat.titre ? objetBoutique(store.etat.titre) : undefined))
const TITRES = BOUTIQUE.filter((o) => o.type === 'titre')
const ECUSSONS = BOUTIQUE.filter((o) => o.type === 'ecusson')
/** Dans le rayon « Écussons », « Écusson cadenas » s’affiche « Cadenas » (le nom complet reste lu par les lecteurs d’écran). */
const nomCourt = (o: ObjetBoutique) => {
  const n = o.nom.replace(/^Écusson /, '')
  return n.charAt(0).toUpperCase() + n.slice(1)
}
const ecussons = computed(() => BOUTIQUE.filter((o) => o.type === 'ecusson' && store.etat.achats.includes(o.id)))

/** Nombre de fois où chaque badge a été gagné, toutes missions confondues. */
const badges = computed(() => {
  const compte = new Map<BadgeId, number>()
  for (const m of Object.values(store.etat.missions)) {
    for (const b of m.badges) if (b in BADGES) compte.set(b as BadgeId, (compte.get(b as BadgeId) ?? 0) + 1)
  }
  return (Object.keys(BADGES) as BadgeId[]).filter((b) => compte.has(b)).map((b) => ({ id: b, fois: compte.get(b)! }))
})

const objets = computed(() => {
  const tranche = store.etat.tranche
  if (!tranche) return []
  const ids = new Set(getThemes().map((t) => t.id))
  const iles = CHEMIN.filter((id) => ids.has(id)).map((id) => ({ theme: id, missions: missionsPour(tranche, id) }))
  return objetsSacoche(iles, store.etat.missions)
})

const possede = (id: string) => store.etat.achats.includes(id)
const porte = (o: ObjetBoutique) => store.etat[o.type] === o.id
/** Bascule : porter l’objet, ou le retirer s’il est déjà porté. */
function porter(o: ObjetBoutique) {
  const id = porte(o) ? null : o.id
  if (o.type === 'titre') store.porterTitre(id)
  else store.porterEcusson(id)
}
const choisirPersonnage = (id: PersonnageId) => store.choisirPersonnage(id)
</script>

<template>
  <main class="conteneur profil">
    <h1>Ton profil</h1>

    <section class="carte fiche" aria-label="Ton agent·e">
      <AgenteCyber :personnage="store.etat.personnage" :hauteur="220" />
      <div class="fiche-texte">
        <p class="titre-porte">{{ titre ? titre.nom : 'Agent·e en formation' }}</p>
        <p v-if="ecussons.length" class="ecussons">
          <span class="visually-hidden">Tes écussons : {{ ecussons.map((e) => e.nom).join(', ') }}</span>
          <ObjetDessin v-for="e in ecussons" :key="e.id" :dessin="e.dessin" :taille="36" />
        </p>
        <dl class="chiffres">
          <div><dt>Ta réserve</dt><dd><Octets :valeur="reserve" /></dd></div>
          <div><dt>Gagnés depuis le début</dt><dd><Octets :valeur="gagne" /></dd></div>
          <div><dt>Défis relevés</dt><dd>{{ store.etat.defis.length }}</dd></div>
        </dl>
      </div>
    </section>

    <section class="carte" aria-labelledby="titre-boutique">
      <h2 id="titre-boutique">Boutique</h2>
      <p>Dépense tes octets en titres et en écussons. Tout se gagne en jouant : rien n’est payant.</p>
      <h3 class="rayon">Titres</h3>
      <p class="rayon-aide">Il remplace « Agent·e en formation » sur ton profil. Du premier au plus rare.</p>
      <ol class="titres">
        <li v-for="o in TITRES" :key="o.id" class="article article-titre" :class="{ possede: possede(o.id) }">
          <ObjetDessin :dessin="o.dessin" :taille="40" />
          <span class="article-nom">{{ o.nom }}<span class="visually-hidden"> · titre</span></span>
          <span class="article-actions">
          <template v-if="!possede(o.id)">
            <Octets :valeur="o.prix" />
            <button
              type="button"
              class="btn btn-primaire"
              :disabled="reserve < o.prix"
              :aria-describedby="reserve < o.prix ? `manque-${o.id}` : undefined"
              @click="store.acheter(o.id)"
            >
              Acheter<span class="visually-hidden"> : {{ o.nom }}</span>
            </button>
            <span v-if="reserve < o.prix" :id="`manque-${o.id}`" class="manque">Il te manque {{ o.prix - reserve }} octets</span>
          </template>
          <template v-else>
            <span class="badge badge-bon"><Check aria-hidden="true" :size="16" /> À toi</span>
            <button type="button" class="btn" :aria-pressed="porte(o)" @click="porter(o)">
              {{ o.type === 'titre' ? 'Porter ce titre' : 'Porter cet écusson' }}<span class="visually-hidden"> : {{ o.nom }}</span>
            </button>
          </template>
          </span>
        </li>
      </ol>

      <h3 class="rayon">Écussons</h3>
      <p class="rayon-aide">Ton agent·e le porte sur son uniforme.</p>
      <ul class="ecussons-rayon">
        <li v-for="o in ECUSSONS" :key="o.id" class="article article-ecusson" :class="{ possede: possede(o.id) }">
          <ObjetDessin :dessin="o.dessin" :taille="56" :terne="!possede(o.id) && reserve < o.prix" />
          <span class="article-nom">{{ nomCourt(o) }}<span class="visually-hidden"> · écusson</span></span>
          <template v-if="!possede(o.id)">
            <Octets :valeur="o.prix" />
            <button
              type="button"
              class="btn btn-primaire"
              :disabled="reserve < o.prix"
              :aria-describedby="reserve < o.prix ? `manque-${o.id}` : undefined"
              @click="store.acheter(o.id)"
            >
              Acheter<span class="visually-hidden"> : {{ o.nom }}</span>
            </button>
            <span v-if="reserve < o.prix" :id="`manque-${o.id}`" class="manque">Il te manque {{ o.prix - reserve }} octets</span>
          </template>
          <template v-else>
            <span class="badge badge-bon"><Check aria-hidden="true" :size="16" /> À toi</span>
            <button type="button" class="btn" :aria-pressed="porte(o)" @click="porter(o)">
              {{ o.type === 'titre' ? 'Porter ce titre' : 'Porter cet écusson' }}<span class="visually-hidden"> : {{ o.nom }}</span>
            </button>
          </template>
        </li>
      </ul>
    </section>

    <section class="carte" aria-labelledby="titre-badges">
      <h2 id="titre-badges">Tes badges</h2>
      <ul v-if="badges.length" class="badges">
        <li v-for="b in badges" :key="b.id" class="badge medaille">
          <Award aria-hidden="true" /> <strong>{{ BADGES[b.id].titre }}</strong> × {{ b.fois }}
        </li>
      </ul>
      <p v-else>Termine une mission pour gagner ton premier badge.</p>
    </section>

    <Sacoche :objets="objets" />

    <section class="carte" aria-labelledby="titre-personnage">
      <h2 id="titre-personnage">Ton personnage</h2>
      <ChoixPersonnage :model-value="store.etat.personnage" legende="Change d’apparence quand tu veux" name="personnage-profil" @update:model-value="choisirPersonnage" />
    </section>
  </main>
</template>

<style scoped>
.profil { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.25rem; }
.profil > h1 { margin-bottom: 0; }
.profil h2 { margin-top: 0; }
.fiche { display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; }
.fiche-texte { flex: 1 1 16rem; min-width: 0; }
.titre-porte { font-family: var(--police-titres); font-weight: 600; font-size: 1.5em; margin: 0 0 0.25rem; }
.ecussons { margin: 0 0 0.5rem; display: flex; flex-wrap: wrap; gap: 0.25rem; }
.chiffres { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); margin: 0.5rem 0 0; }
.chiffres div { background: var(--surface-2); border-radius: var(--rayon); padding: 0.6rem 0.8rem; }
.chiffres dt { color: var(--texte-doux); font-size: 0.9em; }
.chiffres dd { margin: 0; font-size: 1.2em; font-family: var(--police-titres); font-weight: 600; }
.rayon { margin: 1.5rem 0 0; font-size: 1.05em; }
.rayon-aide { margin: 0.15rem 0 0.75rem; color: var(--texte-doux); font-size: 0.9em; }
.titres, .ecussons-rayon { list-style: none; padding: 0; margin: 0; }
/* Titres : une échelle, du moins cher au plus rare. */
.titres { display: grid; border: 1px solid var(--bord); border-radius: var(--rayon-carte); overflow: hidden; }
.article-titre {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 0.5rem 1rem;
  padding: 0.75rem 1rem; border-bottom: 1px solid var(--bord);
}
.article-titre:last-child { border-bottom: 0; }
.article-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 0.5rem 0.75rem; }
.article-actions .manque { flex-basis: 100%; text-align: right; }
/* Écussons : une vitrine d’objets à collectionner. */
.ecussons-rayon { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 10.5rem), 1fr)); }
.article-ecusson {
  display: grid; justify-items: center; align-content: start; gap: 0.4rem; text-align: center;
  padding: 1rem 0.75rem; border: 1px solid var(--bord); border-radius: var(--rayon-carte); background: var(--surface-2);
}
.article.possede { border-color: var(--bon); }
.article-nom { font-weight: 600; overflow-wrap: anywhere; }
.manque { color: var(--texte-doux); font-size: 0.85em; }
@media (max-width: 36rem) {
  .article-titre { grid-template-columns: auto minmax(0, 1fr); }
  .article-actions { grid-column: 1 / -1; justify-content: flex-start; }
  .article-actions .manque { text-align: left; }
}
.badges { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.6rem; }
.medaille { font-size: 1em; padding: 0.35em 0.9em; border-color: var(--primaire); }
.medaille svg { color: var(--primaire); }
</style>
