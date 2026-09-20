import { useMemo, useState } from 'react'
import type { Table } from '../lib/csv'
import { profiler, profilPourIa } from '../lib/profil'
import {
  calculerBarres,
  calculerEvolution,
  calculerIndicateur,
  calculerRepartition,
  calculerTableau,
  planLocal,
  validerPlan,
  type Bloc,
  type Plan,
} from '../lib/plan'
import { demanderPlan, MODELES, type ConfigIa, type Fournisseur } from '../lib/ia'
import { Barres, Evolution, Repartition } from './Graphiques'
import { IconeAlerte, IconeAnnuler, IconeEtincelle, IconeImprimante } from './Icones'

type Props = {
  table: Table
  nomFichier: string
  planIa: Plan | null
  onPlanIa: (p: Plan | null) => void
  demande: string
  onDemande: (s: string) => void
}

function lireConfig(): ConfigIa {
  try {
    const brut = localStorage.getItem('csvpropre-ia')
    if (brut) return { ...JSON.parse(brut), cle: localStorage.getItem('csvpropre-cle') ?? '' }
  } catch {
    /* stockage indisponible : on repart des valeurs par défaut */
  }
  return { fournisseur: 'anthropic', cle: '', modele: MODELES.anthropic.defaut, inclureValeurs: false }
}

function ecrireConfig(c: ConfigIa) {
  try {
    localStorage.setItem(
      'csvpropre-ia',
      JSON.stringify({ fournisseur: c.fournisseur, modele: c.modele, inclureValeurs: c.inclureValeurs }),
    )
    localStorage.setItem('csvpropre-cle', c.cle)
  } catch {
    /* rien à faire : la config ne sera pas mémorisée */
  }
}

