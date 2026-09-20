import { useEffect, useMemo, useRef } from 'react'
import type { Table } from '../lib/csv'
import type { Probleme } from '../lib/diagnostic'
import { IconeChevronDroite, IconeChevronGauche, IconeCroix } from './Icones'

type Props = {
  table: Table
  lignes: string[][]
  probleme: Probleme | null
  page: number
  parPage: number
  onPage: (p: number) => void
  filtre: string
  onFiltre: (v: string) => void
  onRenommer: (col: number, nom: string) => void
  onSupprimer: (col: number) => void
}

export function Tableau({
  table,
  lignes,
  probleme,
  page,
  parPage,
  onPage,
  filtre,
  onFiltre,
  onRenommer,
  onSupprimer,
}: Props) {
  const pages = Math.max(1, Math.ceil(lignes.length / parPage))
  const pageSure = Math.min(page, pages - 1)
  const debut = pageSure * parPage
  const visibles = useMemo(
    () => lignes.slice(debut, debut + parPage),
    [lignes, debut, parPage],
  )
  const corps = useRef<HTMLDivElement>(null)

  useEffect(() => {
    corps.current?.scrollTo({ top: 0 })
  }, [pageSure, filtre])

  const allerPremiere = () => {
    if (!probleme) return
    const index = lignes.findIndex(
      (l) =>
        probleme.marqueLigne?.(l) ||
        l.some((v, c) => probleme.marqueCellule?.(v ?? '', c) ?? false),
    )
    if (index >= 0) onPage(Math.floor(index / parPage))
  }

  const colonnesSignalees = new Set(probleme?.colonnes ?? [])

  return (
    <div className="tableau-bloc">
      <div className="barre-tableau">
        <input
          className="recherche"
          type="search"
          placeholder="Filtrer les lignes…"
          value={filtre}
          onChange={(e) => onFiltre(e.target.value)}
        />
        <span className="info-lignes">
          {lignes.length.toLocaleString('fr-FR')} ligne{lignes.length > 1 ? 's' : ''}
          {filtre.trim() !== '' && ` sur ${table.lignes.length.toLocaleString('fr-FR')}`}
        </span>
        {probleme && (
          <button className="bouton-secondaire petit" onClick={allerPremiere}>
            Aller au 1<sup>er</sup> cas
          </button>
        )}
        <div className="pagination">
          <button
            className="bouton-icone"
            onClick={() => onPage(pageSure - 1)}
            disabled={pageSure === 0}
            aria-label="Page précédente"
          >
            <IconeChevronGauche taille={16} />
          </button>
          <span>
            {pageSure + 1} / {pages}
          </span>
          <button
            className="bouton-icone"
            onClick={() => onPage(pageSure + 1)}
            disabled={pageSure >= pages - 1}
            aria-label="Page suivante"
          >
            <IconeChevronDroite taille={16} />
          </button>
        </div>
      </div>

      <div className="tableau-defilement" ref={corps}>
        <table className="donnees">
          <thead>
            <tr>
              <th className="col-index" />
              {table.entetes.map((entete, c) => (
                <th key={c} className={colonnesSignalees.has(c) ? 'signalee' : undefined}>
                  <div className="entete-cellule">
                    <input
                      key={`${c}-${entete}`}
                      defaultValue={entete}
                      title="Cliquer pour renommer"
                      onBlur={(e) => onRenommer(c, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                      }}
                    />
                    <button
                      className="bouton-icone mini"
                      title={`Supprimer la colonne « ${entete} »`}
                      aria-label={`Supprimer la colonne ${entete}`}
                      onClick={() => onSupprimer(c)}
                    >
                      <IconeCroix taille={13} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((ligne, i) => {
              const marquee = probleme?.marqueLigne?.(ligne) ?? false
              return (
                <tr key={debut + i} className={marquee ? 'ligne-marquee' : undefined}>
                  <td className="col-index">{debut + i + 1}</td>
                  {table.entetes.map((_, c) => {
                    const valeur = ligne[c] ?? ''
                    const marque = probleme?.marqueCellule?.(valeur, c) ?? false
                    return (
                      <td key={c} className={marque ? 'cellule-marquee' : undefined} title={valeur}>
                        {valeur === '' ? <span className="vide-cellule">—</span> : valeur}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {visibles.length === 0 && (
              <tr>
                <td className="aucun" colSpan={table.entetes.length + 1}>
                  Aucune ligne ne correspond au filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
