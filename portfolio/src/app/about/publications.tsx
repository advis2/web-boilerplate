export const publications = [
  {
    title: "Efficient Optimization for Large-Scale Transformers",
    venue: "NeurIPS",
    year: 2024,
    description: "대규모 트랜스포머 모델의 학습 효율성을 개선하는 최적화 기법 제안"
  },
  {
    title: "Robust Representation Learning under Distribution Shift",
    venue: "ICML",
    year: 2023,
    description: "분포 이동 환경에서 강건한 표현 학습 방법 연구"
  }
] as const;

interface PublicationProps {
  title: string
  venue: string
  year: number
  description: string
}

export function PublicationCard({
  title,
  venue,
  year,
  description
}: PublicationProps) {
  return (
    <div style={{
      background: "#fff",
      padding: "1.5rem",
      borderRadius: "10px",
      marginBottom: "1rem",
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
    }}>
      <h3>{title}</h3>
      <p><strong>{venue}</strong>, {year}</p>
      <p>{description}</p>
    </div>
  )
}
