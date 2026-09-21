import type { EntreeJournal } from '../App'
import type { Gravite, Probleme } from '../lib/diagnostic'
import type { FormatCible } from '../lib/valeurs'
import {
  IconeAlerte,
  IconeAnnuler,
  IconeCheckCercle,
  IconeInfo,
  IconeOeil,
} from './Icones'

type Props = {
  problemes: Probleme[]
  actif: string | null
  onActif: (id: string | null) => void
  onAppliquer: (p: Probleme) => void
  onToutCorriger: () => void
  formatDate: FormatCible
  onFormatDate: (f: FormatCible) => void
  journal: EntreeJournal[]
  onAnnuler: () => void
  peutAnnuler: boolean
  onSnakeCase: () => void
}

const ETIQUETTE: Record<Gravite, string> = {
  bloquant: 'bloquant',
  important: 'important',
  mineur: 'mineur',
}

export function Diagnostic({
  problemes,
  actif,
  onActif,
  onAppliquer,
  onToutCorriger,
  formatDate,
  onFormatDate,
  journal,
  onAnnuler,
  peutAnnuler,
  onSnakeCase,
}: Props) {
  const corrigeables = problemes.filter((p) => p.gravite !== 'mineur')

  return (
    <div className="diagnostic">
      <div className="panneau-titre">
        <h2>Diagnostic</h2>
        {problemes.length > 0 && (
          <span className="pastille">{problemes.length}</span>
        )}
      </div>

      {problemes.length === 0 ? (
        <div className="succes">
          <IconeCheckCercle taille={26} />
          <p>
            <strong>Aucun problème détecté.</strong>
            <br />
            Le fichier est propre, vous pouvez l’exporter.
          </p>
        </div>
      ) : (
        <>
          {corrigeables.length > 1 && (
            <button className="bouton-principal large" onClick={onToutCorriger}>
              Tout corriger ({corrigeables.length} problèmes)
            </button>
          )}

          <ul className="liste-problemes">
            {problemes.map((p) => (
              <li
                key={p.id}
                className={`probleme ${p.gravite} ${actif === p.id ? 'actif' : ''}`}
                onClick={() => onActif(actif === p.id ? null : p.id)}
              >
                <div className="probleme-entete">
                  {p.gravite === 'mineur' ? (
                    <IconeInfo taille={16} />
                  ) : (
                    <IconeAlerte taille={16} />
                  )}
                  <h3 title={`Problème ${ETIQUETTE[p.gravite]}`}>{p.titre}</h3>
                  <span className="compteur">
                    {p.nombre.toLocaleString('fr-FR')} {p.unite}
                    {p.nombre > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="probleme-detail">{p.detail}</p>
                <div className="probleme-actions">
                  <button
                    className="bouton-principal"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppliquer(p)
                    }}
                  >
                    {p.libelleCorrection}
                  </button>
                  {(p.marqueCellule || p.marqueLigne) && (
                    <button
                      className="bouton-secondaire"
                      onClick={(e) => {
                        e.stopPropagation()
                        onActif(actif === p.id ? null : p.id)
                      }}
                    >
                      <IconeOeil taille={15} />
                      {actif === p.id ? 'Masquer' : 'Voir où'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="reglages">
        <h3>Réglages</h3>
        <label className="champ">
          Format de date cible
          <select value={formatDate} onChange={(e) => onFormatDate(e.target.value as FormatCible)}>
            <option value="aaaa-mm-jj">aaaa-mm-jj (norme ISO, triable)</option>
            <option value="jj/mm/aaaa">jj/mm/aaaa (habitude française)</option>
          </select>
        </label>
        <button className="bouton-secondaire large" onClick={onSnakeCase}>
          En-têtes en snake_case
        </button>
      </div>

      <div className="journal">
        <div className="panneau-titre">
          <h3>Corrections appliquées</h3>
          {peutAnnuler && (
            <button
              className="bouton-secondaire petit"
              onClick={onAnnuler}
              title="Annuler la dernière correction (Ctrl+Z)"
            >
              <IconeAnnuler taille={14} />
              Annuler
            </button>
          )}
        </div>
        {journal.length === 0 ? (
          <p className="vide">Aucune pour l’instant.</p>
        ) : (
          <ol className="liste-journal">
            {journal.map((e, i) => (
              <li key={i}>
                <span>{e.texte}</span>
                <span className="compteur">{e.nombre.toLocaleString('fr-FR')}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
