/**
 * Informations d'édition du site.
 *
 * Les champs marqués À_COMPLETER doivent être renseignés AVANT toute mise en
 * ligne : en France, l'article 6 III de la LCEN impose d'identifier l'éditeur
 * et l'hébergeur d'un site accessible au public. Ils s'affichent en évidence
 * dans la page « Informations légales » tant qu'ils sont vides.
 */

export const A_COMPLETER = '__à compléter__'

export const EDITEUR = {
  produit: 'CSV.Cleaner',
  groupe: 'QlickLab',
  site: 'https://qlicklab.eu',
  pageLegale: 'https://qlicklab.eu/legal.html',
  pageContact: 'https://qlicklab.eu/contact.html',

  /** Raison sociale ou nom de la personne physique qui édite le site. */
  raisonSociale: A_COMPLETER,
  formeJuridique: A_COMPLETER,
  immatriculation: A_COMPLETER,
  siege: A_COMPLETER,
  directeurPublication: A_COMPLETER,
  courriel: A_COMPLETER,

  /** Nom, adresse et téléphone de l'hébergeur (Vercel, OVH, GitHub Pages…). */
  hebergeur: A_COMPLETER,
  hebergeurAdresse: A_COMPLETER,

  miseAJour: '21 septembre 2026',
}

export function estRenseigne(valeur: string): boolean {
  return valeur !== A_COMPLETER && valeur.trim() !== ''
}
