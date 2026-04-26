'use client'

import { useState, useEffect } from 'react'
import { 
  Save, 
  RotateCcw, 
  Monitor, 
  Clock, 
  Palette, 
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Check
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'

const SETTINGS_KEY = 'pascom_settings'

const defaultSettings = {
  telao: {
    defaultDuration: 10,
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
  }
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }, [])

  const updateSettings = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    setIsSaving(true)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      toast.success('Configuracoes salvas com sucesso')
      setHasChanges(false)
    } catch (e) {
      toast.error('Erro ao salvar configuracoes')
    }
    setTimeout(() => setIsSaving(false), 500)
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings))
    toast.success('Configuracoes restauradas')
    setHasChanges(false)
  }

  const exportData = () => {
    const data = {
      settings,
      overlays: JSON.parse(localStorage.getItem('streamoverlay_data') || '{}'),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pascom-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Dados exportados com sucesso')
  }

  const importData = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (data.settings) {
          setSettings(data.settings)
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings))
        }
        if (data.overlays) {
          localStorage.setItem('streamoverlay_data', JSON.stringify(data.overlays))
        }
        toast.success('Dados importados com sucesso. Recarregue a pagina para aplicar.')
      } catch (err) {
        toast.error('Arquivo invalido')
      }
    }
    reader.readAsText(file)
  }

  const clearAllData = () => {
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem('streamoverlay_data')
    setSettings(defaultSettings)
    toast.success('Todos os dados foram removidos')
  }

  return (
    <AppShell>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
            <p className="text-muted-foreground mt-1">
              Ajuste as preferencias do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={resetSettings}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </Button>
            <Button 
              onClick={saveSettings} 
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Salvo' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="telao" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="telao" className="gap-2">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Telao</span>
            </TabsTrigger>
            <TabsTrigger value="overlay" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Overlay</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
          </TabsList>

          {/* Telao Settings */}
          <TabsContent value="telao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuracoes do Telao</CardTitle>
                <CardDescription>
                  Ajuste o comportamento das propagandas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Duracao Padrao (segundos)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.telao.defaultDuration]}
                      onValueChange={([value]) => updateSettings('telao', 'defaultDuration', value)}
                      min={3}
                      max={60}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-right text-sm text-muted-foreground">
                      {settings.telao.defaultDuration}s
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Tipo de Transicao</Label>
                  <Select
                    value={settings.telao.transitionType}
                    onValueChange={(value) => updateSettings('telao', 'transitionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="none">Nenhuma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duracao da Transicao (ms)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.telao.transitionDuration]}
                      onValueChange={([value]) => updateSettings('telao', 'transitionDuration', value)}
                      min={100}
                      max={2000}
                      step={100}
                      className="flex-1"
                    />
                    <span className="w-16 text-right text-sm text-muted-foreground">
                      {settings.telao.transitionDuration}ms
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autoplay</Label>
                    <p className="text-sm text-muted-foreground">
                      Iniciar reproducao automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={settings.telao.autoplay}
                    onCheckedChange={(checked) => updateSettings('telao', 'autoplay', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ordem Aleatoria</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir propagandas em ordem aleatoria
                    </p>
                  </div>
                  <Switch
                    checked={settings.telao.shuffle}
                    onCheckedChange={(checked) => updateSettings('telao', 'shuffle', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Barra de Progresso</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar barra de progresso na parte inferior
                    </p>
                  </div>
                  <Switch
                    checked={settings.telao.showProgressBar}
                    onCheckedChange={(checked) => updateSettings('telao', 'showProgressBar', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overlay Settings */}
          <TabsContent value="overlay" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuracoes de Overlay</CardTitle>
                <CardDescription>
                  Ajuste as opcoes do editor de overlays
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Largura Padrao</Label>
                    <Input
                      type="number"
                      value={settings.overlay.defaultWidth}
                      onChange={(e) => updateSettings('overlay', 'defaultWidth', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura Padrao</Label>
                    <Input
                      type="number"
                      value={settings.overlay.defaultHeight}
                      onChange={(e) => updateSettings('overlay', 'defaultHeight', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Grid Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar grid no editor
                    </p>
                  </div>
                  <Switch
                    checked={settings.overlay.gridEnabled}
                    onCheckedChange={(checked) => updateSettings('overlay', 'gridEnabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tamanho do Grid</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.overlay.gridSize]}
                      onValueChange={([value]) => updateSettings('overlay', 'gridSize', value)}
                      min={5}
                      max={50}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-12 text-right text-sm text-muted-foreground">
                      {settings.overlay.gridSize}px
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Snap to Grid</Label>
                    <p className="text-sm text-muted-foreground">
                      Alinhar elementos ao grid automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={settings.overlay.snapToGrid}
                    onCheckedChange={(checked) => updateSettings('overlay', 'snapToGrid', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aparencia</CardTitle>
                <CardDescription>
                  Personalize a interface do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Cor de Destaque</Label>
                  <Select
                    value={settings.appearance.accentColor}
                    onValueChange={(value) => updateSettings('appearance', 'accentColor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Azul</SelectItem>
                      <SelectItem value="green">Verde</SelectItem>
                      <SelectItem value="purple">Roxo</SelectItem>
                      <SelectItem value="orange">Laranja</SelectItem>
                      <SelectItem value="red">Vermelho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Animacoes</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar animacoes da interface
                    </p>
                  </div>
                  <Switch
                    checked={settings.appearance.animationsEnabled}
                    onCheckedChange={(checked) => updateSettings('appearance', 'animationsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Compacto</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduzir espacamento entre elementos
                    </p>
                  </div>
                  <Switch
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => updateSettings('appearance', 'compactMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Backup e Restauracao</CardTitle>
                <CardDescription>
                  Exporte ou importe seus dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" onClick={exportData} className="gap-2 flex-1">
                    <Download className="w-4 h-4" />
                    Exportar Dados
                  </Button>
                  <div className="relative flex-1">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="gap-2 w-full">
                      <Upload className="w-4 h-4" />
                      Importar Dados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription>
                  Acoes irreversiveis que afetam todos os seus dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Apagar Todos os Dados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Voce tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acao nao pode ser desfeita. Isso ira deletar permanentemente 
                        todos os seus overlays, propagandas e configuracoes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, apagar tudo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Opcoes Avancadas</CardTitle>
                <CardDescription>
                  Configuracoes para usuarios avancados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Salvar</Label>
                    <p className="text-sm text-muted-foreground">
                      Salvar alteracoes automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={settings.advanced.autoSave}
                    onCheckedChange={(checked) => updateSettings('advanced', 'autoSave', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Intervalo de Auto-Salvar (segundos)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.advanced.autoSaveInterval]}
                      onValueChange={([value]) => updateSettings('advanced', 'autoSaveInterval', value)}
                      min={10}
                      max={120}
                      step={10}
                      className="flex-1"
                      disabled={!settings.advanced.autoSave}
                    />
                    <span className="w-12 text-right text-sm text-muted-foreground">
                      {settings.advanced.autoSaveInterval}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Debug</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar informacoes de depuracao
                    </p>
                  </div>
                  <Switch
                    checked={settings.advanced.debugMode}
                    onCheckedChange={(checked) => updateSettings('advanced', 'debugMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
