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
import { BOUTIQUE, objetBoutique } from '@/profil/boutique'
import type { PersonnageId } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import AgenteCyber from '@/ui/AgenteCyber.vue'
import Octets from '@/ui/Octets.vue'

const store = useProgress()
const reserve = computed(() => solde(store.etat))
const gagne = computed(() => totalGagne(store.etat))
const titre = computed(() => (store.etat.titre ? objetBoutique(store.etat.titre) : undefined))
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
          <span v-for="e in ecussons" :key="e.id" aria-hidden="true">{{ e.emoji }}</span>
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
      <ul class="boutique">
        <li v-for="o in BOUTIQUE" :key="o.id" class="article" :class="{ possede: possede(o.id) }">
          <span class="article-emoji" aria-hidden="true">{{ o.emoji }}</span>
          <span class="article-nom">{{ o.nom }}<span class="article-type"> · {{ o.type === 'titre' ? 'titre' : 'écusson' }}</span></span>
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
          <template v-else-if="o.type === 'titre'">
            <span class="badge badge-bon"><Check aria-hidden="true" :size="16" /> À toi</span>
            <button
              type="button"
              class="btn"
              :aria-pressed="store.etat.titre === o.id"
              @click="store.porterTitre(store.etat.titre === o.id ? null : o.id)"
            >
              Porter ce titre<span class="visually-hidden"> : {{ o.nom }}</span>
            </button>
          </template>
          <span v-else class="badge badge-bon"><Check aria-hidden="true" :size="16" /> À toi</span>
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
.profil { display: grid; gap: 1.25rem; }
.profil > h1 { margin-bottom: 0; }
.profil h2 { margin-top: 0; }
.fiche { display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; }
.fiche-texte { flex: 1 1 16rem; min-width: 0; }
.titre-porte { font-family: var(--police-titres); font-weight: 700; font-size: 1.5em; margin: 0 0 0.25rem; }
.ecussons { font-size: 1.8rem; margin: 0 0 0.5rem; display: flex; flex-wrap: wrap; gap: 0.25rem; }
.chiffres { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); margin: 0.5rem 0 0; }
.chiffres div { background: var(--surface-2); border-radius: var(--rayon); padding: 0.6rem 0.8rem; }
.chiffres dt { color: var(--texte-doux); font-size: 0.9em; }
.chiffres dd { margin: 0; font-size: 1.2em; font-family: var(--police-titres); font-weight: 700; }
.boutique { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); }
.article {
  display: grid; gap: 0.5rem; justify-items: start; align-content: start;
  padding: 0.9rem; border: 2px solid var(--bord); border-radius: var(--rayon-carte); background: var(--surface-2);
}
.article.possede { border-color: var(--bon); }
.article-emoji { font-size: 2rem; line-height: 1; }
.article-nom { font-weight: 700; }
.article-type { font-weight: 400; color: var(--texte-doux); }
.manque { color: var(--texte-doux); font-size: 0.9em; }
.badges { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.6rem; }
.medaille { font-size: 1em; padding: 0.35em 0.9em; border-color: var(--primaire); }
.medaille svg { color: var(--primaire); }
</style>
