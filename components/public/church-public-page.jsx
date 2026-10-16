"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, Eye, MapPin, Play, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppFooter from "@/components/shared/app-footer";
import EmptyState from "@/components/shared/empty-state";
import LoadingState from "@/components/shared/loading-state";
import PublicNavbar from "@/components/shared/public-navbar";
import { normalizeSocialLinks } from "@/components/shared/social-links";
import StaticMediaFrame from "@/components/shared/static-media-frame";
import { mapSponsorRow } from "@/lib/mappers/sponsors";
import { fetchPublicSponsorDirectory } from "@/lib/repositories/sponsors";
import { createSupabaseBrowserClient } from "@/services/supabase/browser";

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = Math.round(total % 60);
  return minutes > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${remainingSeconds}s`;
}

function SponsorPreview({ sponsor }) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-black">
      <StaticMediaFrame
        src={sponsor.src}
        alt={sponsor.name}
        type={sponsor.mediaType}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export default function ChurchPublicPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [church, setChurch] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadChurch() {
      if (!slug) return;
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/igreja/${encodeURIComponent(slug)}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.church)
          throw new Error(payload.error || "Igreja não encontrada.");

        const supabase = createSupabaseBrowserClient();
        // The RPC applies the active-church and active-sponsor rules in one place.
        const data = await fetchPublicSponsorDirectory(
          supabase,
          payload.church.id,
        );
        if (cancelled) return;
        setChurch(payload.church);
        setSponsors((data || []).map(mapSponsorRow).filter(Boolean));
      } catch (cause) {
        if (!cancelled) {
          setChurch(null);
          setSponsors([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar esta igreja.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChurch();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const filteredSponsors = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
    if (!term) return sponsors;
    return sponsors.filter((sponsor) =>
      sponsor.name.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [searchTerm, sponsors]);
  const socialLinks = normalizeSocialLinks({
    parishSocialLinks: church?.social_links,
  });

  if (loading)
    return <LoadingState fullScreen label="Carregando página da igreja..." />;

  if (!church) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PublicNavbar />
        <main className="mx-auto grid w-full max-w-2xl flex-1 place-items-center px-6 py-16 text-center">
          <EmptyState
            icon={Building2}
            title="Igreja não encontrada"
            description={error || "Confira o endereço acessado."}
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative h-40 bg-muted sm:h-52">
            {church.cover_url ? (
              <>
                <img
                  src={church.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </>
            ) : null}
          </div>
          <div className="relative p-5 sm:p-6">
            <div className="absolute -top-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-4 border-card bg-card sm:-top-14 sm:h-28 sm:w-28">
              <img
                src={church.logo_url || "/brand/virtus-playcast-mark.png"}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-11 flex flex-col gap-4 sm:mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">
                  {church.name}
                </h1>
                {church.city && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {church.city}
                  </p>
                )}
              </div>
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map(({ key, label, url, Icon }) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="sr-only">{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Patrocinadores</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Conheça quem apoia esta comunidade.
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar patrocinador"
                className="pl-9"
              />
            </div>
            <Button asChild>
              <Link href={`/${slug}/ads-telao`} target="_blank">
                <Play className="h-4 w-4" />
                Telão
              </Link>
            </Button>
          </div>
        </section>

        {filteredSponsors.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhum patrocinador encontrado"
            description="Não há patrocinadores ativos para exibir no momento."
          />
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {filteredSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/${slug}/anunciantes/${sponsor.id}`}
                className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full overflow-hidden transition group-hover:border-primary/60 group-hover:shadow-md">
                  <div className="aspect-video">
                    <SponsorPreview sponsor={sponsor} />
                  </div>
                  <CardContent className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">
                        {sponsor.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDuration(sponsor.duration)} por exibição
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {sponsor.views}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
