export default function TestBasicSticky() {
  return (
    <div style={{ display: "flex", padding: "2rem", gap: "2rem" }}>
      <div style={{ width: "50%" }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{ background: "#eee", padding: "1rem", marginBottom: "1rem" }}>
            Bloc {i + 1}
          </div>
        ))}
      </div>
      <div style={{ width: "50%", position: "relative" }}>
        <div
          style={{
            position: "sticky",
            top: "2rem",
            background: "white",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          }}
        >
          Je suis sticky ✅
        </div>
      </div>
    </div>
  );
}
