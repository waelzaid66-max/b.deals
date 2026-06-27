import logoUrl from "@/assets/banco-logo.png";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2.5rem",
        backgroundColor: "#0a0a0a",
        padding: "1.5rem",
      }}
    >
      <img
        src={logoUrl}
        alt="BANCO"
        style={{ width: "min(70vw, 320px)", height: "auto" }}
      />
      <a
        href="/banco-mobile/"
        style={{
          backgroundColor: "#ED1C24",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "1.125rem",
          padding: "0.875rem 2.75rem",
          borderRadius: "9999px",
          textDecoration: "none",
        }}
      >
        دخول
      </a>
    </div>
  );
}

export default App;
