"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import PageContainer from "@/components/layout/page-container";
import CreateOverlayDialog from "@/components/overlays/create-overlay-dialog";
import OverlayList from "@/components/overlays/overlay-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store/store";

export default function OverlaysPage() {
  const { overlays } = useStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const visibleOverlays = useMemo(
    () =>
      overlays.filter((overlay) =>
        overlay.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [overlays, searchQuery],
  );

  return (
    <PageContainer>
        <header className="mb-6 flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Overlays</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie e edite elementos para a transmissão.
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo overlay
          </Button>
        </header>

        <div className="relative mb-5 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar overlays"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10"
          />
        </div>

        <OverlayList searchQuery={searchQuery} />
        <CreateOverlayDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
    </PageContainer>
  );
}
