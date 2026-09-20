import { useState } from 'react'

/**
 * Les PNG du pack de marque sont des carrés 2000×2000 avec du vide autour :
 * on les recadre par le viewBox du SVG, au pixel près, sans retoucher les
 * fichiers d'origine. Version couleur en thème clair, version blanche en
 * thème sombre (les deux sont dans le pack).
 */

const SIGNATURE_COULEUR = { src: '/logopack/5.png', viewBox: '132 781 1682 439' }
const SIGNATURE_BLANCHE = { src: '/logopack/CSV.Cleaner.png', viewBox: '132 781 1682 439' }
const PICTO_COULEUR = { src: '/logopack/6.png', viewBox: '346 346 1307 1307' }
const PICTO_BLANC = { src: '/logopack/CSVicon.Cleaner.png', viewBox: '346 346 1307 1307' }

function Image({
  source,
  hauteur,
  classe,
}: {
  source: { src: string; viewBox: string }
  hauteur: number
  classe: string
}) {
  return (
    <svg
      viewBox={source.viewBox}
      style={{ height: hauteur, width: 'auto' }}
      className={classe}
      role="img"
      aria-label="CSV.Cleaner"
    >
      <image href={source.src} x="0" y="0" width="2000" height="2000" />
    </svg>
  )
}

/** Signature horizontale : pastille + « CSV.Cleaner ». */
export function LogoSignature({ hauteur = 30 }: { hauteur?: number }) {
  return (
    <span className="logo">
      <Image source={SIGNATURE_COULEUR} hauteur={hauteur} classe="logo-clair" />
      <Image source={SIGNATURE_BLANCHE} hauteur={hauteur} classe="logo-sombre" />
    </span>
  )
}

/** Pastille seule. */
export function LogoPicto({ taille = 28 }: { taille?: number }) {
  return (
    <span className="logo">
      <Image source={PICTO_COULEUR} hauteur={taille} classe="logo-clair" />
      <Image source={PICTO_BLANC} hauteur={taille} classe="logo-sombre" />
    </span>
  )
}

/**
 * Logo officiel du groupe éditeur. Tant que les fichiers ne sont pas déposés
 * dans `public/qlicklab/`, on retombe proprement sur le nom écrit.
 */
export function LogoQlicklab({ hauteur = 18 }: { hauteur?: number }) {
  const [absent, setAbsent] = useState(false)
  if (absent) return <span className="qlicklab-texte">QlickLab</span>
  return (
    <span className="logo logo-qlicklab">
      <img
        className="logo-clair"
        src="/qlicklab/wordmark.webp"
        alt="QlickLab"
        style={{ height: hauteur }}
        onError={() => setAbsent(true)}
      />
      <img
        className="logo-sombre"
        src="/qlicklab/wordmark-blanc.webp"
        alt="QlickLab"
        style={{ height: hauteur }}
        onError={() => setAbsent(true)}
      />
    </span>
  )
}
