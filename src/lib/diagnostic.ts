/**
 * Diagnostic automatique : ce qui cloche dans le fichier, et le bouton
 * qui le répare. Chaque correction renvoie une nouvelle table (immuable),
 * ce qui permet d'annuler proprement.
 */

import type { Table } from './csv'
import { contientMojibake, reparerMojibake } from './encodage'
import {
  aEspacesSuperflus,
  casseNomPropre,
  ecrireDate,
  estNombreFr,
  estToutEnMajuscules,
  lireDate,
  nettoyerEspaces,
  nombreASalir,
  normaliserNombre,
  type FormatCible,
} from './valeurs'

const SEP_CLE = String.fromCharCode(1)

export type Gravite = 'bloquant' | 'important' | 'mineur'

export type ResultatCorrection = { table: Table; nombre: number }

export type Probleme = {
  id: string
  titre: string
  detail: string
  gravite: Gravite
  nombre: number
  unite: string
  colonnes: number[]
  libelleCorrection: string
  corriger: (t: Table) => ResultatCorrection
  marqueCellule?: (valeur: string, col: number) => boolean
  marqueLigne?: (ligne: string[]) => boolean
}

export type OptionsAnalyse = { formatDate: FormatCible }

type StatsColonne = {
  nonVides: number
  mojibake: number
  espaces: number
  nombresFr: number
  nombresASalir: number
  dates: Map<string, number>
  datesTotal: number
  majuscules: number
}

export type Statistiques = {
  lignes: number
  colonnes: number
  cellules: number
  cellulesVides: number
}

function colonneNom(table: Table, i: number): string {
  const nom = table.entetes[i]?.trim()
  return nom ? `« ${nom} »` : `colonne ${i + 1}`
}

function listerColonnes(table: Table, cols: number[]): string {
  const noms = cols.map((c) => colonneNom(table, c))
  if (noms.length <= 3) return noms.join(', ')
  return `${noms.slice(0, 3).join(', ')} et ${noms.length - 3} autre${noms.length - 3 > 1 ? 's' : ''}`
}

function pluriel(n: number, singulier: string, plurielMot = singulier + 's'): string {
  return `${n.toLocaleString('fr-FR')} ${n > 1 ? plurielMot : singulier}`
}

/** Accord du verbe : accord(3, 'contient', 'contiennent') → « contiennent ». */
function accord(n: number, singulier: string, plurielMot: string): string {
  return n > 1 ? plurielMot : singulier
}

export function statistiques(table: Table): Statistiques {
  let vides = 0
  const largeur = table.entetes.length
  for (const ligne of table.lignes) {
    for (let c = 0; c < largeur; c++) {
      if ((ligne[c] ?? '').trim() === '') vides++
    }
  }
  return {
    lignes: table.lignes.length,
    colonnes: largeur,
    cellules: table.lignes.length * largeur,
    cellulesVides: vides,
  }
}

/** Applique une transformation cellule par cellule et compte les changements. */
function transformer(
  table: Table,
  colonnes: number[] | null,
  f: (valeur: string, col: number) => string,
): ResultatCorrection {
  let nombre = 0
  const cible = colonnes ? new Set(colonnes) : null
  const lignes = table.lignes.map((ligne) => {
    let modifiee: string[] | null = null
    for (let c = 0; c < ligne.length; c++) {
      if (cible && !cible.has(c)) continue
      const avant = ligne[c]
      const apres = f(avant, c)
      if (apres !== avant) {
        if (!modifiee) modifiee = ligne.slice()
        modifiee[c] = apres
        nombre++
      }
    }
    return modifiee ?? ligne
  })
  return { table: { ...table, lignes }, nombre }
}

