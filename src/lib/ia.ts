/**
 * Appel IA optionnel — et volontairement minimaliste :
 * le modèle ne reçoit QUE la structure du fichier (noms de colonnes, types,
 * statistiques agrégées). Il renvoie un plan de mise en page en JSON, que
 * l'application applique ensuite localement sur les vraies données.
 */

export type Fournisseur = 'anthropic' | 'mistral'

export type ConfigIa = {
  fournisseur: Fournisseur
  cle: string
  modele: string
  inclureValeurs: boolean
}

export const MODELES: Record<Fournisseur, { nom: string; defaut: string; options: string[] }> = {
  anthropic: {
    nom: 'Anthropic (Claude)',
    defaut: 'claude-sonnet-5',
    options: ['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5-20251001'],
  },
  mistral: {
    nom: 'Mistral',
    defaut: 'mistral-large-latest',
    options: ['mistral-large-latest', 'mistral-small-latest'],
  },
}

export const CONSIGNE = `Tu mets en page un rapport à partir d'un fichier de données. Tu ne vois jamais les lignes, seulement la structure et des statistiques.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, à ce format :
{
  "titre": "titre court du rapport",
  "resume": "une ou deux phrases en français qui disent ce que contient le fichier et ce qui saute aux yeux",
  "indicateurs": [
    { "titre": "…", "colonne": "nom exact de colonne", "calcul": "nombre_lignes|somme|moyenne|min|max|distinct|periode", "format": "nombre|euro|pourcent", "aide": "précision courte (optionnel)" }
  ],
  "blocs": [
    { "type": "evolution", "titre": "…", "date": "colonne de type date", "valeur": "colonne numérique (optionnel)", "calcul": "compte|somme", "granularite": "jour|mois|annee", "format": "euro" },
    { "type": "barres", "titre": "…", "categorie": "colonne de catégorie", "valeur": "colonne numérique (optionnel)", "calcul": "compte|somme|moyenne", "limite": 8, "format": "euro" },
    { "type": "repartition", "titre": "…", "categorie": "colonne à faible cardinalité", "limite": 6 },
    { "type": "tableau", "titre": "…", "colonnes": ["…"], "tri": { "colonne": "…", "sens": "desc" }, "limite": 10 }
  ]
}

Règles :
- N'utilise QUE des noms de colonnes présents dans la structure fournie, à l'identique.
- 3 à 5 indicateurs, 2 à 4 blocs. Va à l'essentiel : ce qu'un responsable regarde en premier.
- "calcul": "somme" exige une colonne "valeur" numérique. "periode" exige une colonne de type date.
- Ne mets pas en avant les identifiants, les e-mails, ni les colonnes quasi vides.
- Le tableau ne garde que les colonnes qui aident à comprendre, 7 au maximum.
- Tous les titres et le résumé sont en français, sobres, sans superlatif.`

function extraireJson(texte: string): unknown {
  const nettoye = texte
    .replace(/^[\s\S]*?```(?:json)?/i, (m) => (m.includes('```') ? '' : m))
    .replace(/```[\s\S]*$/, '')
    .trim()
  const debut = nettoye.indexOf('{')
  const fin = nettoye.lastIndexOf('}')
  if (debut === -1 || fin === -1) throw new Error('La réponse ne contient pas de JSON.')
  return JSON.parse(nettoye.slice(debut, fin + 1))
}

export async function demanderPlan(
  structure: unknown,
  demande: string,
  config: ConfigIa,
): Promise<unknown> {
  const contenu = [
    'Structure du fichier :',
    JSON.stringify(structure, null, 1),
    demande.trim() !== '' ? `\nDemande de l'utilisateur : ${demande.trim()}` : '',
  ].join('\n')

  let reponse: Response
  try {
    if (config.fournisseur === 'anthropic') {
      reponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.cle,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.modele,
          max_tokens: 2000,
          system: CONSIGNE,
          messages: [{ role: 'user', content: contenu }],
        }),
      })
    } else {
      reponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.cle}`,
        },
        body: JSON.stringify({
          model: config.modele,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: CONSIGNE },
            { role: 'user', content: contenu },
          ],
        }),
      })
    }
  } catch {
    throw new Error(
      "Impossible de joindre l'API depuis le navigateur (réseau ou blocage CORS). Le rapport local reste disponible.",
    )
  }

  if (!reponse.ok) {
    const details = await reponse.text().catch(() => '')
    if (reponse.status === 401 || reponse.status === 403)
      throw new Error('Clé API refusée. Vérifiez la clé et ses droits.')
    if (reponse.status === 429)
      throw new Error('Quota atteint chez le fournisseur (429). Réessayez plus tard.')
    throw new Error(`Erreur ${reponse.status} : ${details.slice(0, 200)}`)
  }

  const data = await reponse.json()
  const texte: string =
    config.fournisseur === 'anthropic'
      ? (data.content?.[0]?.text ?? '')
      : (data.choices?.[0]?.message?.content ?? '')
  if (!texte) throw new Error('Réponse vide du modèle.')
  return extraireJson(texte)
}
