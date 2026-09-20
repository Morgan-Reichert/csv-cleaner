/** Lecture / normalisation des nombres et des dates à la française. */

const ESPACES = /[\s  ]/g

/* ---------------------------------- nombres --------------------------------- */

/** « 1 234,56 € », « 12,5 », « 45 % », « -3,20 » … */
const RE_NOMBRE_FR = /^-?\d{1,3}(?:[\s  ]\d{3})*(?:,\d+)?\s*(?:€|%|EUR)?$/
const RE_NOMBRE_SIMPLE = /^-?\d+(?:,\d+)?\s*(?:€|%|EUR)?$/
/** Format anglo-saxon : on ne le touche pas, il est déjà exploitable. */
const RE_NOMBRE_EN = /^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/

export function estNombreFr(s: string): boolean {
  const v = s.trim()
  if (v === '' || RE_NOMBRE_EN.test(v)) return false
  return RE_NOMBRE_FR.test(v) || RE_NOMBRE_SIMPLE.test(v)
}

/** Vrai si la valeur a réellement besoin d'être nettoyée (virgule, espace, symbole). */
export function nombreASalir(s: string): boolean {
  const v = s.trim()
  if (!estNombreFr(v)) return false
  return /[,%€\s  ]|EUR/.test(v)
}

export function normaliserNombre(s: string): string {
  const v = s.trim()
  if (!estNombreFr(v)) return s
  const brut = v.replace(/€|EUR|%/g, '').replace(ESPACES, '').replace(',', '.')
  return brut
}

/* ----------------------------------- dates ---------------------------------- */

export type DateLue = {
  jour: number
  mois: number
  annee: number
  heure: string
  format: string
}

const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const RE_JMA = /^(\d{1,2})([/.\-])(\d{1,2})\2(\d{4})(?:[ T](\d{1,2}:\d{2}(?::\d{2})?))?$/
const RE_JMA_COURT = /^(\d{1,2})([/.\-])(\d{1,2})\2(\d{2})(?:[ T](\d{1,2}:\d{2}(?::\d{2})?))?$/
const RE_AMJ = /^(\d{4})([/.\-])(\d{1,2})\2(\d{1,2})(?:[ T](\d{1,2}:\d{2}(?::\d{2})?))?$/
const RE_TEXTE = /^(\d{1,2})(?:er)?\s+([a-zéûôA-ZÉÛÔ]+)\.?\s+(\d{4})$/

function valide(jour: number, mois: number, annee: number): boolean {
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31 || annee < 1900 || annee > 2200) return false
  const d = new Date(Date.UTC(annee, mois - 1, jour))
  return d.getUTCDate() === jour && d.getUTCMonth() === mois - 1
}

/** Les dates ambiguës sont lues à la française : jour / mois / année. */
export function lireDate(s: string): DateLue | null {
  const v = s.trim()
  if (v === '') return null

  let m = RE_AMJ.exec(v)
  if (m) {
    const [, a, sep, mo, j, h] = m
    const d = { annee: +a, mois: +mo, jour: +j, heure: h ?? '', format: sep === '-' ? 'aaaa-mm-jj' : `aaaa${sep}mm${sep}jj` }
    return valide(d.jour, d.mois, d.annee) ? d : null
  }

  m = RE_JMA.exec(v)
  if (m) {
    const [, j, sep, mo, a, h] = m
    const d = { jour: +j, mois: +mo, annee: +a, heure: h ?? '', format: `jj${sep}mm${sep}aaaa` }
    return valide(d.jour, d.mois, d.annee) ? d : null
  }

  m = RE_JMA_COURT.exec(v)
  if (m) {
    const [, j, sep, mo, a, h] = m
    const annee = +a + (+a <= 69 ? 2000 : 1900)
    const d = { jour: +j, mois: +mo, annee, heure: h ?? '', format: `jj${sep}mm${sep}aa` }
    return valide(d.jour, d.mois, d.annee) ? d : null
  }

  m = RE_TEXTE.exec(v)
  if (m) {
    const [, j, nomMois, a] = m
    const cible = nomMois.toLowerCase().replace(/\.$/, '')
    const index = MOIS_FR.findIndex((n) => n.startsWith(cible.slice(0, 3)))
    if (index === -1) return null
    const d = { jour: +j, mois: index + 1, annee: +a, heure: '', format: 'j mois aaaa' }
    return valide(d.jour, d.mois, d.annee) ? d : null
  }

  return null
}

export type FormatCible = 'aaaa-mm-jj' | 'jj/mm/aaaa'

export function ecrireDate(d: DateLue, cible: FormatCible): string {
  const jj = String(d.jour).padStart(2, '0')
  const mm = String(d.mois).padStart(2, '0')
  const base = cible === 'aaaa-mm-jj' ? `${d.annee}-${mm}-${jj}` : `${jj}/${mm}/${d.annee}`
  return d.heure ? `${base} ${d.heure}` : base
}

/* ------------------------------------ casse ---------------------------------- */

const PARTICULES = new Set(['de', 'du', 'des', 'le', 'la', 'les', 'van', 'von', 'da', 'di', 'et', 'd’', "d'"])

/** JEAN-PIERRE DE LA FONTAINE → Jean-Pierre de la Fontaine */
export function casseNomPropre(s: string): string {
  return s
    .toLocaleLowerCase('fr')
    .split(/(\s+)/)
    .map((mot, i) => {
      if (/^\s+$/.test(mot) || mot === '') return mot
      if (i > 0 && PARTICULES.has(mot)) return mot
      return mot
        .split(/([-'’])/)
        .map((bout) =>
          /[-'’]/.test(bout) || bout === ''
            ? bout
            : bout.charAt(0).toLocaleUpperCase('fr') + bout.slice(1),
        )
        .join('')
    })
    .join('')
}

export function estToutEnMajuscules(s: string): boolean {
  const v = s.trim()
  if (v.length < 3) return false
  if (!/\p{L}/u.test(v)) return false
  return v === v.toLocaleUpperCase('fr') && v !== v.toLocaleLowerCase('fr')
}

/* ---------------------------------- espaces ---------------------------------- */

export function aEspacesSuperflus(s: string): boolean {
  return s !== s.trim() || / | |​|[ \t]{2,}/.test(s)
}

export function nettoyerEspaces(s: string): string {
  return s
    .replace(/[  ]/g, ' ')
    .replace(/[​﻿]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/* ---------------------------------- en-têtes --------------------------------- */

export function versSnakeCase(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}
