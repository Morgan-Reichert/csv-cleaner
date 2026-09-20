/**
 * Graphiques en SVG écrits à la main : une seule couleur pour une série unique
 * (la longueur porte la grandeur), palette catégorielle uniquement quand chaque
 * part est une identité, étiquettes directes plutôt qu'un chiffre par point.
 */

import { formater, formaterCourt, type Format, type Point } from '../lib/plan'

const COULEURS_PARTS = [
  'var(--serie-1)',
  'var(--serie-2)',
  'var(--serie-3)',
  'var(--serie-4)',
  'var(--serie-5)',
  'var(--serie-6)',
]

function tronquer(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

/** Rectangle dont seule l'extrémité « donnée » est arrondie. */
function barreHorizontale(x: number, y: number, w: number, h: number, r = 4): string {
  const rayon = Math.min(r, w)
  return `M${x},${y} H${x + w - rayon} A${rayon},${rayon} 0 0 1 ${x + w},${y + rayon} V${y + h - rayon} A${rayon},${rayon} 0 0 1 ${x + w - rayon},${y + h} H${x} Z`
}

export function Barres({ points, format }: { points: Point[]; format?: Format }) {
  if (points.length === 0) return <p className="vide">Pas de donnée exploitable pour ce graphique.</p>

  const largeur = 720
  const hauteurLigne = 30
  const hauteur = points.length * hauteurLigne + 10
  const xLabels = 8
  const largeurLabels = 150
  const xBarres = largeurLabels + 12
  const largeurMax = largeur - xBarres - 78
  const max = Math.max(...points.map((p) => Math.abs(p.valeur)), 1)

  return (
    <svg
      className="graphe"
      viewBox={`0 0 ${largeur} ${hauteur}`}
      role="img"
      aria-label="Graphique en barres"
    >
      {points.map((p, i) => {
        const y = i * hauteurLigne + 5
        const w = Math.max((Math.abs(p.valeur) / max) * largeurMax, 2)
        return (
          <g key={p.label} className="barre-groupe">
            <title>{`${p.label} : ${formater(p.valeur, format)}`}</title>
            <text className="graphe-label" x={xLabels} y={y + 14} dominantBaseline="middle">
              {tronquer(p.label, 22)}
            </text>
            <path className="barre" d={barreHorizontale(xBarres, y + 3, w, 18)} />
            <text
              className="graphe-valeur"
              x={xBarres + w + 8}
              y={y + 14}
              dominantBaseline="middle"
            >
              {formaterCourt(p.valeur, format)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function paliersJolis(max: number): number {
  const brut = max / 3
  const ordre = Math.pow(10, Math.floor(Math.log10(brut || 1)))
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * ordre).find((m) => m >= brut) ?? ordre * 10
  return Math.ceil(max / pas) * pas
}

export function Evolution({ points, format }: { points: Point[]; format?: Format }) {
  if (points.length === 0) return <p className="vide">Pas de donnée exploitable pour ce graphique.</p>
  if (points.length === 1) return <Barres points={points} format={format} />

  const largeur = 720
  const hauteur = 250
  const gauche = 66
  const droite = 16
  const haut = 16
  const bas = 34
  const max = paliersJolis(Math.max(...points.map((p) => p.valeur), 1))
  const zoneX = largeur - gauche - droite
  const zoneY = hauteur - haut - bas
  const x = (i: number) => gauche + (i / (points.length - 1)) * zoneX
  const y = (v: number) => haut + zoneY - (v / max) * zoneY

  const ligne = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.valeur).toFixed(1)}`).join(' ')
  const aire = `${ligne} L${x(points.length - 1).toFixed(1)},${haut + zoneY} L${gauche},${haut + zoneY} Z`
  const paliers = [0, max / 2, max]
  const pasLabels = Math.ceil(points.length / 8)

  return (
    <svg
      className="graphe"
      viewBox={`0 0 ${largeur} ${hauteur}`}
      role="img"
      aria-label="Graphique d’évolution"
    >
      {paliers.map((p) => (
        <g key={p}>
          <line className="grille" x1={gauche} x2={largeur - droite} y1={y(p)} y2={y(p)} />
          <text className="graphe-axe" x={gauche - 10} y={y(p)} textAnchor="end" dominantBaseline="middle">
            {formaterCourt(p, format)}
          </text>
        </g>
      ))}
      <path className="aire" d={aire} />
      <path className="courbe" d={ligne} />
      {points.map((p, i) => (
        <g key={p.label + i}>
          <title>{`${p.label} : ${formater(p.valeur, format)}`}</title>
          {points.length <= 24 && <circle className="point" cx={x(i)} cy={y(p.valeur)} r={4} />}
          <circle className="point-cible" cx={x(i)} cy={y(p.valeur)} r={12} />
          {i % pasLabels === 0 && (
            <text className="graphe-axe" x={x(i)} y={hauteur - 12} textAnchor="middle">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

export function Repartition({ points }: { points: Point[] }) {
  if (points.length === 0) return <p className="vide">Pas de donnée exploitable pour ce graphique.</p>
  const total = points.reduce((n, p) => n + p.valeur, 0)
  if (total <= 0) return <p className="vide">Pas de donnée exploitable pour ce graphique.</p>

  const taille = 200
  const centre = taille / 2
  const rayon = 78
  const epaisseur = 26
  let angle = -Math.PI / 2

  const arcs = points.map((p, i) => {
    const part = p.valeur / total
    const debut = angle
    const fin = angle + part * Math.PI * 2
    angle = fin
    const grand = fin - debut > Math.PI ? 1 : 0
    const pt = (a: number, r: number) => `${(centre + Math.cos(a) * r).toFixed(2)},${(centre + Math.sin(a) * r).toFixed(2)}`
    const rExt = rayon
    const rInt = rayon - epaisseur
    const d =
      part >= 0.999
        ? `M${pt(debut, rExt)} A${rExt},${rExt} 0 1 1 ${pt(debut + Math.PI, rExt)} A${rExt},${rExt} 0 1 1 ${pt(debut, rExt)} M${pt(debut, rInt)} A${rInt},${rInt} 0 1 0 ${pt(debut + Math.PI, rInt)} A${rInt},${rInt} 0 1 0 ${pt(debut, rInt)}`
        : `M${pt(debut, rExt)} A${rExt},${rExt} 0 ${grand} 1 ${pt(fin, rExt)} L${pt(fin, rInt)} A${rInt},${rInt} 0 ${grand} 0 ${pt(debut, rInt)} Z`
    return { d, part, couleur: COULEURS_PARTS[i % COULEURS_PARTS.length], point: p }
  })

  return (
    <div className="repartition">
      <svg viewBox={`0 0 ${taille} ${taille}`} className="donut" role="img" aria-label="Répartition">
        {arcs.map((a) => (
          <path key={a.point.label} d={a.d} fill={a.couleur} className="part">
            <title>{`${a.point.label} : ${formater(a.point.valeur)} (${(a.part * 100).toFixed(1)} %)`}</title>
          </path>
        ))}
        <text className="donut-total" x={centre} y={centre - 4} textAnchor="middle">
          {formaterCourt(total)}
        </text>
        <text className="donut-legende" x={centre} y={centre + 14} textAnchor="middle">
          au total
        </text>
      </svg>
      <ul className="legende">
        {arcs.map((a) => (
          <li key={a.point.label}>
            <span className="puce" style={{ background: a.couleur }} aria-hidden="true" />
            <span className="legende-nom">{tronquer(a.point.label, 24)}</span>
            <span className="legende-valeur">
              {formater(a.point.valeur)} · {(a.part * 100).toFixed(0)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
