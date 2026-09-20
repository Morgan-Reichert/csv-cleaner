/**
 * Module publicitaire : le nettoyage reste libre, le rapport est offert par la
 * publicité.
 *
 * Deux régies possibles :
 *  - « maison » (par défaut) : nos propres encarts, aucun script tiers, aucun
 *    cookie, aucun traçage. La promesse « aucune donnée stockée » reste vraie.
 *  - « externe » : script d'une régie tierce. Elle dépose des traceurs et lit
 *    des données de navigation — il faut alors un bandeau de consentement
 *    (article 82 de la loi Informatique et Libertés) et une mise à jour des
 *    informations légales AVANT activation.
 */

export type Regie = 'maison' | 'externe'

export const PUB = {
  /** Passe à false pour rendre le rapport accessible sans écran publicitaire. */
  active: true,
  regie: 'maison' as Regie,
  /** Secondes d'affichage avant de pouvoir accéder au rapport. */
  secondes: 6,
  /** Durée du déblocage, en heures. */
  heuresDeblocage: 24,
  /** Régie externe : script à charger et identifiant d'emplacement. */
  scriptExterne: '',
  slotExterne: '',
}

const CLE = 'csvcleaner-pub'

export function estDebloque(): boolean {
  if (!PUB.active) return true
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return false
    return Number(brut) > Date.now()
  } catch {
    // Stockage indisponible : on ne bloque pas l'accès pour autant.
    return false
  }
}

export function debloquer(): void {
  try {
    localStorage.setItem(CLE, String(Date.now() + PUB.heuresDeblocage * 3_600_000))
  } catch {
    /* navigation privée : le déblocage vaudra pour la session en cours */
  }
}

/** Encarts maison : nos propres produits, sans aucun suivi. */
export type Encart = {
  surtitre: string
  titre: string
  texte: string
  lien: string
  action: string
}

export const ENCARTS_MAISON: Encart[] = [
  {
    surtitre: 'QlickLab',
    titre: 'Moody, le suivi de santé mentale privé',
    texte:
      'Local-first, IA embarquée, zéro serveur cloud : vos données de santé restent sur votre appareil.',
    lien: 'https://qlicklab.eu',
    action: 'Découvrir Moody',
  },
  {
    surtitre: 'QlickLab',
    titre: 'Une idée d’outil utile ?',
    texte:
      'Santé, éducation, climat : le groupe lance des produits européens à impact, pensés avant d’être codés.',
    lien: 'https://qlicklab.eu/contact.html',
    action: 'Proposer un projet',
  },
  {
    surtitre: 'CSV.Cleaner',
    titre: 'Cet outil est gratuit et le restera',
    texte:
      'Pas de compte, pas d’abonnement, pas de revente de données : seuls ces encarts financent le service.',
    lien: 'https://qlicklab.eu',
    action: 'Qui est derrière ?',
  },
]

export function encartAuHasard(): Encart {
  return ENCARTS_MAISON[Math.floor(Math.random() * ENCARTS_MAISON.length)]
}
