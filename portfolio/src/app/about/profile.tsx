export const profile = {
  name: "Donguk Kam, Ph.D.",
  title: "Dentbrid Team Lead",
  affiliation: "Imagoworks Inc.",
  email: "wadvisw@gmail.com",
  github: "https://github.com/advis2",
  researchInterests: [
    "Large Language Models",
    "Representation Learning",
    "Optimization",
    "Robust Machine Learning"
  ]
} as const;

export const techStack = {
  engineering: [
    "Computer Aided Engineering",
    "Optimization",
  ],
  tools: [
    "C++",
    "CMake",
    "OpenCV",
    "OpenGL",
    "Qt",
    "OpenMesh",
    "VTK",
    "ITK",
    "onnxruntime",
    "Emscripten",
    "Typescript",
    "React",
    "Nest",
    "Zod",
    "Python",
  ]
};

interface TechStackProps {
  title: string
  items: string[]
}

export function TechStack({ title, items }: TechStackProps) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ marginBottom: "1rem" }}>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              padding: "0.4rem 0.8rem",
              background: "#e2e8f0",
              borderRadius: "20px",
              fontSize: "0.9rem"
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}