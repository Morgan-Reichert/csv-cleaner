import { useRef, useState } from 'react'
import { LogoSignature } from './Logo'
import { IconeDepot, IconeDonneeBarree, IconeEtiquette, IconeGlobe, IconeSablier } from './Icones'

type Props = {
  chargement: boolean
  onFichier: (fichier: File) => void
  onExemple: () => void
}

const ENGAGEMENTS = [
  { Icone: IconeGlobe, texte: 'Pour un net libre' },
  { Icone: IconeDonneeBarree, texte: 'Aucune donnée stockée' },
  { Icone: IconeEtiquette, texte: '100 % gratuit' },
]

export function Accueil({ chargement, onFichier, onExemple }: Props) {
  const [survol, setSurvol] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  return (
    <main className="accueil">
      <div className="accueil-marque">
        <LogoSignature hauteur={58} />
      </div>

      <ul className="engagements">
        {ENGAGEMENTS.map(({ Icone, texte }) => (
          <li key={texte}>
            <Icone taille={20} />
            {texte}
          </li>
        ))}
      </ul>

      <div
        className={`depot ${survol ? 'survol' : ''} ${chargement ? 'occupe' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setSurvol(true)
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault()
          setSurvol(false)
          const fichier = e.dataTransfer.files[0]
          if (fichier) onFichier(fichier)
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') input.current?.click()
        }}
      >
        <input
          ref={input}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          hidden
          onChange={(e) => {
            const fichier = e.target.files?.[0]
            if (fichier) onFichier(fichier)
            e.target.value = ''
          }}
        />
        {chargement ? (
          <>
            <IconeSablier taille={40} className="tourne" />
            <p className="depot-titre">Lecture du fichier…</p>
          </>
        ) : (
          <>
            <IconeDepot taille={40} />
            <p className="depot-titre">Déposez votre fichier CSV</p>
            <p className="depot-aide">ou cliquez pour le choisir</p>
          </>
        )}
      </div>

      <p className="essai">
        <button className="lien" onClick={onExemple} disabled={chargement}>
          Essayer avec un fichier d’exemple
        </button>
      </p>
    </main>
  )
}
