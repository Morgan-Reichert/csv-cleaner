/** Jeu d'icônes maison : traits de 1,75, 24×24, couleur héritée du texte. */

type Props = { taille?: number; className?: string }

function Svg({ taille = 18, className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const IconeDepot = (p: Props) => (
  <Svg {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
  </Svg>
)

export const IconeCadenas = (p: Props) => (
  <Svg {...p}>
    <rect x="4" y="10.5" width="16" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </Svg>
)

export const IconeGlobe = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
  </Svg>
)

export const IconeDonneeBarree = (p: Props) => (
  <Svg {...p}>
    <ellipse cx="12" cy="6" rx="7.5" ry="3" />
    <path d="M4.5 6v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
    <path d="M4.5 11.5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
    <path d="m3 3 18 18" />
  </Svg>
)

export const IconeEtiquette = (p: Props) => (
  <Svg {...p}>
    <path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </Svg>
)

export const IconeCheck = (p: Props) => (
  <Svg {...p}>
    <path d="m5 13 4 4L19 7" />
  </Svg>
)

export const IconeCheckCercle = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Svg>
)

export const IconeAlerte = (p: Props) => (
  <Svg {...p}>
    <path d="M10.3 4 2.4 17.9A1.9 1.9 0 0 0 4 20.8h16a1.9 1.9 0 0 0 1.6-2.9L13.7 4a1.9 1.9 0 0 0-3.4 0z" />
    <path d="M12 9.5v4" />
    <path d="M12 17.2h.01" />
  </Svg>
)

export const IconeInfo = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5" />
    <path d="M12 7.7h.01" />
  </Svg>
)

export const IconeAnnuler = (p: Props) => (
  <Svg {...p}>
    <path d="M3 8v5h5" />
    <path d="M3.9 13a8.5 8.5 0 1 0 2.2-6.1L3 9.6" />
  </Svg>
)

export const IconeTelecharger = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3v11" />
    <path d="m7.5 10 4.5 4.5 4.5-4.5" />
    <path d="M4.5 20.5h15" />
  </Svg>
)

export const IconeSoleil = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </Svg>
)

export const IconeLune = (p: Props) => (
  <Svg {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
)

export const IconeChevronGauche = (p: Props) => (
  <Svg {...p}>
    <path d="m14.5 5-7 7 7 7" />
  </Svg>
)

export const IconeChevronDroite = (p: Props) => (
  <Svg {...p}>
    <path d="m9.5 5 7 7-7 7" />
  </Svg>
)

export const IconeCroix = (p: Props) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const IconeImprimante = (p: Props) => (
  <Svg {...p}>
    <path d="M6.5 9V3.5h11V9" />
    <path d="M6.5 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2.5" />
    <rect x="6.5" y="14" width="11" height="6.5" rx="1" />
  </Svg>
)

export const IconeEtincelle = (p: Props) => (
  <Svg {...p}>
    <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M18.5 16.5 19 18l1.5.5L19 19l-.5 1.5-.5-1.5L16.5 18l1.5-.5z" />
  </Svg>
)

export const IconeOeil = (p: Props) => (
  <Svg {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
)

export const IconeBalai = (p: Props) => (
  <Svg {...p}>
    <path d="m20.5 3.5-7 7" />
    <path d="M13.2 10.3 16 13.1l-4.6 4.6a3.2 3.2 0 0 1-4.5 0l-.6-.6a3.2 3.2 0 0 1 0-4.5z" />
    <path d="M4 20.5c1.5-1 2.6-2.2 3.3-3.6M8.5 21c1.3-1 2.2-2.2 2.8-3.6" />
  </Svg>
)

export const IconeGraphique = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20.5h17" />
    <path d="M6.5 20.5V11M12 20.5V4.5M17.5 20.5v-6.5" />
  </Svg>
)

export const IconeFichier = (p: Props) => (
  <Svg {...p}>
    <path d="M14 3v5h5" />
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
  </Svg>
)

export const IconeSablier = ({ taille = 18, className }: Props) => (
  <svg
    width={taille}
    height={taille}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      opacity="0.2"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
)
