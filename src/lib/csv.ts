/**
 * Parseur / sérialiseur CSV maison (RFC 4180 tolérant).
 * Tout tourne dans le navigateur : aucune donnée ne sort de la machine.
 */

export type Table = {
  entetes: string[]
  lignes: string[][]
}

export const SEPARATEURS: { car: string; nom: string }[] = [
  { car: ';', nom: 'point-virgule' },
  { car: ',', nom: 'virgule' },
  { car: '\t', nom: 'tabulation' },
  { car: '|', nom: 'barre verticale' },
]

export function nomSeparateur(car: string): string {
  return SEPARATEURS.find((s) => s.car === car)?.nom ?? `« ${car} »`
}

/** Découpe le texte en lignes de champs. */
export function parserCsv(texte: string, sep: string, maxLignes = Infinity): string[][] {
  const out: string[][] = []
  let ligne: string[] = []
  const n = texte.length
  const codeSep = sep.charCodeAt(0)
  let i = 0

  while (i < n) {
    let valeur: string

    if (texte.charCodeAt(i) === 34 /* " */) {
      i++
      let debut = i
      let morceaux = ''
      for (;;) {
        const q = texte.indexOf('"', i)
        if (q === -1) {
          morceaux += texte.slice(debut)
          i = n
          break
        }
        if (texte.charCodeAt(q + 1) === 34) {
          morceaux += texte.slice(debut, q + 1)
          i = q + 2
          debut = i
          continue
        }
        morceaux += texte.slice(debut, q)
        i = q + 1
        break
      }
      valeur = morceaux
      // On ignore ce qui traîne après le guillemet fermant jusqu'au séparateur.
      while (i < n) {
        const c = texte.charCodeAt(i)
        if (c === codeSep || c === 10) break
        i++
      }
    } else {
      let j = i
      while (j < n) {
        const c = texte.charCodeAt(j)
        if (c === codeSep || c === 10) break
        j++
      }
      valeur = texte.slice(i, j)
      if (valeur.charCodeAt(valeur.length - 1) === 13 /* \r */) valeur = valeur.slice(0, -1)
      i = j
    }

    ligne.push(valeur)

    if (i >= n) break

    if (texte.charCodeAt(i) === codeSep) {
      i++
      if (i >= n) {
        ligne.push('')
        break
      }
      continue
    }

    // saut de ligne
    i++
    out.push(ligne)
    ligne = []
    if (out.length >= maxLignes) return out
  }

  if (ligne.length) out.push(ligne)
  return out
}

/**
 * Devine le séparateur : celui qui donne le découpage le plus régulier
 * sur les premières lignes.
 */
export function detecterSeparateur(texte: string): string {
  const echantillon = texte.slice(0, 200_000)
  let meilleur = ';'
  let meilleurScore = -1

  for (const { car } of SEPARATEURS) {
    const lignes = parserCsv(echantillon, car, 30).filter((l) => l.length > 0)
    if (lignes.length === 0) continue

    const comptes = new Map<number, number>()
    for (const l of lignes) comptes.set(l.length, (comptes.get(l.length) ?? 0) + 1)

    let champsDominant = 0
    let occurrences = 0
    for (const [champs, occ] of comptes) {
      if (occ > occurrences || (occ === occurrences && champs > champsDominant)) {
        champsDominant = champs
        occurrences = occ
      }
    }
    if (champsDominant < 2) continue

    const regularite = occurrences / lignes.length
    const score = regularite * 100 + Math.min(champsDominant, 30)
    if (score > meilleurScore) {
      meilleurScore = score
      meilleur = car
    }
  }
  return meilleur
}

export type OptionsExport = {
  separateur: string
  finDeLigne: '\r\n' | '\n'
  guillemets: 'minimal' | 'toujours'
}

function echapper(valeur: string, o: OptionsExport): string {
  if (o.guillemets === 'toujours') return `"${valeur.replace(/"/g, '""')}"`
  const doit =
    valeur.includes(o.separateur) ||
    valeur.includes('"') ||
    valeur.includes('\n') ||
    valeur.includes('\r')
  return doit ? `"${valeur.replace(/"/g, '""')}"` : valeur
}

export function serialiserCsv(table: Table, o: OptionsExport): string {
  const morceaux: string[] = []
  morceaux.push(table.entetes.map((e) => echapper(e, o)).join(o.separateur))
  const largeur = table.entetes.length
  for (const ligne of table.lignes) {
    const cellules: string[] = []
    for (let i = 0; i < largeur; i++) cellules.push(echapper(ligne[i] ?? '', o))
    morceaux.push(cellules.join(o.separateur))
  }
  return morceaux.join(o.finDeLigne) + o.finDeLigne
}

export function serialiserJson(table: Table): string {
  const objets = table.lignes.map((ligne) => {
    const o: Record<string, string> = {}
    table.entetes.forEach((e, i) => {
      o[e] = ligne[i] ?? ''
    })
    return o
  })
  return JSON.stringify(objets, null, 2)
}

export function cellule(table: Table, ligne: number, col: number): string {
  return table.lignes[ligne]?.[col] ?? ''
}

export function largeurReelle(table: Table): number {
  let max = table.entetes.length
  for (const l of table.lignes) if (l.length > max) max = l.length
  return max
}
