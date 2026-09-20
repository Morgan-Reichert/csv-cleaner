/**
 * Le « plan » décrit la mise en page du rapport : quels indicateurs, quels
 * graphiques, quelles colonnes garder. Il est produit soit localement (règles),
 * soit par l'IA — dans les deux cas c'est le même objet, et les calculs se font
 * ici, dans le navigateur, sur les vraies données.
 */

import type { Table } from './csv'
import { lireDate } from './valeurs'
import { valeurNumerique, type ProfilColonne } from './profil'

export type Format = 'nombre' | 'euro' | 'pourcent' | 'texte'

export type Indicateur = {
  titre: string
  colonne?: string
  calcul: 'nombre_lignes' | 'somme' | 'moyenne' | 'min' | 'max' | 'distinct' | 'periode'
  format?: Format
  aide?: string
}

export type BlocBarres = {
  type: 'barres'
  titre: string
  categorie: string
  valeur?: string
  calcul: 'compte' | 'somme' | 'moyenne'
  limite?: number
  format?: Format
  aide?: string
}

export type BlocEvolution = {
  type: 'evolution'
  titre: string
  date: string
  valeur?: string
  calcul: 'compte' | 'somme'
  granularite?: 'jour' | 'mois' | 'annee'
  format?: Format
  aide?: string
}

export type BlocRepartition = {
  type: 'repartition'
  titre: string
  categorie: string
  limite?: number
  aide?: string
}

export type BlocTableau = {
  type: 'tableau'
  titre: string
  colonnes: string[]
  tri?: { colonne: string; sens: 'asc' | 'desc' }
  limite?: number
  aide?: string
}

export type Bloc = BlocBarres | BlocEvolution | BlocRepartition | BlocTableau

export type Plan = {
  titre: string
  resume: string
  indicateurs: Indicateur[]
  blocs: Bloc[]
}

export type Point = { label: string; valeur: number }

/* ------------------------------- utilitaires ------------------------------ */

export function indexColonne(table: Table, nom: string | undefined): number {
  if (!nom) return -1
  const cible = nom.trim().toLowerCase()
  return table.entetes.findIndex((e) => e.trim().toLowerCase() === cible)
}

