/**
 * Détection d'encodage et réparation des accents cassés (mojibake).
 * Le cas classique en France : un CSV UTF-8 ouvert/enregistré en ANSI
 * par Excel, qui transforme « é » en « Ã© ».
 */

/** Caractères 0x80–0x9F propres à Windows-1252. */
const CP1252_HAUT: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„',
  0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ',
  0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ',
  0x8e: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“',
  0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
  0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›',
  0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
}

const VERS_CP1252 = new Map<string, number>()
for (const [octet, car] of Object.entries(CP1252_HAUT)) VERS_CP1252.set(car, Number(octet))

export type ResultatDecodage = {
  texte: string
  encodage: string
  bom: boolean
}

export function decoder(buffer: ArrayBuffer): ResultatDecodage {
  const octets = new Uint8Array(buffer)

  if (octets[0] === 0xef && octets[1] === 0xbb && octets[2] === 0xbf) {
    return {
      texte: new TextDecoder('utf-8').decode(octets.subarray(3)),
      encodage: 'UTF-8 (avec BOM)',
      bom: true,
    }
  }
  if (octets[0] === 0xff && octets[1] === 0xfe) {
    return {
      texte: new TextDecoder('utf-16le').decode(octets.subarray(2)),
      encodage: 'UTF-16 LE',
      bom: true,
    }
  }
  if (octets[0] === 0xfe && octets[1] === 0xff) {
    return {
      texte: new TextDecoder('utf-16be').decode(octets.subarray(2)),
      encodage: 'UTF-16 BE',
      bom: true,
    }
  }

  try {
    const texte = new TextDecoder('utf-8', { fatal: true }).decode(octets)
    return { texte, encodage: 'UTF-8', bom: false }
  } catch {
    return {
      texte: new TextDecoder('windows-1252').decode(octets),
      encodage: 'Windows-1252 (ANSI)',
      bom: false,
    }
  }
}

/** Caractères de continuation d'une séquence UTF-8 relue en Windows-1252. */
const SUITE =
  '[\\u0080-\\u00BF\\u0152\\u0153\\u0160\\u0161\\u0178\\u017D\\u017E\\u0192\\u02C6\\u02DC\\u2013\\u2014\\u2018\\u2019\\u201A\\u201C\\u201D\\u2020\\u2021\\u2022\\u2026\\u2030\\u2039\\u203A\\u20AC\\u2122]'

/**
 * Filtre rapide : un octet d'en-tête UTF-8 (0xC2–0xF4) suivi d'un octet de
 * continuation. « été » ou « à côté » ne déclenchent rien, « Ã© » si.
 */
const MOTIF_MOJIBAKE = new RegExp(`[\\u00C2-\\u00F4]${SUITE}`)

function versOctet(car: string): number | null {
  const point = car.codePointAt(0)!
  if (point <= 0xff) return point
  return VERS_CP1252.get(car) ?? null
}

/**
 * Ré-encode en octets Windows-1252 puis relit en UTF-8, séquence par séquence :
 * un passage non réparable ne condamne plus le reste de la cellule.
 */
export function reparerMojibake(s: string): string {
  if (!MOTIF_MOJIBAKE.test(s)) return s
  const decodeur = new TextDecoder('utf-8', { fatal: true })
  let sortie = ''
  let i = 0

  while (i < s.length) {
    const tete = versOctet(s[i])
    const longueur =
      tete === null
        ? 0
        : tete >= 0xc2 && tete <= 0xdf
          ? 2
          : tete >= 0xe0 && tete <= 0xef
            ? 3
            : tete >= 0xf0 && tete <= 0xf4
              ? 4
              : 0

    if (longueur > 0 && i + longueur <= s.length) {
      const octets = new Uint8Array(longueur)
      octets[0] = tete!
      let complete = true
      for (let k = 1; k < longueur; k++) {
        const suite = versOctet(s[i + k])
        if (suite === null || suite < 0x80 || suite > 0xbf) {
          complete = false
          break
        }
        octets[k] = suite
      }
      if (complete) {
        try {
          sortie += decodeur.decode(octets)
          i += longueur
          continue
        } catch {
          /* séquence invalide : on recopie le texte d'origine */
        }
      }
    }

    sortie += s[i]
    i++
  }
  return sortie
}

export function contientMojibake(s: string): boolean {
  return MOTIF_MOJIBAKE.test(s) && reparerMojibake(s) !== s
}

export type EncodageSortie = 'utf8-bom' | 'utf8' | 'cp1252'

export const ENCODAGES_SORTIE: { id: EncodageSortie; nom: string; aide: string }[] = [
  { id: 'utf8-bom', nom: 'UTF-8 avec BOM', aide: 'Recommandé : Excel affiche les accents correctement' },
  { id: 'utf8', nom: 'UTF-8', aide: 'Pour un import dans un outil technique, une base, un script' },
  { id: 'cp1252', nom: 'Windows-1252 (ANSI)', aide: 'Vieux logiciels métier qui refusent l’UTF-8' },
]

export function encoder(texte: string, encodage: EncodageSortie): Uint8Array {
  if (encodage === 'utf8') return new TextEncoder().encode(texte)
  if (encodage === 'utf8-bom') {
    const corps = new TextEncoder().encode(texte)
    const sortie = new Uint8Array(corps.length + 3)
    sortie.set([0xef, 0xbb, 0xbf], 0)
    sortie.set(corps, 3)
    return sortie
  }
  // Windows-1252 : les caractères hors table deviennent « ? »
  const sortie = new Uint8Array(texte.length)
  for (let i = 0; i < texte.length; i++) {
    const point = texte.codePointAt(i)!
    if (point <= 0xff) sortie[i] = point
    else sortie[i] = VERS_CP1252.get(texte[i]) ?? 0x3f
  }
  return sortie
}
