export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  return <span className={`score-badge ${score >= 82 ? "strong" : score >= 68 ? "consider" : "stretch"}`} title={label}>{score}</span>;
}
