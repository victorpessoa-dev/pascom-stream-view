"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppFooter from "@/components/shared/app-footer";
import PublicNavbar from "@/components/shared/public-navbar";
import HomeHero from "@/components/public/home-hero";
import { fetchPublicChurches } from "@/lib/services/churches";

export default function PublicHomePage() {
  const reduceMotion = useReducedMotion();
  const [churches, setChurches] = useState([]);

  useEffect(() => {
    fetchPublicChurches()
      .then(setChurches)
      .catch(() => setChurches([]));
  }, []);
  const reveal = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: { duration: reduceMotion ? 0 : 0.42, ease: "easeOut" },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <HomeHero />
        <motion.section
          id="igrejas"
          {...reveal}
          className="mx-auto w-full max-w-7xl scroll-mt-16 px-6 py-20 sm:px-10 lg:px-12 lg:py-28"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
            <p className="eyebrow text-primary">Comunidades ativas</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Encontre a sua igreja
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Conheça as igrejas que optaram por disponibilizar sua página
              pública.
            </p>
            </div>
            {churches.length > 5 ? (
              <Button asChild variant="outline" className="shrink-0">
                <Link href="/comunidade">Ver todas as comunidades</Link>
              </Button>
            ) : null}
          </div>
          {churches.length ? (
            <div className="mt-10 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {churches.slice(0, 5).map((church) => (
                <Link
                  key={church.id}
                  href={`/${church.slug}`}
                  className="group h-[220px] overflow-hidden rounded-xl border border-border bg-background transition hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative h-20 bg-muted">
                    {church.cover_url ? (
                      <img
                        src={church.cover_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="relative p-4">
                    <div className="absolute -top-6 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-card">
                      <img
                        src={
                          church.logo_url || "/brand/virtus-playcast-mark.png"
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="mt-3 truncate text-base font-semibold group-hover:text-primary">
                      {church.name}
                    </h3>
                    {church.city ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {church.city}
                      </p>
                    ) : null}
                    {church.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {church.description}
                      </p>
                    ) : null}
                  </div>
                </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <Building2 className="mx-auto h-7 w-7" />
              <p className="mt-3 text-sm">
                Ainda não há igrejas públicas disponíveis.
              </p>
            </div>
          )}
        </motion.section>
        <motion.section
          id="recursos"
          {...reveal}
          className="mx-auto w-full max-w-7xl scroll-mt-16 px-6 py-20 sm:px-10 lg:px-12 lg:py-28"
        >
          <div className="max-w-2xl">
            <p className="eyebrow text-primary">Tudo sob controle</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A apresentação certa para cada momento da sua comunidade.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Uma plataforma para preparar o conteúdo visual da igreja com
              cuidado, organização e identidade.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Feature
              number="01"
              title="Slides para telão"
              text="Monte uma sequência de avisos, celebrações e mensagens para exibir no telão da sua igreja."
              delay={0}
              reduceMotion={reduceMotion}
            />
            <Feature
              number="02"
              title="Patrocinadores em destaque"
              text="Cadastre anunciantes, organize as mídias e apresente cada parceiro de forma profissional."
              delay={0.06}
              reduceMotion={reduceMotion}
            />
            <Feature
              number="03"
              title="Overlays para transmissões"
              text="Crie telas transparentes e elementos visuais para usar no software de transmissão que sua equipe já utiliza."
              delay={0.12}
              reduceMotion={reduceMotion}
            />
          </div>
        </motion.section>
        <motion.section
          {...reveal}
          className="border-y border-border bg-muted/45"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[.9fr_1.1fr] lg:px-12 lg:py-28">
            <div className="overflow-hidden rounded-3xl shadow-2xl shadow-slate-950/15">
              <img
                src="/brand/background-virtus-playcast.png"
                alt="Igrejas e mesa de produção audiovisual"
                className="h-full min-h-72 w-full object-cover object-center"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="eyebrow text-primary">Feito para comunidades</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Tecnologia a serviço de uma boa apresentação.
              </h2>
              <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
                A vPlayCast torna a rotina da comunicação mais simples,
                para que a equipe prepare telões, anúncios e elementos visuais
                com segurança.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Highlight text="Conteúdo pronto para o telão" />
                <Highlight text="Mídias de anunciantes bem organizadas" />
                <Highlight text="Overlays em fundo transparente" />
                <Highlight text="Identidade visual da sua igreja" />
              </div>
            </div>
          </div>
        </motion.section>
        <motion.section
          {...reveal}
          className="mx-auto w-full max-w-4xl px-6 py-20 text-center sm:px-10 lg:py-28"
        >
          <p className="eyebrow text-primary">Comece agora</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sua comunidade merece uma apresentação à altura de cada encontro.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted-foreground">
            Entre no painel para organizar slides, anunciantes e overlays da sua
            paróquia.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/login">Entrar no painel</Link>
          </Button>
        </motion.section>
      </main>
      <AppFooter />
    </div>
  );
}

function Feature({ number, title, text, delay, reduceMotion }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: reduceMotion ? 0 : 0.36,
        delay: reduceMotion ? 0 : delay,
        ease: "easeOut",
      }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <p className="text-xs font-semibold tracking-[.18em] text-primary">
        {number}
      </p>
      <h3 className="mt-7 text-lg font-semibold">{title}</h3>
      <p className="mt-2 leading-6 text-muted-foreground">{text}</p>
    </motion.article>
  );
}

function Highlight({ text }) {
  return (
    <div className="border-l-2 border-primary/45 pl-3 text-sm font-medium leading-6">
      {text}
    </div>
  );
}