export function analyser(table: Table, options: OptionsAnalyse): Probleme[] {
  const problemes: Probleme[] = []
  const largeur = table.entetes.length

  const stats: StatsColonne[] = Array.from({ length: largeur }, () => ({
    nonVides: 0,
    mojibake: 0,
    espaces: 0,
    nombresFr: 0,
    nombresASalir: 0,
    dates: new Map<string, number>(),
    datesTotal: 0,
    majuscules: 0,
  }))

  let mojibakeTotal = 0
  let espacesTotal = 0
  const indexLignesVides: number[] = []
  let lignesIncoherentes = 0
  const vues = new Set<string>()
  let doublons = 0

  table.lignes.forEach((ligne, index) => {
    let vide = true
    const cle = ligne.join(SEP_CLE)
    if (vues.has(cle)) doublons++
    else vues.add(cle)

    if (ligne.length !== largeur) lignesIncoherentes++

    for (let c = 0; c < ligne.length; c++) {
      const v = ligne[c]
      if (v === undefined) continue
      if (v.trim() !== '') vide = false
      if (contientMojibake(v)) {
        mojibakeTotal++
        if (c < largeur) stats[c].mojibake++
      }
      if (aEspacesSuperflus(v)) {
        espacesTotal++
        if (c < largeur) stats[c].espaces++
      }
      if (c >= largeur) continue
      const s = stats[c]
      const t = v.trim()
      if (t === '') continue
      s.nonVides++
      if (estNombreFr(t)) {
        s.nombresFr++
        if (nombreASalir(t)) s.nombresASalir++
      }
      const d = lireDate(t)
      if (d) {
        s.datesTotal++
        s.dates.set(d.format, (s.dates.get(d.format) ?? 0) + 1)
      }
      if (estToutEnMajuscules(t)) s.majuscules++
    }
    if (vide) indexLignesVides.push(index)
  })

  /* --------------------------- 1. accents cassés --------------------------- */
  const mojibakeEntetes = table.entetes.filter(contientMojibake).length
  if (mojibakeTotal + mojibakeEntetes > 0) {
    problemes.push({
      id: 'encodage',
      titre: 'Accents cassés',
      detail: `${pluriel(mojibakeTotal + mojibakeEntetes, 'valeur')} ${accord(mojibakeTotal + mojibakeEntetes, 'contient', 'contiennent')} des « Ã© », « Ã¨ » ou « â€™ ». Le fichier a été enregistré en UTF-8 puis relu en ANSI.`,
      gravite: 'bloquant',
      nombre: mojibakeTotal + mojibakeEntetes,
      unite: 'valeur',
      colonnes: stats.flatMap((s, i) => (s.mojibake > 0 ? [i] : [])),
      libelleCorrection: 'Réparer les accents',
      marqueCellule: (v) => contientMojibake(v),
      corriger: (t) => {
        const entetes = t.entetes.map(reparerMojibake)
        const res = transformer({ ...t, entetes }, null, reparerMojibake)
        return { table: res.table, nombre: res.nombre + mojibakeEntetes }
      },
    })
  }

  /* ----------------------------- 2. en-têtes ------------------------------ */
  const entetesVides = table.entetes.filter((e) => e.trim() === '').length
  if (entetesVides > 0) {
    problemes.push({
      id: 'entetes-vides',
      titre: 'En-têtes sans nom',
      detail: `${pluriel(entetesVides, 'colonne')} ${accord(entetesVides, "n'a", "n'ont")} pas de nom. ${accord(entetesVides, "Elle sera nommée", "Elles seront nommées")} colonne_1, colonne_2…`,
      gravite: 'important',
      nombre: entetesVides,
      unite: 'colonne',
      colonnes: table.entetes.flatMap((e, i) => (e.trim() === '' ? [i] : [])),
      libelleCorrection: 'Nommer les colonnes',
      corriger: (t) => {
        let nombre = 0
        const entetes = t.entetes.map((e, i) => {
          if (e.trim() !== '') return e
          nombre++
          return `colonne_${i + 1}`
        })
        return { table: { ...t, entetes }, nombre }
      },
    })
  }

  const vus = new Map<string, number>()
  const doublonsEntetes: number[] = []
  table.entetes.forEach((e, i) => {
    const cle = e.trim().toLowerCase()
    if (cle === '') return
    if (vus.has(cle)) doublonsEntetes.push(i)
    else vus.set(cle, i)
  })
  if (doublonsEntetes.length > 0) {
    problemes.push({
      id: 'entetes-doublons',
      titre: 'En-têtes en double',
      detail: `${listerColonnes(table, doublonsEntetes)} : le même nom apparaît plusieurs fois, ce qui casse la plupart des imports.`,
      gravite: 'important',
      nombre: doublonsEntetes.length,
      unite: 'colonne',
      colonnes: doublonsEntetes,
      libelleCorrection: 'Rendre les noms uniques',
      corriger: (t) => {
        const compteur = new Map<string, number>()
        let nombre = 0
        const entetes = t.entetes.map((e) => {
          const cle = e.trim().toLowerCase()
          const vu = compteur.get(cle) ?? 0
          compteur.set(cle, vu + 1)
          if (vu === 0 || cle === '') return e
          nombre++
          return `${e}_${vu + 1}`
        })
        return { table: { ...t, entetes }, nombre }
      },
    })
  }

  const entetesSales = table.entetes.flatMap((e, i) => (e !== '' && aEspacesSuperflus(e) ? [i] : []))
  if (entetesSales.length > 0) {
    problemes.push({
      id: 'entetes-espaces',
      titre: 'Espaces dans les en-têtes',
      detail: `${pluriel(entetesSales.length, 'en-tête')} ${accord(entetesSales.length, 'commence ou finit', 'commencent ou finissent')} par un espace — invisible à l'œil, fatal pour un import.`,
      gravite: 'important',
      nombre: entetesSales.length,
      unite: 'en-tête',
      colonnes: entetesSales,
      libelleCorrection: 'Nettoyer les en-têtes',
      corriger: (t) => {
        let nombre = 0
        const entetes = t.entetes.map((e) => {
          const propre = nettoyerEspaces(e)
          if (propre !== e) nombre++
          return propre
        })
        return { table: { ...t, entetes }, nombre }
      },
    })
  }

  /* ------------------------- 3. structure des lignes ----------------------- */
  if (lignesIncoherentes > 0) {
    problemes.push({
      id: 'lignes-incoherentes',
      titre: 'Lignes mal découpées',
      detail: `${pluriel(lignesIncoherentes, 'ligne')} ${accord(lignesIncoherentes, "n'a", "n'ont")} pas le même nombre de colonnes que l'en-tête (${largeur}). Souvent un séparateur ou un guillemet oublié dans une valeur.`,
      gravite: 'bloquant',
      nombre: lignesIncoherentes,
      unite: 'ligne',
      colonnes: [],
      libelleCorrection: 'Aligner sur l’en-tête',
      marqueLigne: (l) => l.length !== largeur,
      corriger: (t) => {
        let nombre = 0
        const lignes = t.lignes.map((l) => {
          if (l.length === largeur) return l
          nombre++
          const copie = l.slice(0, largeur)
          while (copie.length < largeur) copie.push('')
          return copie
        })
        return { table: { ...t, lignes }, nombre }
      },
    })
  }

  if (indexLignesVides.length > 0) {
    const set = new Set(indexLignesVides)
    problemes.push({
      id: 'lignes-vides',
      titre: 'Lignes vides',
      detail: `${pluriel(indexLignesVides.length, 'ligne')} ne ${accord(indexLignesVides.length, 'contient', 'contiennent')} rien du tout.`,
      gravite: 'important',
      nombre: indexLignesVides.length,
      unite: 'ligne',
      colonnes: [],
      libelleCorrection: 'Supprimer ces lignes',
      marqueLigne: (l) => l.every((v) => (v ?? '').trim() === ''),
      corriger: (t) => ({
        table: { ...t, lignes: t.lignes.filter((_, i) => !set.has(i)) },
        nombre: set.size,
      }),
    })
  }

  if (doublons > 0) {
    problemes.push({
      id: 'doublons',
      titre: 'Lignes en double',
      detail: `${pluriel(doublons, 'ligne')} ${accord(doublons, 'est strictement identique', 'sont strictement identiques')} à une ligne précédente.`,
      gravite: 'important',
      nombre: doublons,
      unite: 'ligne',
      colonnes: [],
      libelleCorrection: 'Ne garder que la première',
      corriger: (t) => {
        const vues2 = new Set<string>()
        const lignes: string[][] = []
        let nombre = 0
        for (const l of t.lignes) {
          const cle = l.join(SEP_CLE)
          if (vues2.has(cle)) {
            nombre++
            continue
          }
          vues2.add(cle)
          lignes.push(l)
        }
        return { table: { ...t, lignes }, nombre }
      },
    })
  }

  /* --------------------------- 4. colonnes vides --------------------------- */
  const colonnesVides = stats.flatMap((s, i) => (s.nonVides === 0 ? [i] : []))
  if (colonnesVides.length > 0 && colonnesVides.length < largeur) {
    const set = new Set(colonnesVides)
    problemes.push({
      id: 'colonnes-vides',
      titre: 'Colonnes entièrement vides',
      detail: `${listerColonnes(table, colonnesVides)} ne ${accord(colonnesVides.length, 'contient', 'contiennent')} aucune valeur.`,
      gravite: 'mineur',
      nombre: colonnesVides.length,
      unite: 'colonne',
      colonnes: colonnesVides,
      libelleCorrection: 'Supprimer ces colonnes',
      corriger: (t) => ({
        table: {
          entetes: t.entetes.filter((_, i) => !set.has(i)),
          lignes: t.lignes.map((l) => l.filter((_, i) => !set.has(i))),
        },
        nombre: set.size,
      }),
    })
  }

  /* -------------------------- 5. espaces superflus ------------------------- */
  if (espacesTotal > 0) {
    problemes.push({
      id: 'espaces',
      titre: 'Espaces superflus',
      detail: `${pluriel(espacesTotal, 'cellule')} ${accord(espacesTotal, 'commence ou finit', 'commencent ou finissent')} par un espace, ou contiennent des espaces insécables / doubles.`,
      gravite: 'important',
      nombre: espacesTotal,
      unite: 'cellule',
      colonnes: stats.flatMap((s, i) => (s.espaces > 0 ? [i] : [])),
      libelleCorrection: 'Nettoyer les espaces',
      marqueCellule: (v) => aEspacesSuperflus(v),
      corriger: (t) => transformer(t, null, nettoyerEspaces),
    })
  }

  /* ------------------------------ 6. nombres ------------------------------- */
  const colonnesNombres = stats.flatMap((s, i) =>
    s.nonVides >= 3 && s.nombresFr / s.nonVides >= 0.8 && s.nombresASalir > 0 ? [i] : [],
  )
  if (colonnesNombres.length > 0) {
    const total = colonnesNombres.reduce((n, i) => n + stats[i].nombresASalir, 0)
    problemes.push({
      id: 'nombres',
      titre: 'Nombres au format français',
      detail: `${listerColonnes(table, colonnesNombres)} : ${pluriel(total, 'valeur')} du type « 1 234,56 € ». Illisibles par un tableur configuré en anglais, une base ou un script.`,
      gravite: 'important',
      nombre: total,
      unite: 'valeur',
      colonnes: colonnesNombres,
      libelleCorrection: 'Convertir en 1234.56',
      marqueCellule: (v, c) => colonnesNombres.includes(c) && nombreASalir(v),
      corriger: (t) => transformer(t, colonnesNombres, (v) => normaliserNombre(v)),
    })
  }

  /* ------------------------------- 7. dates -------------------------------- */
  const colonnesDates = stats.flatMap((s, i) => {
    if (s.nonVides < 3 || s.datesTotal / s.nonVides < 0.8) return []
    const formats = [...s.dates.keys()]
    const heterogene = formats.length > 1
    const mauvaisFormat = formats.some((f) => f !== options.formatDate)
    return heterogene || mauvaisFormat ? [i] : []
  })
  if (colonnesDates.length > 0) {
    const total = colonnesDates.reduce((n, i) => n + stats[i].datesTotal, 0)
    const melangees = colonnesDates.some((i) => stats[i].dates.size > 1)
    problemes.push({
      id: 'dates',
      titre: melangees ? 'Dates à formats mélangés' : 'Format de date à harmoniser',
      detail: `${listerColonnes(table, colonnesDates)} : ${pluriel(total, 'date')} à passer en ${options.formatDate}.${melangees ? ' Plusieurs formats cohabitent dans la même colonne.' : ''} Les dates ambiguës sont lues à la française (jour/mois).`,
      gravite: melangees ? 'important' : 'mineur',
      nombre: total,
      unite: 'date',
      colonnes: colonnesDates,
      libelleCorrection: `Tout passer en ${options.formatDate}`,
      marqueCellule: (v, c) => {
        if (!colonnesDates.includes(c)) return false
        const d = lireDate(v)
        return d !== null && ecrireDate(d, options.formatDate) !== v.trim()
      },
      corriger: (t) =>
        transformer(t, colonnesDates, (v) => {
          const d = lireDate(v)
          return d ? ecrireDate(d, options.formatDate) : v
        }),
    })
  }

  /* -------------------------------- 8. casse ------------------------------- */
  const colonnesMajuscules = stats.flatMap((s, i) =>
    s.nonVides >= 3 && s.majuscules / s.nonVides >= 0.9 ? [i] : [],
  )
  if (colonnesMajuscules.length > 0) {
    const total = colonnesMajuscules.reduce((n, i) => n + stats[i].majuscules, 0)
    problemes.push({
      id: 'casse',
      titre: 'Colonnes tout en majuscules',
      detail: `${listerColonnes(table, colonnesMajuscules)} : ${pluriel(total, 'valeur')} en capitales. À convertir seulement s'il s'agit de noms — les codes et références doivent rester tels quels.`,
      gravite: 'mineur',
      nombre: total,
      unite: 'valeur',
      colonnes: colonnesMajuscules,
      libelleCorrection: 'Passer en Nom Propre',
      marqueCellule: (v, c) => colonnesMajuscules.includes(c) && estToutEnMajuscules(v),
      corriger: (t) =>
        transformer(t, colonnesMajuscules, (v) => (estToutEnMajuscules(v) ? casseNomPropre(v) : v)),
    })
  }

  const ordre: Record<Gravite, number> = { bloquant: 0, important: 1, mineur: 2 }
  return problemes.sort((a, b) => ordre[a.gravite] - ordre[b.gravite])
}
