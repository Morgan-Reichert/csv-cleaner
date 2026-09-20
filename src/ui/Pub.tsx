import { useEffect, useMemo, useRef, useState } from 'react'
import { debloquer, encartAuHasard, PUB } from '../lib/pub'
import { IconeCheck, IconeGraphique } from './Icones'

/**
 * Écran d'accès au rapport. Il n'y a rien à « regarder de force » : le compte
 * à rebours court tout seul et le bouton s'active à la fin.
 */
export function AccesRapport({
  onDebloque,
  onRetour,
}: {
  onDebloque: () => void
  onRetour: () => void
}) {
  const [restant, setRestant] = useState(PUB.secondes)
  const encart = useMemo(() => encartAuHasard(), [])
  const emplacement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const minuteur = setInterval(() => {
      setRestant((r) => (r <= 1 ? 0 : r - 1))
    }, 1000)
    return () => clearInterval(minuteur)
  }, [])

  // Régie externe : on injecte le script de l'annonceur dans l'emplacement.
  useEffect(() => {
    if (PUB.regie !== 'externe' || !PUB.scriptExterne || !emplacement.current) return
    const script = document.createElement('script')
    script.src = PUB.scriptExterne
    script.async = true
    emplacement.current.appendChild(script)
  }, [])

  const pret = restant === 0

  return (
    <main className="acces">
      <div className="acces-entete">
        <IconeGraphique taille={22} />
        <h2>Votre rapport est prêt</h2>
        <p>
          Le nettoyage et l’export sont libres d’accès. La mise en page du rapport est offerte
          par nos encarts : merci de nous laisser quelques secondes.
        </p>
      </div>

      <div className="encart" ref={emplacement}>
        {PUB.regie === 'maison' || !PUB.scriptExterne ? (
          <>
            <span className="encart-mention">Publicité</span>
            <span className="encart-surtitre">{encart.surtitre}</span>
            <h3>{encart.titre}</h3>
            <p>{encart.texte}</p>
            <a
              className="bouton-secondaire"
              href={encart.lien}
              target="_blank"
              rel="noopener noreferrer"
            >
              {encart.action}
            </a>
          </>
        ) : (
          <span className="encart-mention">Publicité</span>
        )}
      </div>

      <div className="acces-actions">
        <button
          className="bouton-principal"
          disabled={!pret}
          onClick={() => {
            debloquer()
            onDebloque()
          }}
        >
          {pret ? (
            <>
              <IconeCheck taille={17} />
              Ouvrir le rapport
            </>
          ) : (
            `Ouverture dans ${restant} s`
          )}
        </button>
        <button className="lien-discret" onClick={onRetour}>
          Revenir au nettoyage
        </button>
      </div>

      <p className="acces-note">
        Accès valable {PUB.heuresDeblocage} h sur cet appareil.
        {PUB.regie === 'maison'
          ? ' Ces encarts sont les nôtres : aucun script tiers, aucun cookie, aucun suivi.'
          : ' Cet emplacement est fourni par une régie tierce.'}
      </p>
    </main>
  )
}
