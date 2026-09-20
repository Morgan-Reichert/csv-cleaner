/**
 * Fichier de démonstration : un export client comme on en reçoit vraiment,
 * avec tous les défauts classiques d'un CSV passé par Excel en France.
 */

const NBSP = ' '

export const NOM_EXEMPLE = 'commandes-mars.csv'

export const CSV_EXEMPLE = [
  'Nom;PrÃ©nom;E-mail;Ville;Date commande;Montant;Statut;Nom;',
  `DUPONT;jean-pierre;j.dupont@exemple.fr ;Lille;03/04/2024;1${NBSP}234,56 €;LivrÃ©;DUPONT;`,
  'MARTIN;sophie;s.martin@exemple.fr;Roubaix;2024-04-05;89,90 €;En cours;MARTIN;',
  `BERNARD;LÃ©a; l.bernard@exemple.fr;Tourcoing;5-04-2024;2${NBSP}150,00 €;LivrÃ©;BERNARD;`,
  'PETIT;thomas;t.petit@exemple.fr;Villeneuve-d’Ascq;07/04/2024;45,00 €;AnnulÃ©;PETIT;',
  ';;;;;;;',
  `ROBERT;marie;m.robert@exemple.fr;Lille;2024-04-08;1${NBSP}099,99 €;LivrÃ©;ROBERT;`,
  'RICHARD;paul;p.richard@exemple.fr  ;Armentières;09/04/2024;320,50 €;En cours;RICHARD;',
  'DURAND;claire;c.durand@exemple.fr;Wattrelos;10-04-2024;75,20 €;LivrÃ©;DURAND;',
  'LEROY;nicolas;n.leroy@exemple.fr;Croix;2024-04-11;1 780,00 €;En attente;LEROY;',
  'MOREAU;julie;j.moreau@exemple.fr;Marcq-en-BarÅ“ul;12/04/2024;510,75 €;LivrÃ©;MOREAU;',
  'SIMON;antoine;a.simon@exemple.fr;Lambersart;13/04/2024;95,00 €;LivrÃ©;SIMON;',
  'MARTIN;sophie;s.martin@exemple.fr;Roubaix;2024-04-05;89,90 €;En cours;MARTIN;',
  `LAURENT;Ã‰milie;e.laurent@exemple.fr;Lille;14-04-2024;3${NBSP}240,10 €;LivrÃ©;LAURENT;`,
  'MICHEL;hugo;h.michel@exemple.fr;Hem;15/04/2024;62,30 €;AnnulÃ©;MICHEL;',
  'GARCIA;ana;a.garcia@exemple.fr;Lille;16/04/2024;altération;En cours;GARCIA;;;',
  'DAVID;lucas;l.david@exemple.fr;Lomme;2024-04-17;148,00 €;LivrÃ©;DAVID;',
  `BERTRAND;chloÃ©;c.bertrand@exemple.fr;Seclin;18/04/2024;1${NBSP}025,40 €;LivrÃ©;BERTRAND;`,
  'ROUX;maxime;m.roux@exemple.fr ;Ronchin;19-04-2024;88,80 €;En attente;ROUX;',
  '',
  'VINCENT;sarah;s.vincent@exemple.fr;Faches-Thumesnil;20/04/2024;430,00 €;LivrÃ©;VINCENT;',
].join('\r\n')
