"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "Arial, sans-serif",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: 560,
            border: "1px solid #cbd5e1",
            borderRadius: 24,
            background: "#ffffff",
            padding: 32,
            boxShadow: "0 20px 40px rgb(15 23 42 / 12%)",
          }}
        >
          <p
            style={{
              color: "#0e7490",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            Erro inesperado
          </p>
          <h1 style={{ fontSize: 30, margin: "12px 0" }}>
            Não foi possível iniciar a página.
          </h1>
          <p style={{ color: "#475569", lineHeight: 1.6 }}>
            Atualize ou tente novamente em alguns instantes.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              border: 0,
              borderRadius: 8,
              background: "#0891b2",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
              padding: "12px 18px",
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
