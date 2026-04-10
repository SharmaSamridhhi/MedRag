export default function MedRAGLogo({ size = "md", className = "", left = 50 }) {
  const sizes = {
    sm: { width: 90, scale: 4.2 },
    md: { width: 120, scale: 4.2 },
    lg: { width: 240, scale: 4.2, Padding: 0 },
  };

  const s = sizes[size] || sizes.md;
  const imgWidth = s.width * s.scale;
  const height = Math.round(s.width * 0.32);

  return (
    <div
      className={className}
      style={{
        width: s.width,
        height,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <img
        src='/logo.png'
        alt='MedRAG'
        style={{
          width: imgWidth,
          height: "auto",
          position: "absolute",
          top: "50%",
          left: `${left}%`,
          transform: "translate(-50%, -50%)",
        }}
        draggable={false}
      />
    </div>
  );
}
