const heatmapValues = [
  [0.3, 0.5, 0.8, 0.6, 0.4],
  [0.4, 0.7, 0.9, 0.65, 0.38],
  [0.28, 0.48, 0.72, 0.7, 0.5],
  [0.22, 0.35, 0.64, 0.58, 0.34],
]

const AttentionHeatmap = () => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {heatmapValues.flatMap((row, r) =>
        row.map((value, c) => (
          <div
            key={`${r}-${c}`}
            className="h-10 rounded-md border border-white/10"
            style={{
              background: `rgba(34,211,238,${value})`,
              boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.4)",
            }}
          />
        )),
      )}
    </div>
  )
}

export default AttentionHeatmap
