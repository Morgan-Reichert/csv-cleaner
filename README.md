# CSV.Cleaner

Un produit [QlickLab](https://qlicklab.eu). Outil web qui diagnostique et répare les fichiers CSV, puis les met en page sous
forme de rapport. **Tout tourne dans le navigateur** : aucun fichier n'est envoyé
sur un serveur, ce qui rend l'outil utilisable avec des données clients réelles.

## Lancer en local

```bash
npm install
npm run dev     # http://localhost:5179
npm run build   # dist/ — site statique, déployable tel quel
```

Aucun backend, aucune base de données. `dist/` est un site statique complet.

## Ce que fait l'onglet « Nettoyage »

Détection automatique, chaque problème avec son bouton de correction et son
annulation :

| Problème | Exemple |
|---|---|
| Accents cassés | `LivrÃ©` → `Livré` (UTF-8 relu en ANSI) |
| Séparateur | détection `;` `,` tabulation `\|`, modifiable |
| Lignes mal découpées | nombre de colonnes différent de l'en-tête |
| En-têtes | vides, en double, avec espaces |
| Lignes vides / en double | suppression, première occurrence gardée |
| Espaces superflus | début, fin, insécables, doublés |
| Nombres français | `1 234,56 €` → `1234.56` |
| Dates mélangées | `03/04/2024` + `2024-04-05` → un seul format |
| Colonnes vides | suppression |
| Tout en majuscules | `JEAN-PIERRE` → `Jean-Pierre` |

Export CSV avec choix du séparateur, de l'encodage (UTF-8 + BOM pour Excel,
UTF-8, Windows-1252), de la fin de ligne et des guillemets. Export JSON aussi.

## Ce que fait l'onglet « Rapport »

Les colonnes sont profilées (type, remplissage, cardinalité, min/max/somme), puis
mises en page : indicateurs clés, évolution dans le temps, comparaison par
catégorie, répartition, tableau réduit aux colonnes utiles. Imprimable en PDF.

### Mode IA (facultatif)

L'IA **ne reçoit jamais les lignes du fichier**. Elle reçoit uniquement la
structure — noms de colonnes, types détectés, statistiques agrégées — visible
dans « Voir exactement ce qui sera envoyé », et renvoie un plan de mise en page
en JSON que l'application applique localement sur les vraies données. Un champ
de prompt libre permet d'orienter le résultat.

La clé API est saisie par l'utilisateur, stockée dans son navigateur
(`localStorage`) et envoyée directement au fournisseur (Anthropic ou Mistral).
Sans clé, le rapport est construit par des règles locales.

## Marque et logos

Le pack de marque est dans `public/logopack/` : 5 = signature couleur, 1 = signature
blanche (thème sombre), 6 = pastille couleur, 2 = pastille blanche, 3 et 4 = versions
noires. Les PNG sont des carrés 2000x2000 avec du vide autour : ils sont recadrés par le
viewBox du SVG dans `src/ui/Logo.tsx`, sans retoucher les fichiers.

Couleurs : vert `#00bf63`, bleu marine `#021b9f`.

Le logo officiel QlickLab du pied de page se dépose dans `public/qlicklab/` sous les noms
`wordmark.webp` et `wordmark-blanc.webp`. Sans ces fichiers, le nom s'affiche en texte.

## Informations légales

Les mentions légales, la politique de données et les conditions sont dans
`src/ui/Legal.tsx`. Les informations d'identification de l'éditeur se renseignent en un
seul endroit : `src/lib/editeur.ts`. Tant qu'un champ vaut `A_COMPLETER`, il s'affiche en
orange dans la page — **à renseigner avant toute mise en ligne** (article 6 III de la LCEN).

## Structure

```
src/lib/csv.ts         parseur / sérialiseur CSV (RFC 4180 tolérant)
src/lib/encodage.ts    détection d'encodage, réparation des accents
src/lib/valeurs.ts     nombres, dates, casse, espaces à la française
src/lib/diagnostic.ts  détection des problèmes + corrections
src/lib/profil.ts      profilage des colonnes
src/lib/plan.ts        plan de rapport (local) + calculs d'agrégation
src/lib/ia.ts          appel API optionnel
src/ui/                composants React
```

Aucune dépendance en dehors de React : parseur CSV, graphiques SVG et mise en
page sont écrits à la main.
