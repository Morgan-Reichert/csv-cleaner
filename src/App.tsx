import { useCallback, useMemo, useState } from 'react'
import { detecterSeparateur, nomSeparateur, parserCsv, SEPARATEURS, type Table } from './lib/csv'
import { decoder } from './lib/encodage'
import { analyser, statistiques, type Probleme } from './lib/diagnostic'
import type { FormatCible } from './lib/valeurs'
import { versSnakeCase } from './lib/valeurs'
import { CSV_EXEMPLE, NOM_EXEMPLE } from './lib/exemple'
import { Accueil } from './ui/Accueil'
import { Diagnostic } from './ui/Diagnostic'
import { Tableau } from './ui/Tableau'
import { Export } from './ui/Export'
import { Rapport } from './ui/Rapport'
import type { Plan } from './lib/plan'
import { LogoQlicklab, LogoSignature } from './ui/Logo'
import { Legal } from './ui/Legal'
import { EDITEUR } from './lib/editeur'
import { AccesRapport } from './ui/Pub'
import { estDebloque } from './lib/pub'
import {
  IconeAlerte,
  IconeBalai,
  IconeCadenas,
  IconeCroix,
  IconeFichier,
  IconeGraphique,
  IconeLune,
  IconeSoleil,
} from './ui/Icones'

export type InfoFichier = {
  nom: string
  taille: number
  encodage: string
  separateur: string
  avecEntetes: boolean
}

export type EntreeJournal = {
  texte: string
  nombre: number
}

const LIGNES_PAR_PAGE = 50

function construireTable(brut: string[][], avecEntetes: boolean): Table {
  if (brut.length === 0) return { entetes: [], lignes: [] }
  if (avecEntetes) return { entetes: brut[0], lignes: brut.slice(1) }
  const largeur = brut.reduce((m, l) => Math.max(m, l.length), 0)
  return {
    entetes: Array.from({ length: largeur }, (_, i) => `colonne_${i + 1}`),
    lignes: brut,
  }
}

