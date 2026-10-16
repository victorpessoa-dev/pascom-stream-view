"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    // Keep diagnostics in the browser console without exposing internals to users.
    console.error("Route rendering failed:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-7 shadow-xl sm:p-10">
        <div className="rounded-2xl bg-slate-950 p-3 shadow-inner shadow-black/30">
          <img
            src="/brand/virtus-playcast-white.png"
            alt="Virtus PlayCast"
            className="h-10 w-44 object-contain sm:h-12 sm:w-52"
          />
        </div>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.26em] text-primary">
          Algo deu errado
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Não foi possível carregar esta página.
        </h1>
        <p className="mt-4 max-w-md leading-7 text-muted-foreground">
          Tente novamente. Se o problema persistir, volte para a página inicial.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" className="flex-1" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">Página inicial</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
