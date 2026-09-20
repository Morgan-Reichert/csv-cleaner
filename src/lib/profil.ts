/**
 * Profilage des colonnes : de quoi parle ce fichier ?
 * C'est ce profil — et jamais les lignes elles-mêmes — qui est envoyé à l'IA.
 */

import type { Table } from './csv'
import { estNombreFr, lireDate, normaliserNombre } from './valeurs'

export type TypeColonne =
  | 'vide'
  | 'identifiant'
  | 'email'
  | 'date'
  | 'montant'
  | 'nombre'
  | 'booleen'
  | 'categorie'
  | 'texte'

export type ProfilColonne = {
  index: number
  nom: string
  type: TypeColonne
  nonVides: number
  tauxRemplissage: number
  distinct: number
  exemples: string[]
  min?: number
  max?: number
  somme?: number
  moyenne?: number
  debut?: string
  fin?: string
  top?: { valeur: string; n: number }[]
}

const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i
const MOTS_MONTANT =
  /montant|prix|ca\b|chiffre|total|co[uû]t|salaire|tarif|euro|€|ht\b|ttc\b|solde|recette|d[ée]pense|budget|remise|marge/i
const MOTS_BOOLEEN = new Set(['oui', 'non', 'true', 'false', 'vrai', 'faux', '0', '1', 'o', 'n', 'y'])

export function valeurNumerique(brut: string): number | null {
  const v = brut.trim()
  if (v === '') return null
  const normalise = estNombreFr(v) ? normaliserNombre(v) : v.replace(/\s/g, '')
  const n = Number(normalise)
  return Number.isFinite(n) ? n : null
}

export function profiler(table: Table): ProfilColonne[] {
  return table.entetes.map((nom, index) => {
    const valeurs: string[] = []
    for (const ligne of table.lignes) {
      const v = (ligne[index] ?? '').trim()
      if (v !== '') valeurs.push(v)
    }

    const total = table.lignes.length
    const nonVides = valeurs.length
    const comptes = new Map<string, number>()
    for (const v of valeurs) comptes.set(v, (comptes.get(v) ?? 0) + 1)
    const distinct = comptes.size

    const profil: ProfilColonne = {
      index,
      nom,
      type: 'texte',
      nonVides,
      tauxRemplissage: total === 0 ? 0 : nonVides / total,
      distinct,
      exemples: valeurs.slice(0, 3),
    }

    if (nonVides === 0) {
      profil.type = 'vide'
      return profil
    }

    const echantillon = valeurs.length > 2000 ? valeurs.slice(0, 2000) : valeurs
    const part = (f: (v: string) => boolean) =>
      echantillon.reduce((n, v) => n + (f(v) ? 1 : 0), 0) / echantillon.length

    if (part((v) => RE_EMAIL.test(v)) >= 0.8) {
      profil.type = 'email'
      return profil
    }

    if (part((v) => lireDate(v) !== null) >= 0.8) {
      profil.type = 'date'
      let min = Infinity
      let max = -Infinity
      for (const v of valeurs) {
        const d = lireDate(v)
        if (!d) continue
        const t = Date.UTC(d.annee, d.mois - 1, d.jour)
        if (t < min) min = t
        if (t > max) max = t
      }
      if (Number.isFinite(min)) {
        profil.debut = new Date(min).toISOString().slice(0, 10)
        profil.fin = new Date(max).toISOString().slice(0, 10)
      }
      return profil
    }

    if (part((v) => valeurNumerique(v) !== null) >= 0.8) {
      const nombres = valeurs.map(valeurNumerique).filter((n): n is number => n !== null)
      const somme = nombres.reduce((a, b) => a + b, 0)
      profil.min = Math.min(...nombres)
      profil.max = Math.max(...nombres)
      profil.somme = somme
      profil.moyenne = somme / nombres.length
      const ressembleAMontant =
        MOTS_MONTANT.test(nom) || part((v) => /€|EUR/.test(v)) >= 0.5
      // Un « nombre » unique par ligne et entier est plus probablement un identifiant.
      const identifiant =
        distinct / nonVides > 0.98 && nonVides > 10 && nombres.every((n) => Number.isInteger(n))
      profil.type = identifiant && !ressembleAMontant ? 'identifiant' : ressembleAMontant ? 'montant' : 'nombre'
      return profil
    }

    if (distinct <= 2 && [...comptes.keys()].every((v) => MOTS_BOOLEEN.has(v.toLowerCase()))) {
      profil.type = 'booleen'
    } else if (distinct / nonVides > 0.95 && nonVides > 10) {
      profil.type = 'identifiant'
    } else if (distinct <= 40 || distinct / nonVides < 0.25) {
      profil.type = 'categorie'
    } else {
      profil.type = 'texte'
    }

    if (profil.type === 'categorie' || profil.type === 'booleen') {
      profil.top = [...comptes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([valeur, n]) => ({ valeur, n }))
    }

    return profil
  })
}

/**
 * Résumé compact destiné au modèle : structure et statistiques, jamais les lignes.
 * `inclureValeurs` ajoute les valeurs les plus fréquentes des colonnes de
 * catégories — plus efficace, mais ce sont de vraies valeurs du fichier.
 */
export function profilPourIa(table: Table, profils: ProfilColonne[], inclureValeurs: boolean) {
  return {
    nombre_de_lignes: table.lignes.length,
    colonnes: profils.map((p) => ({
      nom: p.nom,
      type: p.type,
      taux_de_remplissage: Math.round(p.tauxRemplissage * 100) / 100,
      valeurs_distinctes: p.distinct,
      ...(p.somme !== undefined
        ? {
            min: arrondi(p.min!),
            max: arrondi(p.max!),
            somme: arrondi(p.somme),
            moyenne: arrondi(p.moyenne!),
          }
        : {}),
      ...(p.debut ? { periode: [p.debut, p.fin] } : {}),
      ...(p.top && inclureValeurs
        ? { valeurs_frequentes: p.top.map((t) => `${t.valeur} (${t.n})`) }
        : {}),
    })),
  }
}

function arrondi(n: number): number {
  return Math.round(n * 100) / 100
}
