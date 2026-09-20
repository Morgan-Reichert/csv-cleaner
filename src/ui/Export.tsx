import { useState } from 'react'
import { SEPARATEURS, serialiserCsv, serialiserJson, type Table } from '../lib/csv'
import { encoder, ENCODAGES_SORTIE, type EncodageSortie } from '../lib/encodage'
import { IconeAlerte, IconeTelecharger } from './Icones'

type Props = {
  table: Table
  lignesFiltrees: string[][]
  filtreActif: boolean
  nomFichier: string
  separateurEntree: string
  problemesRestants: number
}

type Reglage = {
  separateur: string
  encodage: EncodageSortie
  finDeLigne: '\r\n' | '\n'
  guillemets: 'minimal' | 'toujours'
}

type Profil = 'excel' | 'standard' | 'perso'

const PROFILS: { id: Profil; nom: string; aide: string; reglage?: Reglage }[] = [
  {
    id: 'excel',
    nom: 'Pour Excel',
    aide: 'Point-virgule, UTF-8 avec BOM, fins de ligne Windows : les accents s’affichent et les colonnes se séparent correctement.',
    reglage: {
      separateur: ';',
      encodage: 'utf8-bom',
      finDeLigne: '\r\n',
      guillemets: 'minimal',
    },
  },
  {
    id: 'standard',
    nom: 'Pour un outil ou une base',
    aide: 'Virgule, UTF-8, fins de ligne Unix : le format attendu par la plupart des imports techniques.',
    reglage: {
      separateur: ',',
      encodage: 'utf8',
      finDeLigne: '\n',
      guillemets: 'minimal',
    },
  },
  { id: 'perso', nom: 'Personnalisé', aide: 'Vous choisissez chaque réglage.' },
]

function telecharger(octets: Uint8Array, nom: string, type: string) {
  const blob = new Blob([octets as unknown as BlobPart], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function baseNom(nom: string): string {
  return nom.replace(/\.[^.]+$/, '')
}

export function Export({
  table,
  lignesFiltrees,
  filtreActif,
  nomFichier,
  separateurEntree,
  problemesRestants,
}: Props) {
  const [profil, setProfil] = useState<Profil>('excel')
  const [perso, setPerso] = useState<Reglage>({
    separateur: separateurEntree,
    encodage: 'utf8-bom',
    finDeLigne: '\r\n',
    guillemets: 'minimal',
  })
  const [seulementFiltrees, setSeulementFiltrees] = useState(false)

  const actif = PROFILS.find((p) => p.id === profil)!
  const reglage = actif.reglage ?? perso

  const tableSortie: Table =
    seulementFiltrees && filtreActif ? { ...table, lignes: lignesFiltrees } : table

  const exporterCsv = () => {
    const texte = serialiserCsv(tableSortie, {
      separateur: reglage.separateur,
      finDeLigne: reglage.finDeLigne,
      guillemets: reglage.guillemets,
    })
    telecharger(
      encoder(texte, reglage.encodage),
      `${baseNom(nomFichier)}-propre.csv`,
      'text/csv;charset=utf-8',
    )
  }

  const exporterJson = () => {
    telecharger(
      new TextEncoder().encode(serialiserJson(tableSortie)),
      `${baseNom(nomFichier)}.json`,
      'application/json',
    )
  }

  return (
    <div className="export">
      <div className="export-haut">
        <div className="export-profils" role="group" aria-label="Format d’export">
          {PROFILS.map((p) => (
            <button
              key={p.id}
              className={profil === p.id ? 'actif' : ''}
              onClick={() => setProfil(p.id)}
              title={p.aide}
            >
              {p.nom}
            </button>
          ))}
        </div>

        <div className="export-actions">
          {problemesRestants > 0 && (
            <span className="avertissement">
              <IconeAlerte taille={15} />
              {problemesRestants} problème{problemesRestants > 1 ? 's' : ''} non corrigé
              {problemesRestants > 1 ? 's' : ''}
            </span>
          )}
          <button className="bouton-secondaire" onClick={exporterJson}>
            JSON
          </button>
          <button className="bouton-principal" onClick={exporterCsv}>
            <IconeTelecharger taille={17} />
            Télécharger le CSV propre
          </button>
        </div>
      </div>

      <p className="export-aide">{actif.aide}</p>

      {profil === 'perso' && (
        <div className="export-options">
          <label className="champ">
            Séparateur
            <select
              value={perso.separateur}
              onChange={(e) => setPerso({ ...perso, separateur: e.target.value })}
            >
              {SEPARATEURS.map((s) => (
                <option key={s.car} value={s.car}>
                  {s.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="champ">
            Encodage
            <select
              value={perso.encodage}
              onChange={(e) => setPerso({ ...perso, encodage: e.target.value as EncodageSortie })}
              title={ENCODAGES_SORTIE.find((e) => e.id === perso.encodage)?.aide}
            >
              {ENCODAGES_SORTIE.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="champ">
            Fin de ligne
            <select
              value={perso.finDeLigne === '\r\n' ? 'crlf' : 'lf'}
              onChange={(e) =>
                setPerso({ ...perso, finDeLigne: e.target.value === 'crlf' ? '\r\n' : '\n' })
              }
            >
              <option value="crlf">Windows (CRLF)</option>
              <option value="lf">Unix (LF)</option>
            </select>
          </label>
          <label className="champ">
            Guillemets
            <select
              value={perso.guillemets}
              onChange={(e) =>
                setPerso({ ...perso, guillemets: e.target.value as 'minimal' | 'toujours' })
              }
            >
              <option value="minimal">Seulement si nécessaire</option>
              <option value="toujours">Toujours</option>
            </select>
          </label>
        </div>
      )}

      {filtreActif && (
        <label className="case">
          <input
            type="checkbox"
            checked={seulementFiltrees}
            onChange={(e) => setSeulementFiltrees(e.target.checked)}
          />
          N’exporter que les {lignesFiltrees.length.toLocaleString('fr-FR')} lignes filtrées
        </label>
      )}
    </div>
  )
}
