'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  Monitor,
  Palette,
  RotateCcw,
  Save,
  Settings2,
  Upload,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'
import { uploadMedia } from '@/services/supabase/upload'

const defaultSettings = {
  telao: {
    defaultDurationNormal: 10,
    defaultDurationMaster: 15,
    transitionType: 'fade',
    transitionDuration: 500,
    autoplay: true,
    shuffle: false,
    showProgressBar: true,
  },
  overlay: {
    defaultWidth: 1920,
    defaultHeight: 1080,
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: true,
  },
  appearance: {
    accentColor: 'blue',
    animationsEnabled: true,
    compactMode: false,
  },
  advanced: {
    autoSave: true,
    autoSaveInterval: 30,
    debugMode: false,
  },
}

function normalizeAdminSettings(value) {
  const rawTelao = value?.telao || {}
  const merged = {
    ...defaultSettings,
    ...(value || {}),
    telao: { ...defaultSettings.telao, ...rawTelao },
    overlay: { ...defaultSettings.overlay, ...(value?.overlay || {}) },
    appearance: { ...defaultSettings.appearance, ...(value?.appearance || {}) },
    advanced: { ...defaultSettings.advanced, ...(value?.advanced || {}) },
  }

  const hasNormalDuration = rawTelao.defaultDurationNormal != null
  const hasMasterDuration = rawTelao.defaultDurationMaster != null
  const legacyDefault = Number(rawTelao.defaultDuration)

  if (!hasNormalDuration && Number.isFinite(legacyDefault)) {
    merged.telao.defaultDurationNormal = legacyDefault
  }
  if (!hasMasterDuration && Number.isFinite(legacyDefault)) {
    merged.telao.defaultDurationMaster = legacyDefault
  }

  return merged
}

function SettingRow({ title, description, control }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{title}</Label>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {control}
    </div>
  )
}

