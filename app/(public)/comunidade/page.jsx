"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Search } from "lucide-react";
import AppFooter from "@/components/shared/app-footer";
import PublicNavbar from "@/components/shared/public-navbar";
import LoadingState from "@/components/shared/loading-state";
import { Input } from "@/components/ui/input";
import { fetchPublicChurches } from "@/lib/services/churches";

function ChurchCard({ church }) {
  return (
    <Link
      href={`/${church.slug}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-32 bg-muted">
        {church.cover_url ? (
          <img
            src={church.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="relative p-5">
        <div className="absolute -top-9 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-4 border-card bg-card">
          <img
            src={church.logo_url || "/brand/virtus-playcast-mark.png"}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <h2 className="mt-5 truncate text-lg font-semibold group-hover:text-primary">
          {church.name}
        </h2>
        {church.city ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {church.city}
          </p>
        ) : null}
        {church.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {church.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchPublicChurches()
      .then(setChurches)
      .catch(() => setChurches([]))
      .finally(() => setLoading(false));
  }, []);

  const visibleChurches = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedQuery) return churches;

    return churches.filter((church) =>
      [church.name, church.city].some((value) =>
        String(value || "").toLocaleLowerCase("pt-BR").includes(normalizedQuery),
      ),
    );
  }, [churches, query]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
        <header className="max-w-2xl">
          <p className="eyebrow text-primary">Comunidades ativas</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Encontre a sua igreja
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            Conheça as igrejas com perfil público ativo na vPlayCast.
          </p>
        </header>

        <div className="relative mt-8 max-w-lg">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por igreja ou cidade"
            className="h-11 pl-10"
            aria-label="Buscar comunidade por igreja ou cidade"
          />
        </div>

        {loading ? <LoadingState label="Carregando comunidades..." /> : null}

        {!loading && visibleChurches.length ? (
          <section
            aria-label="Comunidades disponíveis"
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visibleChurches.map((church) => (
              <ChurchCard key={church.id} church={church} />
            ))}
          </section>
        ) : null}

        {!loading && !visibleChurches.length ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <Building2 className="mx-auto h-7 w-7" />
            <p className="mt-3 text-sm">
              {churches.length
                ? "Nenhuma comunidade encontrada para esta busca."
                : "Ainda não há comunidades públicas disponíveis."}
            </p>
          </div>
        ) : null}
      </main>
      <AppFooter />
    </div>
  );
}