export function formater(n: number, format: Format = 'nombre'): string {
  if (!Number.isFinite(n)) return '—'
  const decimales = Number.isInteger(n) || Math.abs(n) >= 100 ? 0 : 2
  if (format === 'euro')
    return n.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: decimales,
    })
  if (format === 'pourcent')
    return `${(n * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimales })
}

/** Version courte pour les grands nombres des tuiles : 1,2 M€. */
export function formaterCourt(n: number, format: Format = 'nombre'): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) {
    const v = (n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
    return format === 'euro' ? `${v} M€` : `${v} M`
  }
  if (abs >= 10_000) {
    const v = (n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
    return format === 'euro' ? `${v} k€` : `${v} k`
  }
  return formater(n, format)
}

const MOIS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** « 2024-04-03 » → « 3 avril 2024 ». */
function dateLisible(iso: string): string {
  const [a, m, j] = iso.split('-').map(Number)
  if (!a || !m || !j) return iso
  return `${j === 1 ? '1er' : j} ${MOIS_LONG[m - 1]} ${a}`
}

function moisCourt(m: number): string {
  return ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][m]
}

/* --------------------------------- calculs -------------------------------- */

export function calculerIndicateur(
  table: Table,
  ind: Indicateur,
): { valeur: string; aide?: string } {
  if (ind.calcul === 'nombre_lignes') {
    return { valeur: table.lignes.length.toLocaleString('fr-FR'), aide: ind.aide }
  }
  const c = indexColonne(table, ind.colonne)
  if (c === -1) return { valeur: '—', aide: ind.aide }

  if (ind.calcul === 'distinct') {
    const set = new Set<string>()
    for (const l of table.lignes) {
      const v = (l[c] ?? '').trim()
      if (v !== '') set.add(v)
    }
    return { valeur: set.size.toLocaleString('fr-FR'), aide: ind.aide }
  }

  if (ind.calcul === 'periode') {
    let min = Infinity
    let max = -Infinity
    for (const l of table.lignes) {
      const d = lireDate(l[c] ?? '')
      if (!d) continue
      const t = Date.UTC(d.annee, d.mois - 1, d.jour)
      if (t < min) min = t
      if (t > max) max = t
    }
    if (!Number.isFinite(min)) return { valeur: '—', aide: ind.aide }
    const f = (t: number) => {
      const d = new Date(t)
      return `${d.getUTCDate()} ${moisCourt(d.getUTCMonth())} ${d.getUTCFullYear()}`
    }
    return { valeur: `${f(min)} → ${f(max)}`, aide: ind.aide }
  }

  const nombres: number[] = []
  for (const l of table.lignes) {
    const n = valeurNumerique(l[c] ?? '')
    if (n !== null) nombres.push(n)
  }
  if (nombres.length === 0) return { valeur: '—', aide: ind.aide }

  const somme = nombres.reduce((a, b) => a + b, 0)
  const valeur =
    ind.calcul === 'somme'
      ? somme
      : ind.calcul === 'moyenne'
        ? somme / nombres.length
        : ind.calcul === 'min'
          ? Math.min(...nombres)
          : Math.max(...nombres)
  return { valeur: formaterCourt(valeur, ind.format), aide: ind.aide }
}

function agreger(
  table: Table,
  colCategorie: number,
  colValeur: number,
  calcul: 'compte' | 'somme' | 'moyenne',
): Point[] {
  const cumul = new Map<string, { total: number; n: number }>()
  for (const ligne of table.lignes) {
    const cle = (ligne[colCategorie] ?? '').trim() || '(vide)'
    const entree = cumul.get(cle) ?? { total: 0, n: 0 }
    if (calcul === 'compte') {
      entree.total += 1
    } else {
      const v = valeurNumerique(ligne[colValeur] ?? '')
      if (v === null) continue
      entree.total += v
    }
    entree.n += 1
    cumul.set(cle, entree)
  }
  return [...cumul.entries()].map(([label, { total, n }]) => ({
    label,
    valeur: calcul === 'moyenne' ? total / n : total,
  }))
}

export function calculerBarres(table: Table, bloc: BlocBarres): Point[] {
  const cat = indexColonne(table, bloc.categorie)
  if (cat === -1) return []
  const val = indexColonne(table, bloc.valeur)
  if (bloc.calcul !== 'compte' && val === -1) return []
  const limite = Math.min(Math.max(bloc.limite ?? 8, 2), 15)
  const points = agreger(table, cat, val, bloc.calcul).sort((a, b) => b.valeur - a.valeur)
  if (points.length <= limite) return points
  const gardes = points.slice(0, limite)
  const reste = points.slice(limite).reduce((n, p) => n + p.valeur, 0)
  if (reste > 0) gardes.push({ label: 'Autres', valeur: reste })
  return gardes
}

export function calculerRepartition(table: Table, bloc: BlocRepartition): Point[] {
  return calculerBarres(table, {
    type: 'barres',
    titre: bloc.titre,
    categorie: bloc.categorie,
    calcul: 'compte',
    limite: Math.min(bloc.limite ?? 6, 6),
  })
}

export function calculerEvolution(table: Table, bloc: BlocEvolution): Point[] {
  const cd = indexColonne(table, bloc.date)
  if (cd === -1) return []
  const cv = indexColonne(table, bloc.valeur)
  if (bloc.calcul === 'somme' && cv === -1) return []

  const dates: { t: number; v: number }[] = []
  for (const ligne of table.lignes) {
    const d = lireDate(ligne[cd] ?? '')
    if (!d) continue
    const v = bloc.calcul === 'compte' ? 1 : (valeurNumerique(ligne[cv] ?? '') ?? 0)
    dates.push({ t: Date.UTC(d.annee, d.mois - 1, d.jour), v })
  }
  if (dates.length === 0) return []

  const min = Math.min(...dates.map((d) => d.t))
  const max = Math.max(...dates.map((d) => d.t))
  const jours = (max - min) / 86_400_000
  const granularite = bloc.granularite ?? (jours <= 62 ? 'jour' : jours <= 900 ? 'mois' : 'annee')

  const cumul = new Map<string, { label: string; valeur: number; ordre: number }>()
  for (const { t, v } of dates) {
    const d = new Date(t)
    let cle: string
    let label: string
    let ordre: number
    if (granularite === 'jour') {
      cle = d.toISOString().slice(0, 10)
      label = `${d.getUTCDate()} ${moisCourt(d.getUTCMonth())}`
      ordre = t
    } else if (granularite === 'mois') {
      cle = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      label = `${moisCourt(d.getUTCMonth())} ${String(d.getUTCFullYear()).slice(2)}`
      ordre = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
    } else {
      cle = String(d.getUTCFullYear())
      label = cle
      ordre = Date.UTC(d.getUTCFullYear(), 0, 1)
    }
    const e = cumul.get(cle) ?? { label, valeur: 0, ordre }
    e.valeur += v
    cumul.set(cle, e)
  }
  return [...cumul.values()].sort((a, b) => a.ordre - b.ordre).map(({ label, valeur }) => ({ label, valeur }))
}

export function calculerTableau(
  table: Table,
  bloc: BlocTableau,
): { entetes: string[]; lignes: string[][] } {
  const index = bloc.colonnes.map((n) => indexColonne(table, n)).filter((i) => i !== -1)
  const colonnes = index.length > 0 ? index : table.entetes.map((_, i) => i).slice(0, 6)
  let lignes = table.lignes
  if (bloc.tri) {
    const c = indexColonne(table, bloc.tri.colonne)
    if (c !== -1) {
      const sens = bloc.tri.sens === 'asc' ? 1 : -1
      lignes = lignes.slice().sort((a, b) => {
        const na = valeurNumerique(a[c] ?? '')
        const nb = valeurNumerique(b[c] ?? '')
        if (na !== null && nb !== null) return (na - nb) * sens
        // Ce qui n'est pas un nombre (ou est vide) passe toujours en dernier.
        if (na !== null) return -1
        if (nb !== null) return 1
        return (a[c] ?? '').localeCompare(b[c] ?? '', 'fr') * sens
      })
    }
  }
  const limite = Math.min(Math.max(bloc.limite ?? 10, 1), 100)
  return {
    entetes: colonnes.map((i) => table.entetes[i]),
    lignes: lignes.slice(0, limite).map((l) => colonnes.map((i) => l[i] ?? '')),
  }
}

/* ---------------------------- plan local (sans IA) ---------------------------- */

export function planLocal(table: Table, profils: ProfilColonne[], nomFichier: string): Plan {
  const utiles = profils.filter((p) => p.type !== 'vide')
  const montants = utiles
    .filter((p) => p.type === 'montant')
    .sort((a, b) => (b.somme ?? 0) - (a.somme ?? 0))
  const nombres = utiles
    .filter((p) => p.type === 'nombre')
    .sort((a, b) => (b.somme ?? 0) - (a.somme ?? 0))
  const mesure = montants[0] ?? nombres[0]
  const dates = utiles.filter((p) => p.type === 'date')
  const categories = utiles
    .filter((p) => (p.type === 'categorie' || p.type === 'booleen') && p.distinct >= 2)
    .sort((a, b) => a.distinct - b.distinct)

  const format: Format = mesure?.type === 'montant' ? 'euro' : 'nombre'

  const indicateurs: Indicateur[] = [
    { titre: 'Lignes', calcul: 'nombre_lignes', aide: 'après nettoyage' },
  ]
  if (mesure) {
    indicateurs.push(
      { titre: 'Total', colonne: mesure.nom, calcul: 'somme', format, aide: mesure.nom },
      { titre: 'Moyenne', colonne: mesure.nom, calcul: 'moyenne', format, aide: mesure.nom },
      { titre: 'Maximum', colonne: mesure.nom, calcul: 'max', format, aide: mesure.nom },
    )
  }

  // Le camembert prend la colonne la moins variée, les barres la plus variée :
  // c'est là que la comparaison apprend quelque chose.
  const pourDonut = categories.find((c) => c.distinct >= 2 && c.distinct <= 6)
  const pourBarres =
    categories.filter((c) => c !== pourDonut).sort((a, b) => b.distinct - a.distinct)[0] ??
    (pourDonut && categories.length === 1 ? pourDonut : undefined)
  const donutRetenu = pourDonut && pourDonut !== pourBarres ? pourDonut : undefined

  const pourCompter = pourDonut ?? categories[0]
  if (pourCompter) {
    indicateurs.push({
      titre: pourCompter.nom,
      colonne: pourCompter.nom,
      calcul: 'distinct',
      aide: 'valeurs distinctes',
    })
  }
  if (dates[0]) {
    indicateurs.push({ titre: 'Période couverte', colonne: dates[0].nom, calcul: 'periode' })
  }

  const blocs: Bloc[] = []
  if (dates[0]) {
    blocs.push({
      type: 'evolution',
      titre: mesure ? `${mesure.nom} dans le temps` : 'Volume dans le temps',
      date: dates[0].nom,
      valeur: mesure?.nom,
      calcul: mesure ? 'somme' : 'compte',
      format,
    })
  }
  if (pourBarres) {
    blocs.push({
      type: 'barres',
      titre: mesure
        ? `${mesure.nom} par ${pourBarres.nom.toLowerCase()}`
        : `Nombre de lignes par ${pourBarres.nom.toLowerCase()}`,
      categorie: pourBarres.nom,
      valeur: mesure?.nom,
      calcul: mesure ? 'somme' : 'compte',
      limite: 8,
      format,
    })
  }
  if (donutRetenu) {
    blocs.push({
      type: 'repartition',
      titre: `Répartition par ${donutRetenu.nom.toLowerCase()}`,
      categorie: donutRetenu.nom,
    })
  }

  const colonnesTableau = utiles
    .filter((p) => p.type !== 'identifiant' || utiles.length <= 4)
    .slice(0, 7)
    .map((p) => p.nom)
  blocs.push({
    type: 'tableau',
    titre: mesure ? 'Les 10 lignes les plus élevées' : 'Aperçu des données',
    colonnes: colonnesTableau,
    tri: mesure ? { colonne: mesure.nom, sens: 'desc' } : undefined,
    limite: 10,
    aide: mesure ? `triées sur « ${mesure.nom} », de la plus grande à la plus petite` : undefined,
  })

  const morceaux: string[] = [`${table.lignes.length.toLocaleString('fr-FR')} lignes`]
  if (mesure?.somme !== undefined)
    morceaux.push(`${formater(mesure.somme, format)} au total sur « ${mesure.nom} »`)
  if (dates[0]?.debut) morceaux.push(`du ${dateLisible(dates[0].debut)} au ${dateLisible(dates[0].fin!)}`)

  return {
    titre: nomFichier.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    resume: `${morceaux.join(', ')}.`,
    indicateurs,
    blocs,
  }
}

/* ------------------------------ validation IA ------------------------------ */

const CALCULS_IND = new Set(['nombre_lignes', 'somme', 'moyenne', 'min', 'max', 'distinct', 'periode'])
const FORMATS = new Set(['nombre', 'euro', 'pourcent', 'texte'])

/** Garde uniquement ce qui pointe vers des colonnes existantes. */
export function validerPlan(brut: unknown, table: Table): Plan | null {
  if (typeof brut !== 'object' || brut === null) return null
  const o = brut as Record<string, unknown>
  const existe = (nom: unknown) => typeof nom === 'string' && indexColonne(table, nom) !== -1

  const indicateurs: Indicateur[] = Array.isArray(o.indicateurs)
    ? (o.indicateurs as Record<string, unknown>[])
        .filter(
          (i) =>
            typeof i?.titre === 'string' &&
            typeof i?.calcul === 'string' &&
            CALCULS_IND.has(i.calcul) &&
            (i.calcul === 'nombre_lignes' || existe(i.colonne)),
        )
        .slice(0, 6)
        .map((i) => ({
          titre: String(i.titre),
          colonne: typeof i.colonne === 'string' ? i.colonne : undefined,
          calcul: i.calcul as Indicateur['calcul'],
          format: FORMATS.has(String(i.format)) ? (i.format as Format) : undefined,
          aide: typeof i.aide === 'string' ? i.aide : undefined,
        }))
    : []

  const blocs: Bloc[] = Array.isArray(o.blocs)
    ? (o.blocs as Record<string, unknown>[])
        .map((b): Bloc | null => {
          const titre = typeof b?.titre === 'string' ? b.titre : ''
          const aide = typeof b?.aide === 'string' ? b.aide : undefined
          if (b?.type === 'barres' && existe(b.categorie)) {
            const calcul = ['compte', 'somme', 'moyenne'].includes(String(b.calcul))
              ? (b.calcul as BlocBarres['calcul'])
              : 'compte'
            if (calcul !== 'compte' && !existe(b.valeur)) return null
            return {
              type: 'barres',
              titre,
              categorie: String(b.categorie),
              valeur: typeof b.valeur === 'string' ? b.valeur : undefined,
              calcul,
              limite: typeof b.limite === 'number' ? b.limite : undefined,
              format: FORMATS.has(String(b.format)) ? (b.format as Format) : undefined,
              aide,
            }
          }
          if (b?.type === 'evolution' && existe(b.date)) {
            const calcul = b.calcul === 'somme' ? 'somme' : 'compte'
            if (calcul === 'somme' && !existe(b.valeur)) return null
            return {
              type: 'evolution',
              titre,
              date: String(b.date),
              valeur: typeof b.valeur === 'string' ? b.valeur : undefined,
              calcul,
              granularite: ['jour', 'mois', 'annee'].includes(String(b.granularite))
                ? (b.granularite as BlocEvolution['granularite'])
                : undefined,
              format: FORMATS.has(String(b.format)) ? (b.format as Format) : undefined,
              aide,
            }
          }
          if (b?.type === 'repartition' && existe(b.categorie)) {
            return {
              type: 'repartition',
              titre,
              categorie: String(b.categorie),
              limite: typeof b.limite === 'number' ? b.limite : undefined,
              aide,
            }
          }
          if (b?.type === 'tableau' && Array.isArray(b.colonnes)) {
            const colonnes = (b.colonnes as unknown[]).filter(existe).map(String)
            if (colonnes.length === 0) return null
            return {
              type: 'tableau',
              titre,
              colonnes,
              tri:
                typeof b.tri === 'object' && b.tri !== null && existe((b.tri as any).colonne)
                  ? {
                      colonne: String((b.tri as any).colonne),
                      sens: (b.tri as any).sens === 'asc' ? 'asc' : 'desc',
                    }
                  : undefined,
              limite: typeof b.limite === 'number' ? b.limite : undefined,
              aide,
            }
          }
          return null
        })
        .filter((b): b is Bloc => b !== null)
        .slice(0, 6)
    : []

  if (indicateurs.length === 0 && blocs.length === 0) return null

  return {
    titre: typeof o.titre === 'string' ? o.titre : 'Rapport',
    resume: typeof o.resume === 'string' ? o.resume : '',
    indicateurs,
    blocs,
  }
}