function SponsorDesignPreview({ title, settings }) {
  const zoom = settings.contentWidth ?? 58
  const top = settings.y ?? 50
  const left = settings.x ?? 50

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
        {settings.backgroundEnabled && settings.backgroundUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.backgroundUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.08),_transparent)]" />
        )}

        <div
          className="absolute rounded-lg border-2 border-dashed border-primary bg-primary/15"
          style={{
            width: `${zoom}%`,
            height: `${zoom}%`,
            left: `${left}%`,
            top: `${top}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex h-full items-center justify-center text-center text-xs font-medium text-primary">
            Área da mídia
          </div>
        </div>
      </div>
    </div>
  )
}

function DesignAdjustmentDrop({ kind, settings, onChange, onBatchChange, onUpload }) {
  const isNormal = kind === 'NORMAL'
  const zoom = settings.contentWidth ?? 58

  const handleZoomChange = (value) => {
    onBatchChange({
      contentWidth: value,
      contentHeight: value,
    })
  }

  return (
    <AccordionItem value={kind} className="rounded-xl border border-border px-4">
      <AccordionTrigger className="hover:no-underline">
        <div>
          <div className="font-medium">{isNormal ? 'Patrocínio normal' : 'Patrocínio master'}</div>
          <div className="text-sm text-muted-foreground">
            {isNormal
              ? 'Ajuste global dos patrocinadores normais exibidos em /telao.'
              : 'Ajuste global dos patrocinadores master exibidos em /telao-master.'}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5">
            <SettingRow
              title="Layout ativado"
              description="Controla posição, zoom e visibilidade da área da mídia."
              control={<Switch checked={settings.enabled} onCheckedChange={(checked) => onChange('enabled', checked)} />}
            />

            <SettingRow
              title="Usar fundo"
              description={`Ativa uma imagem de fundo para ${isNormal ? 'os patrocinadores normais' : 'os patrocinadores master'}.`}
              control={<Switch checked={settings.backgroundEnabled} onCheckedChange={(checked) => onChange('backgroundEnabled', checked)} />}
            />

            <div className="space-y-2">
              <Label>Imagem de fundo</Label>
              <Input
                placeholder="https://exemplo.com/arte-fundo.png"
                value={settings.backgroundUrl || ''}
                onChange={(event) => onChange('backgroundUrl', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Upload da imagem de fundo</Label>
              <Input type="file" accept="image/*" onChange={(event) => onUpload(event.target.files?.[0])} />
            </div>

            <div className="space-y-2">
              <Label>Zoom da área ({zoom}%)</Label>
              <Slider value={[zoom]} onValueChange={([value]) => handleZoomChange(value)} min={10} max={100} step={1} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Posição horizontal ({settings.x ?? 50}%)</Label>
                <Slider value={[settings.x ?? 50]} onValueChange={([value]) => onChange('x', value)} min={0} max={100} step={1} />
              </div>
              <div className="space-y-2">
                <Label>Posição vertical ({settings.y ?? 50}%)</Label>
                <Slider value={[settings.y ?? 50]} onValueChange={([value]) => onChange('y', value)} min={0} max={100} step={1} />
              </div>
            </div>
          </div>

          <SponsorDesignPreview
            title={isNormal ? 'Preview do /telao' : 'Preview do /telao-master'}
            settings={settings}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default function ConfiguracoesPage() {
  const { sponsorSettings, updateSponsorSettings, overlays, ads, reload } = useStore()
  const [settings, setSettings] = useState(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'admin_settings').maybeSingle()

        if (error) throw error
        if (mounted && data?.value) {
          setSettings(normalizeAdminSettings(data.value))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar configurações')
      }
    }

    loadSettings()
    return () => {
      mounted = false
    }
  }, [])

  const updateSettings = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('app_settings').upsert({ key: 'admin_settings', value: settings }, { onConflict: 'key' })
      if (error) throw error
      setHasChanges(false)
      toast.success('Configurações salvas com sucesso')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configurações')
    } finally {
      setTimeout(() => setIsSaving(false), 300)
    }
  }

  const resetSettings = async () => {
    setSettings(defaultSettings)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('app_settings').upsert({ key: 'admin_settings', value: defaultSettings }, { onConflict: 'key' })
      if (error) throw error
      setHasChanges(false)
      toast.success('Configurações restauradas')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao restaurar configurações')
    }
  }

  const exportData = () => {
    const data = { settings, sponsorSettings, overlays, sponsors: ads, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pascom-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Dados exportados com sucesso')
  }

  const importData = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (!data.settings) throw new Error('O arquivo não possui configurações válidas')

        const normalizedSettings = normalizeAdminSettings(data.settings)
        setSettings(normalizedSettings)
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.from('app_settings').upsert({ key: 'admin_settings', value: normalizedSettings }, { onConflict: 'key' })
        if (error) throw error
        setHasChanges(false)
        toast.success('Configurações importadas com sucesso')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Arquivo inválido')
      } finally {
        event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  const clearAllData = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const [overlaysResult, sponsorsResult, settingsResult] = await Promise.all([
        supabase.from('overlays').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('sponsors').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('app_settings').upsert({ key: 'admin_settings', value: defaultSettings }, { onConflict: 'key' }),
      ])

      if (overlaysResult.error) throw overlaysResult.error
      if (sponsorsResult.error) throw sponsorsResult.error
      if (settingsResult.error) throw settingsResult.error

      setSettings(defaultSettings)
      setHasChanges(false)
      await reload()
      toast.success('Overlays, patrocínios e configurações administrativas foram redefinidos')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao apagar dados')
    }
  }

  const updateSponsorDesignValues = async (kind, values) => {
    try {
      await updateSponsorSettings({
        designs: {
          [kind]: {
            ...sponsorSettings.designs[kind],
            ...values,
          },
        },
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar design')
    }
  }

  const updateSponsorDesign = async (kind, key, value) => {
    await updateSponsorDesignValues(kind, { [key]: value })
  }

  const uploadSponsorBackground = async (kind, file) => {
    if (!file) return
    try {
      const url = await uploadMedia(file, 'sponsors')
      await updateSponsorDesign(kind, 'backgroundUrl', url)
      toast.success('Imagem de fundo enviada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar a imagem de fundo')
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
            <p className="mt-1 text-muted-foreground">Ajuste as preferências gerais do sistema.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetSettings} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Restaurar
            </Button>
            <Button onClick={saveSettings} disabled={!hasChanges || isSaving} className="gap-2">
              {isSaving ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Salvo' : 'Salvar'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="telao" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="telao" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Telão</span>
            </TabsTrigger>
            <TabsTrigger value="overlay" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Overlay</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="telao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comportamento do telão</CardTitle>
                <CardDescription>Ajustes de tempo e experiência de exibição.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-border p-4">
                    <Label>Duração padrão normal ({settings.telao.defaultDurationNormal}s)</Label>
                    <Slider
                      value={[settings.telao.defaultDurationNormal]}
                      onValueChange={([value]) => updateSettings('telao', 'defaultDurationNormal', value)}
                      min={3}
                      max={60}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">Usada como valor inicial ao cadastrar patrocínios do tipo NORMAL.</p>
                  </div>
                  <div className="space-y-2 rounded-xl border border-border p-4">
                    <Label>Duração padrão master ({settings.telao.defaultDurationMaster}s)</Label>
                    <Slider
                      value={[settings.telao.defaultDurationMaster]}
                      onValueChange={([value]) => updateSettings('telao', 'defaultDurationMaster', value)}
                      min={3}
                      max={60}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">Usada como valor inicial ao cadastrar patrocínios do tipo MASTER.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Duração da transição ({settings.telao.transitionDuration}ms)</Label>
                  <Slider value={[settings.telao.transitionDuration]} onValueChange={([value]) => updateSettings('telao', 'transitionDuration', value)} min={100} max={2000} step={100} />
                </div>
                <Separator />
                <SettingRow title="Autoplay" description="Iniciar a rotação automaticamente." control={<Switch checked={settings.telao.autoplay} onCheckedChange={(checked) => updateSettings('telao', 'autoplay', checked)} />} />
                <SettingRow title="Ordem aleatória" description="Misturar a ordem das propagandas." control={<Switch checked={settings.telao.shuffle} onCheckedChange={(checked) => updateSettings('telao', 'shuffle', checked)} />} />
                <SettingRow title="Barra de progresso" description="Exibir indicador visual de tempo." control={<Switch checked={settings.telao.showProgressBar} onCheckedChange={(checked) => updateSettings('telao', 'showProgressBar', checked)} />} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Design dos patrocínios</CardTitle>
                <CardDescription>
                  Abra o ajuste desejado para definir fundo, zoom e posição da área de mídia aplicada ao tipo inteiro.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={['NORMAL']} className="space-y-4">
                  <DesignAdjustmentDrop
                    kind="NORMAL"
                    settings={sponsorSettings.designs.NORMAL}
                    onChange={(key, value) => updateSponsorDesign('NORMAL', key, value)}
                    onBatchChange={(values) => updateSponsorDesignValues('NORMAL', values)}
                    onUpload={(file) => uploadSponsorBackground('NORMAL', file)}
                  />
                  <DesignAdjustmentDrop
                    kind="MASTER"
                    settings={sponsorSettings.designs.MASTER}
                    onChange={(key, value) => updateSponsorDesign('MASTER', key, value)}
                    onBatchChange={(values) => updateSponsorDesignValues('MASTER', values)}
                    onUpload={(file) => uploadSponsorBackground('MASTER', file)}
                  />
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overlay" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Editor de overlays</CardTitle>
                <CardDescription>Defina medidas padrão e comportamento da grade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Largura padrão</Label>
                    <Input type="number" value={settings.overlay.defaultWidth} onChange={(e) => updateSettings('overlay', 'defaultWidth', parseInt(e.target.value, 10) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura padrão</Label>
                    <Input type="number" value={settings.overlay.defaultHeight} onChange={(e) => updateSettings('overlay', 'defaultHeight', parseInt(e.target.value, 10) || 0)} />
                  </div>
                </div>
                <Separator />
                <SettingRow title="Grade visível" description="Mostrar a grade no editor." control={<Switch checked={settings.overlay.gridEnabled} onCheckedChange={(checked) => updateSettings('overlay', 'gridEnabled', checked)} />} />
                <div className="space-y-2">
                  <Label>Tamanho da grade ({settings.overlay.gridSize}px)</Label>
                  <Slider value={[settings.overlay.gridSize]} onValueChange={([value]) => updateSettings('overlay', 'gridSize', value)} min={5} max={50} step={5} />
                </div>
                <SettingRow title="Alinhar à grade" description="Fazer snap automático dos elementos." control={<Switch checked={settings.overlay.snapToGrid} onCheckedChange={(checked) => updateSettings('overlay', 'snapToGrid', checked)} />} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Personalização visual e densidade da interface.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingRow title="Animações" description="Habilitar transições e microinterações." control={<Switch checked={settings.appearance.animationsEnabled} onCheckedChange={(checked) => updateSettings('appearance', 'animationsEnabled', checked)} />} />
                <SettingRow title="Modo compacto" description="Reduzir espaçamentos da interface." control={<Switch checked={settings.appearance.compactMode} onCheckedChange={(checked) => updateSettings('appearance', 'compactMode', checked)} />} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Backup e restauração</CardTitle>
                <CardDescription>Exporte ou importe um snapshot das configurações e do conteúdo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button variant="outline" onClick={exportData} className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Exportar dados
                  </Button>
                  <div className="relative flex-1">
                    <Input type="file" accept=".json" onChange={importData} className="absolute inset-0 cursor-pointer opacity-0" />
                    <Button variant="outline" className="w-full gap-2">
                      <Upload className="h-4 w-4" />
                      Importar dados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avançado</CardTitle>
                <CardDescription>Controles úteis para manutenção e operação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingRow title="Auto-salvamento" description="Salvar alterações automaticamente." control={<Switch checked={settings.advanced.autoSave} onCheckedChange={(checked) => updateSettings('advanced', 'autoSave', checked)} />} />
                <div className="space-y-2">
                  <Label>Intervalo de auto-salvamento ({settings.advanced.autoSaveInterval}s)</Label>
                  <Slider value={[settings.advanced.autoSaveInterval]} onValueChange={([value]) => updateSettings('advanced', 'autoSaveInterval', value)} min={10} max={120} step={10} disabled={!settings.advanced.autoSave} />
                </div>
                <SettingRow title="Modo debug" description="Mostrar informações extras de depuração." control={<Switch checked={settings.advanced.debugMode} onCheckedChange={(checked) => updateSettings('advanced', 'debugMode', checked)} />} />
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Zona de perigo
                </CardTitle>
                <CardDescription>Ação irreversível sobre o conteúdo administrativo.</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Redefinir dados administrativos</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso irá apagar overlays, patrocínios e redefinir as configurações administrativas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, redefinir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