export function Rapport({ table, nomFichier, planIa, onPlanIa, demande, onDemande }: Props) {
  const profils = useMemo(() => profiler(table), [table])
  const local = useMemo(() => planLocal(table, profils, nomFichier), [table, profils, nomFichier])
  const plan = planIa ?? local

  const [config, setConfig] = useState<ConfigIa>(lireConfig)
  const [panneauIa, setPanneauIa] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const structure = useMemo(
    () => profilPourIa(table, profils, config.inclureValeurs),
    [table, profils, config.inclureValeurs],
  )

  const majConfig = (partiel: Partial<ConfigIa>) => {
    const suivant = { ...config, ...partiel }
    setConfig(suivant)
    ecrireConfig(suivant)
  }

  const lancerIa = async () => {
    if (config.cle.trim() === '') {
      setErreur('Renseignez une clé API pour utiliser l’IA.')
      return
    }
    setOccupe(true)
    setErreur(null)
    try {
      const brut = await demanderPlan(structure, demande, config)
      const valide = validerPlan(brut, table)
      if (!valide) throw new Error('Le modèle a répondu un plan inutilisable. Réessayez.')
      onPlanIa(valide)
      setPanneauIa(false)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue.')
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="rapport">
      <div className="rapport-barre">
        <div>
          <h2>{plan.titre}</h2>
          <p className="rapport-resume">{plan.resume}</p>
        </div>
        <div className="rapport-actions">
          <span className={`etiquette-origine ${planIa ? 'ia' : ''}`}>
            {planIa && <IconeEtincelle taille={13} />}
            {planIa ? 'mise en page par l’IA' : 'mise en page automatique'}
          </span>
          {planIa && (
            <button className="bouton-secondaire petit" onClick={() => onPlanIa(null)}>
              <IconeAnnuler taille={14} />
              Rapport local
            </button>
          )}
          <button className="bouton-secondaire petit" onClick={() => window.print()}>
            <IconeImprimante taille={14} />
            Imprimer / PDF
          </button>
          <button className="bouton-principal petit" onClick={() => setPanneauIa(!panneauIa)}>
            <IconeEtincelle taille={14} />
            Affiner avec l’IA
          </button>
        </div>
      </div>

      {panneauIa && (
        <div className="panneau-ia">
          <div className="ia-avertissement">
            <strong>Ce qui sort de votre navigateur :</strong> uniquement la structure ci-dessous
            (noms de colonnes, types, statistiques). Jamais vos lignes. La clé est stockée dans
            votre navigateur et envoyée directement au fournisseur.
          </div>

          <label className="champ">
            Ce que vous voulez voir ressortir (optionnel)
            <textarea
              rows={2}
              placeholder="Ex. : mets en avant les commandes annulées et les villes qui décrochent"
              value={demande}
              onChange={(e) => onDemande(e.target.value)}
            />
          </label>

          <div className="ia-reglages">
            <label className="champ">
              Fournisseur
              <select
                value={config.fournisseur}
                onChange={(e) => {
                  const f = e.target.value as Fournisseur
                  majConfig({ fournisseur: f, modele: MODELES[f].defaut })
                }}
              >
                {Object.entries(MODELES).map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="champ">
              Modèle
              <select value={config.modele} onChange={(e) => majConfig({ modele: e.target.value })}>
                {MODELES[config.fournisseur].options.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="champ grandir">
              Clé API
              <input
                type="password"
                placeholder="collez votre clé"
                value={config.cle}
                onChange={(e) => majConfig({ cle: e.target.value })}
                autoComplete="off"
              />
            </label>
          </div>

          <label className="case">
            <input
              type="checkbox"
              checked={config.inclureValeurs}
              onChange={(e) => majConfig({ inclureValeurs: e.target.checked })}
            />
            Joindre les valeurs les plus fréquentes des catégories (meilleurs titres, mais ce sont
            de vraies valeurs de votre fichier)
          </label>

          <details className="apercu-envoi">
            <summary>Voir exactement ce qui sera envoyé</summary>
            <pre>{JSON.stringify(structure, null, 1)}</pre>
          </details>

          {erreur && (
            <div className="alerte compacte">
              <IconeAlerte taille={16} />
              {erreur}
            </div>
          )}

          <div className="ia-actions">
            <button className="bouton-principal" onClick={lancerIa} disabled={occupe}>
              {occupe ? 'Analyse en cours…' : 'Générer le rapport'}
            </button>
            <button className="bouton-secondaire" onClick={() => setPanneauIa(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="tuiles">
        {plan.indicateurs.map((ind, i) => {
          const { valeur, aide } = calculerIndicateur(table, ind)
          return (
            <div className="tuile" key={`${ind.titre}-${i}`}>
              <span className="tuile-titre">{ind.titre}</span>
              <strong className="tuile-valeur">{valeur}</strong>
              {aide && <span className="tuile-aide">{aide}</span>}
            </div>
          )
        })}
      </div>

      <div className="blocs">
        {plan.blocs.map((bloc, i) => (
          <BlocRendu key={`${bloc.type}-${i}`} table={table} bloc={bloc} />
        ))}
      </div>
    </div>
  )
}

function BlocRendu({ table, bloc }: { table: Table; bloc: Bloc }) {
  if (bloc.type === 'tableau') {
    const { entetes, lignes } = calculerTableau(table, bloc)
    return (
      <section className="bloc large">
        <h3>{bloc.titre}</h3>
        {bloc.aide && <p className="bloc-aide">{bloc.aide}</p>}
        <div className="bloc-tableau">
          <table className="donnees">
            <thead>
              <tr>
                {entetes.map((e, i) => (
                  <th key={i}>{e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i}>
                  {l.map((v, j) => (
                    <td key={j} title={v}>
                      {v === '' ? <span className="vide-cellule">—</span> : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const contenu =
    bloc.type === 'barres' ? (
      <Barres points={calculerBarres(table, bloc)} format={bloc.format} />
    ) : bloc.type === 'evolution' ? (
      <Evolution points={calculerEvolution(table, bloc)} format={bloc.format} />
    ) : (
      <Repartition points={calculerRepartition(table, bloc)} />
    )

  return (
    <section className={`bloc ${bloc.type === 'repartition' ? '' : 'large'}`}>
      <h3>{bloc.titre}</h3>
      {bloc.aide && <p className="bloc-aide">{bloc.aide}</p>}
      {contenu}
    </section>
  )
}
