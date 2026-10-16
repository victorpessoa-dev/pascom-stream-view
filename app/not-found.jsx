import Link from "next/link";
import { ArrowLeft, LogIn, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-7 shadow-xl sm:p-10">
        <div className="flex items-center justify-between gap-4">
          {/* A dark brand frame preserves the contrast of the white logo in both themes. */}
          <div className="rounded-2xl bg-slate-950 p-3 shadow-inner shadow-black/30">
            <img
              src="/brand/virtus-playcast-white.png"
              alt="Virtus PlayCast"
              className="h-10 w-44 object-contain sm:h-12 sm:w-52"
            />
          </div>
          <SearchX className="h-8 w-8 shrink-0 text-primary" aria-hidden />
        </div>

        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.26em] text-primary">
          Erro 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Esta página não foi encontrada.
        </h1>
        <p className="mt-4 max-w-md leading-7 text-muted-foreground">
          O endereço pode ter sido alterado, removido ou digitado
          incorretamente.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Página inicial
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar no painel
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
