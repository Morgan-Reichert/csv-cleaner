import { useEffect } from 'react'
import { A_COMPLETER, EDITEUR } from '../lib/editeur'
import { PUB } from '../lib/pub'
import { IconeCroix } from './Icones'

/** Affiche la valeur, ou un repère visible tant qu'elle n'est pas renseignée. */
function Valeur({ children }: { children: string }) {
  if (children === A_COMPLETER)
    return (
      <span className="a-completer" title="À renseigner avant la mise en ligne">
        à compléter
      </span>
    )
  return <>{children}</>
}

export function Legal({ onFermer }: { onFermer: () => void }) {
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', auClavier)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', auClavier)
      document.body.style.overflow = ''
    }
  }, [onFermer])

  return (
    <div className="voile" onClick={onFermer}>
      <div
        className="panneau-legal"
        role="dialog"
        aria-modal="true"
        aria-label="Informations légales"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="legal-entete">
          <h2>Informations légales</h2>
          <button className="bouton-icone" onClick={onFermer} aria-label="Fermer">
            <IconeCroix />
          </button>
        </div>

        <div className="legal-corps">
          <section>
            <h3>Éditeur du site</h3>
            <dl>
              <div>
                <dt>Produit</dt>
                <dd>
                  {EDITEUR.produit}, édité par {EDITEUR.groupe} (
                  <a href={EDITEUR.site} target="_blank" rel="noopener noreferrer">
                    qlicklab.eu
                  </a>
                  )
                </dd>
              </div>
              <div>
                <dt>Raison sociale</dt>
                <dd>
                  <Valeur>{EDITEUR.raisonSociale}</Valeur> ·{' '}
                  <Valeur>{EDITEUR.formeJuridique}</Valeur>
                </dd>
              </div>
              <div>
                <dt>Immatriculation</dt>
                <dd>
                  <Valeur>{EDITEUR.immatriculation}</Valeur>
                </dd>
              </div>
              <div>
                <dt>Siège social</dt>
                <dd>
                  <Valeur>{EDITEUR.siege}</Valeur>
                </dd>
              </div>
              <div>
                <dt>Directeur de la publication</dt>
                <dd>
                  <Valeur>{EDITEUR.directeurPublication}</Valeur>
                </dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  <a href={EDITEUR.pageContact} target="_blank" rel="noopener noreferrer">
                    Formulaire de contact QlickLab
                  </a>{' '}
                  · <Valeur>{EDITEUR.courriel}</Valeur>
                </dd>
              </div>
              <div>
                <dt>Hébergeur</dt>
                <dd>
                  <Valeur>{EDITEUR.hebergeur}</Valeur> · <Valeur>{EDITEUR.hebergeurAdresse}</Valeur>
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3>Données personnelles</h3>
            <p className="legal-fort">
              Ce service ne collecte, ne transmet et ne conserve aucune donnée personnelle.
            </p>
            <p>
              Le fichier que vous ouvrez est lu et transformé <strong>par votre navigateur</strong>.
              Il n’est envoyé à aucun serveur, ni à celui qui héberge ce site, ni à un tiers. Il
              disparaît de la mémoire dès que vous fermez ou rechargez la page. Aucun compte,
              aucune inscription, aucune mesure d’audience, aucun traceur publicitaire.
            </p>
            <p>
              Aucun traitement de données à caractère personnel n’étant réalisé par l’éditeur, le
              règlement (UE) 2016/679 (RGPD) ne trouve pas à s’appliquer à votre usage de l’outil.
              Vous restez, vis-à-vis des personnes figurant dans vos fichiers, responsable du
              traitement que vous opérez.
            </p>
          </section>

          <section>
            <h3>Cookies et stockage local</h3>
            <p>
              Aucun cookie n’est déposé. Le site utilise uniquement le stockage local de votre
              navigateur, pour trois choses que vous déclenchez vous-même : le choix du thème clair
              ou sombre, la date de déblocage du rapport, et — si vous l’utilisez — la clé d’API du
              mode assisté. Ces informations
              restent sur votre appareil et ne sont jamais lues par l’éditeur ; à ce titre elles ne
              requièrent pas de consentement préalable (article 82 de la loi Informatique et
              Libertés). Vider les données du site depuis votre navigateur les efface.
            </p>
          </section>

          <section>
            <h3>Publicité</h3>
            {PUB.regie === 'maison' ? (
              <p>
                L’accès au rapport passe par un écran publicitaire. Les encarts affichés sont les
                nôtres : ils sont servis depuis ce site, <strong>sans script tiers, sans cookie et
                sans mesure d’audience</strong>. Rien n’est transmis à un annonceur, pas même le
                fait que vous ayez vu l’encart. Seule la date de déblocage est mémorisée dans
                votre navigateur, pour ne pas vous réafficher l’écran pendant{' '}
                {PUB.heuresDeblocage} heures.
              </p>
            ) : (
              <p>
                L’accès au rapport passe par un écran publicitaire fourni par une régie tierce.
                Celle-ci est susceptible de déposer des traceurs et de lire des données de
                navigation : son usage est subordonné à votre consentement préalable, recueilli
                séparément. Le nettoyage et l’export de vos fichiers restent, eux, entièrement
                locaux.
              </p>
            )}
            <p>
              Le nettoyage, la correction et l’export ne sont jamais conditionnés à la publicité,
              et l’outil reste gratuit dans son intégralité.
            </p>
          </section>

          <section>
            <h3>Intelligence artificielle (fonction optionnelle)</h3>
            <p>
              Le mode assisté du rapport est <strong>désactivé par défaut</strong>. Si vous
              l’activez avec votre propre clé d’API, seule la <strong>structure</strong> du fichier
              — noms de colonnes, types détectés, statistiques agrégées — est transmise au
              fournisseur que vous choisissez. <strong>Aucune ligne de votre fichier n’est
              envoyée.</strong> Le contenu exact de l’envoi est affiché avant chaque appel.
            </p>
            <p>
              Le modèle ne décide de rien : il propose une mise en page, que l’application applique
              localement et que vous pouvez annuler. Conformément à la charte IA responsable de{' '}
              {EDITEUR.groupe}, l’usage de l’IA est explicite, documenté et facultatif.
            </p>
          </section>

          <section>
            <h3>Conditions d’utilisation</h3>
            <p>
              Le service est fourni gratuitement, sans inscription et « en l’état ». Il est proposé
              sans garantie de disponibilité ni d’absence d’erreur : vous restez seul juge du
              résultat et il vous appartient de <strong>conserver votre fichier d’origine</strong>{' '}
              avant tout export. L’éditeur ne peut être tenu responsable d’une perte ou d’une
              altération de données consécutive à l’usage de l’outil.
            </p>
            <p>
              Vous vous engagez à n’utiliser l’outil que sur des fichiers que vous avez le droit de
              traiter. La marque, le nom et les éléments graphiques de {EDITEUR.produit} et de{' '}
              {EDITEUR.groupe} restent la propriété de leur titulaire.
            </p>
          </section>

          <section>
            <h3>Accessibilité</h3>
            <p>
              L’interface vise le niveau AA des règles WCAG 2.1 : contrastes vérifiés dans les deux
              thèmes, navigation au clavier, libellés explicites, information jamais portée par la
              seule couleur. Si vous rencontrez un obstacle, signalez-le via le{' '}
              <a href={EDITEUR.pageContact} target="_blank" rel="noopener noreferrer">
                formulaire de contact
              </a>
              .
            </p>
          </section>

          <p className="legal-date">Dernière mise à jour : {EDITEUR.miseAJour}.</p>
        </div>
      </div>
    </div>
  )
}