export function App() {
  const [info, setInfo] = useState<InfoFichier | null>(null)
  const [texteSource, setTexteSource] = useState<string | null>(null)
  const [historique, setHistorique] = useState<Table[]>([])
  const [journal, setJournal] = useState<EntreeJournal[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)
  const [formatDate, setFormatDate] = useState<FormatCible>('aaaa-mm-jj')
  const [problemeActif, setProblemeActif] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [filtre, setFiltre] = useState('')
  const [onglet, setOnglet] = useState<'nettoyage' | 'rapport'>('nettoyage')
  const [planIa, setPlanIa] = useState<Plan | null>(null)
  const [demandeIa, setDemandeIa] = useState('')
  const [legalOuvert, setLegalOuvert] = useState(false)
  const [rapportDebloque, setRapportDebloque] = useState(estDebloque)
  const [sombre, setSombre] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'sombre',
  )

  const table = historique.length > 0 ? historique[historique.length - 1] : null

  const problemes = useMemo(
    () => (table ? analyser(table, { formatDate }) : []),
    [table, formatDate],
  )
  const stats = useMemo(() => (table ? statistiques(table) : null), [table])

  const lignesAffichees = useMemo(() => {
    if (!table) return []
    const f = filtre.trim().toLocaleLowerCase('fr')
    if (f === '') return table.lignes
    return table.lignes.filter((l) => l.some((v) => v?.toLocaleLowerCase('fr').includes(f)))
  }, [table, filtre])

  const basculerTheme = () => {
    const suivant = !sombre
    setSombre(suivant)
    document.documentElement.setAttribute('data-theme', suivant ? 'sombre' : 'clair')
    localStorage.setItem('csvpropre-theme', suivant ? 'sombre' : 'clair')
  }

  const charger = useCallback(
    (
      texte: string,
      nom: string,
      taille: number,
      encodage: string,
      separateurForce?: string,
      entetesForce?: boolean,
    ) => {
      const separateur = separateurForce ?? detecterSeparateur(texte)
      const lignes = parserCsv(texte, separateur)
      if (lignes.length === 0) {
        setErreur('Le fichier est vide : aucune ligne à analyser.')
        setChargement(false)
        return
      }
      const avecEntetes = entetesForce ?? true
      setTexteSource(texte)
      setInfo({ nom, taille, encodage, separateur, avecEntetes })
      setHistorique([construireTable(lignes, avecEntetes)])
      setJournal([])
      setProblemeActif(null)
      setPage(0)
      setFiltre('')
      setErreur(null)
      setChargement(false)
      setPlanIa(null)
      setOnglet('nettoyage')
    },
    [],
  )

  const ouvrirFichier = useCallback(
    async (fichier: File) => {
      setErreur(null)
      setChargement(true)
      try {
        const buffer = await fichier.arrayBuffer()
        const { texte, encodage } = decoder(buffer)
        // On laisse le navigateur peindre l'état « lecture » avant de bloquer sur l'analyse.
        setTimeout(() => charger(texte, fichier.name, fichier.size, encodage), 16)
      } catch {
        setErreur("Impossible de lire ce fichier. S'agit-il bien d'un fichier texte ?")
        setChargement(false)
      }
    },
    [charger],
  )

  const ouvrirExemple = useCallback(() => {
    setChargement(true)
    setTimeout(
      () => charger(CSV_EXEMPLE, NOM_EXEMPLE, CSV_EXEMPLE.length, 'Windows-1252 (ANSI)'),
      16,
    )
  }, [charger])

  const pousser = useCallback((t: Table, texte: string, nombre: number) => {
    setHistorique((h) => [...h, t])
    setJournal((j) => [...j, { texte, nombre }])
  }, [])

  const appliquer = useCallback(
    (p: Probleme) => {
      if (!table) return
      const { table: suivante, nombre } = p.corriger(table)
      pousser(suivante, p.titre, nombre)
      setProblemeActif(null)
    },
    [table, pousser],
  )

  const toutCorriger = useCallback(() => {
    if (!table) return
    let courante = table
    const entrees: EntreeJournal[] = []
    const faits = new Set<string>()
    for (let garde = 0; garde < 30; garde++) {
      const restants = analyser(courante, { formatDate }).filter(
        (p) => p.gravite !== 'mineur' && !faits.has(p.id),
      )
      if (restants.length === 0) break
      const p = restants[0]
      faits.add(p.id)
      const res = p.corriger(courante)
      if (res.nombre === 0) continue
      courante = res.table
      entrees.push({ texte: p.titre, nombre: res.nombre })
    }
    if (entrees.length === 0) return
    setHistorique((h) => [...h, courante])
    setJournal((j) => [...j, ...entrees])
    setProblemeActif(null)
  }, [table, formatDate])

  const annuler = useCallback(() => {
    if (historique.length <= 1) return
    setHistorique((h) => h.slice(0, -1))
    setJournal((j) => j.slice(0, -1))
    setProblemeActif(null)
  }, [historique.length])

  const renommerColonne = useCallback(
    (col: number, nom: string) => {
      if (!table || table.entetes[col] === nom) return
      const entetes = table.entetes.slice()
      entetes[col] = nom
      pousser({ ...table, entetes }, `Colonne renommée en « ${nom} »`, 1)
    },
    [table, pousser],
  )

  const supprimerColonne = useCallback(
    (col: number) => {
      if (!table) return
      const nom = table.entetes[col]
      pousser(
        {
          entetes: table.entetes.filter((_, i) => i !== col),
          lignes: table.lignes.map((l) => l.filter((_, i) => i !== col)),
        },
        `Colonne « ${nom} » supprimée`,
        1,
      )
    },
    [table, pousser],
  )

  const snakeCaseEntetes = useCallback(() => {
    if (!table) return
    let nombre = 0
    const entetes = table.entetes.map((e) => {
      const propre = versSnakeCase(e)
      if (propre !== e && propre !== '') nombre++
      return propre === '' ? e : propre
    })
    if (nombre === 0) return
    pousser({ ...table, entetes }, 'En-têtes en snake_case', nombre)
  }, [table, pousser])

  const rechargerAvec = useCallback(
    (options: { separateur?: string; avecEntetes?: boolean }) => {
      if (!texteSource || !info) return
      if (
        journal.length > 0 &&
        !confirm('Les corrections déjà appliquées seront perdues. Continuer ?')
      )
        return
      charger(
        texteSource,
        info.nom,
        info.taille,
        info.encodage,
        options.separateur ?? info.separateur,
        options.avecEntetes ?? info.avecEntetes,
      )
    },
    [texteSource, info, journal.length, charger],
  )

  const fermer = () => {
    setInfo(null)
    setTexteSource(null)
    setHistorique([])
    setJournal([])
    setErreur(null)
    setFiltre('')
  }

  const probleme = problemes.find((p) => p.id === problemeActif) ?? null

  return (
    <div className="app">
      <header className="entete">
        <LogoSignature hauteur={28} />
        <div className="entete-droite">
          <span className="mention-locale" title="Aucune donnée n’est transmise à un serveur">
            <IconeCadenas taille={16} />
            Traitement local
          </span>
          <button
            className="bouton-icone"
            onClick={basculerTheme}
            title={sombre ? 'Passer en thème clair' : 'Passer en thème sombre'}
            aria-label={sombre ? 'Passer en thème clair' : 'Passer en thème sombre'}
          >
            {sombre ? <IconeSoleil /> : <IconeLune />}
          </button>
        </div>
      </header>

      {erreur && (
        <div className="alerte" role="alert">
          <IconeAlerte taille={17} />
          {erreur}
          <button className="bouton-icone" onClick={() => setErreur(null)} aria-label="Fermer">
            <IconeCroix taille={15} />
          </button>
        </div>
      )}

      {!table || !info || !stats ? (
        <Accueil chargement={chargement} onFichier={ouvrirFichier} onExemple={ouvrirExemple} />
      ) : (
        <main className="travail">
          <div className="barre-fichier">
            <div className="fichier-nom" title={info.nom}>
              <IconeFichier taille={20} />
              <div className="fichier-textes">
                <strong>{info.nom}</strong>
                <span className="fichier-meta">
                  {stats.lignes.toLocaleString('fr-FR')} lignes · {stats.colonnes} colonnes ·{' '}
                  {info.encodage} · séparateur {nomSeparateur(info.separateur)}
                </span>
              </div>
            </div>
            <label className="case">
              <input
                type="checkbox"
                checked={info.avecEntetes}
                onChange={(e) => rechargerAvec({ avecEntetes: e.target.checked })}
              />
              <span>
                1<sup>re</sup> ligne = en-têtes
              </span>
            </label>
            <label className="case">
              Séparateur
              <select
                value={info.separateur}
                onChange={(e) => rechargerAvec({ separateur: e.target.value })}
              >
                {SEPARATEURS.map((s) => (
                  <option key={s.car} value={s.car}>
                    {s.nom}
                  </option>
                ))}
              </select>
            </label>
            <button className="bouton-secondaire" onClick={fermer}>
              Changer de fichier
            </button>
          </div>

          <nav className="onglets">
            <button
              className={onglet === 'nettoyage' ? 'actif' : ''}
              onClick={() => setOnglet('nettoyage')}
            >
              <IconeBalai taille={17} />
              Nettoyage
              {problemes.length > 0 && <span className="pastille">{problemes.length}</span>}
            </button>
            <button
              className={onglet === 'rapport' ? 'actif' : ''}
              onClick={() => setOnglet('rapport')}
            >
              <IconeGraphique taille={17} />
              Rapport
            </button>
          </nav>

          {onglet === 'rapport' ? (
            rapportDebloque ? (
              <Rapport
                table={table}
                nomFichier={info.nom}
                planIa={planIa}
                onPlanIa={setPlanIa}
                demande={demandeIa}
                onDemande={setDemandeIa}
              />
            ) : (
              <AccesRapport
                onDebloque={() => setRapportDebloque(true)}
                onRetour={() => setOnglet('nettoyage')}
              />
            )
          ) : (
          <div className="colonnes-travail">
            <aside className="panneau-gauche">
              <Diagnostic
                problemes={problemes}
                actif={problemeActif}
                onActif={setProblemeActif}
                onAppliquer={appliquer}
                onToutCorriger={toutCorriger}
                formatDate={formatDate}
                onFormatDate={setFormatDate}
                journal={journal}
                onAnnuler={annuler}
                peutAnnuler={historique.length > 1}
                onSnakeCase={snakeCaseEntetes}
              />
            </aside>

            <section className="panneau-droit">
              <Tableau
                table={table}
                lignes={lignesAffichees}
                probleme={probleme}
                page={page}
                parPage={LIGNES_PAR_PAGE}
                onPage={setPage}
                filtre={filtre}
                onFiltre={(v) => {
                  setFiltre(v)
                  setPage(0)
                }}
                onRenommer={renommerColonne}
                onSupprimer={supprimerColonne}
              />
              <Export
                table={table}
                lignesFiltrees={lignesAffichees}
                filtreActif={filtre.trim() !== ''}
                nomFichier={info.nom}
                separateurEntree={info.separateur}
                problemesRestants={problemes.length}
              />
            </section>
          </div>
          )}
        </main>
      )}

      <footer className="pied">
        <a
          className="produit-de"
          href={EDITEUR.site}
          target="_blank"
          rel="noopener noreferrer"
          title="Voir le site de QlickLab"
        >
          Un produit <LogoQlicklab hauteur={15} />
        </a>
        <span aria-hidden="true">·</span>
        <button className="lien-discret" onClick={() => setLegalOuvert(true)}>
          Informations légales
        </button>
        <span aria-hidden="true">·</span>
        <span>Aucune donnée ne quitte votre navigateur</span>
      </footer>

      {legalOuvert && <Legal onFermer={() => setLegalOuvert(false)} />}
    </div>
  )
}
