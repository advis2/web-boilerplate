import { Player } from "./shared";

export function Disc({
  value,
  flipping,
}: {
  value: Player;
  flipping: boolean;
}) {
  if (!value) return null;

  return (
    <div
      style={{
        width: 35,
        height: 35,
        perspective: 600,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          transformStyle: "preserve-3d",
          transition: flipping
            ? "transform 1000ms cubic-bezier(.22,.61,.36,1)"
            : "none",
          transform: flipping ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* 앞면 */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: value === "B" ? "black" : "white",
            backfaceVisibility: "hidden",
          }}
        />

        {/* 뒷면 */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: value === "B" ? "white" : "black",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        />
      </div>
    </div>
  );
}
