
export const projects = [
  {
    name: "차량 타이어 인식 및 마모도 측정",
    description: "차량 타이어 인식 및 마모도 측정"
  },
  {
    name: "C-arm 장치 보정 알고리즘 구현",
    description: "C-arm의 장치 보정에 필요한 내용, 알고리즘을 구현"
  },
  {
    name: "Dental Lab scanner 개발",
    description: "Dental Lab scanner 개발"
  },
  {
    name: "자석 모방 CAD 개발",
    description: "자석 모방 CAD 개발"
  },
  {
    name: "Web CAD 용 전체 아키텍처 개발",
    description: "C++ / Typscript 코드 사용 아키텍처 개발,"
  },
  {
    name: "Dental CAD 알고리즘 개발",
    description: "위치 보정을 위한 정합 알고리즘 개발, Inner surface blockout 개발, tool radius compensation method 개발 등"
  },
] as const;


interface ProjectProps {
  name: string
  description: string
}

export function ProjectCard({ name, description }: ProjectProps) {
  return (
    <div style={{
      background: "#fff",
      padding: "1.5rem",
      borderRadius: "10px",
      marginBottom: "1rem",
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
    }}>
      <h3>{name}</h3>
      <p>{description}</p>
    </div>
  )
}
