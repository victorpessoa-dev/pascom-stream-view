"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Layers, Megaphone } from "lucide-react";
import PageContainer from "@/components/layout/page-container";
import LoadingState from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store/store";

function SummaryCard({ icon: Icon, label, value, detail }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardContent() {
  const { overlays, ads, isLoaded } = useStore();
  const activeAds = useMemo(() => ads.filter((ad) => ad.active).length, [ads]);

  if (!isLoaded) return <LoadingState label="Carregando painel..." />;

  return (
    <PageContainer size="narrow">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse o que está no ar e faça ajustes rápidos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/overlay">Overlays</Link>
          </Button>
          <Button asChild>
            <Link href="/painel-telao">Patrocínios</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          icon={Megaphone}
          label="Patrocínios ativos"
          value={activeAds}
          detail={`${ads.length} cadastrados`}
        />
        <SummaryCard
          icon={Layers}
          label="Overlays"
          value={overlays.length}
          detail="Disponíveis para transmissão"
        />
      </section>
    </PageContainer>
  );
}
