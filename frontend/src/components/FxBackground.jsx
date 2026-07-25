/**
 * Layered "alive" background: graphite base, drifting aurora mesh, star field,
 * masked grid, noise, and a slow light ray. Pure CSS — zero dependencies,
 * pointer-events-none, sits behind everything.
 */
export default function FxBackground() {
  return (
    <div className="fx-bg" aria-hidden>
      <div className="fx-mesh fx-mesh-a" />
      <div className="fx-mesh fx-mesh-b" />
      <div className="fx-mesh fx-mesh-c" />
      <div className="fx-stars" />
      <div className="fx-stars fx-stars-far" />
      <div className="fx-grid" />
      <div className="fx-ray" />
      <div className="fx-noise" />
    </div>
  )
}
