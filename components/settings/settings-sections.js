'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, Check, Database, Download, Monitor, Palette, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion } from '@/components/ui/accordion'
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
import { BrandPreview, DesignAdjustmentDrop } from '@/components/settings/settings-page-parts'

export function SettingsHeader({ onReset, onSave, hasChanges, isSaving }) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-muted-foreground">Ajuste as preferências gerais do sistema.</p>
      </div>
      <div className="flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Restaurar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar configurações?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso volta as configurações administrativas para o padrão e descarta ajustes ainda não salvos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onReset}>Restaurar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={onSave} disabled={!hasChanges || isSaving} className="gap-2">
          {isSaving ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Salvo' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}

export function SettingsTabs({ children }) {
  return <div className="space-y-6">{children}</div>
}

export function TelaoSettingsSection({ settings, updateSettings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comportamento do telão</CardTitle>
        <CardDescription>Durações usadas como padrão ao cadastrar novos patrocínios.</CardDescription>
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
      </CardContent>
    </Card>
  )
}

export function SponsorDesignSection({ sponsorSettings, onDesignChange, onDesignBatchChange, onUploadBackground }) {
  return (
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
            onChange={(key, value) => onDesignChange('NORMAL', key, value)}
            onBatchChange={(values) => onDesignBatchChange('NORMAL', values)}
            onUpload={(file) => onUploadBackground('NORMAL', file)}
          />
          <DesignAdjustmentDrop
            kind="MASTER"
            settings={sponsorSettings.designs.MASTER}
            onChange={(key, value) => onDesignChange('MASTER', key, value)}
            onBatchChange={(values) => onDesignBatchChange('MASTER', values)}
            onUpload={(file) => onUploadBackground('MASTER', file)}
          />
        </Accordion>
      </CardContent>
    </Card>
  )
}

export function AppearanceSettingsSection({ settings, updateSettings, onUploadParishLogo, onUploadParishCover }) {
  const extraLinks = Array.isArray(settings.appearance.parishSocialLinks) ? settings.appearance.parishSocialLinks : []
  const previewProps = {
    parishName: settings.appearance.parishName,
    parishLogoUrl: settings.appearance.parishLogoUrl,
    parishCoverUrl: settings.appearance.parishCoverUrl,
    parishCity: settings.appearance.parishCity,
    parishProfile: settings.appearance.parishProfile,
    socialLinks: {
      instagram: settings.appearance.parishInstagramUrl,
      facebook: settings.appearance.parishFacebookUrl,
      youtube: settings.appearance.parishYoutubeUrl,
      whatsapp: settings.appearance.parishWhatsappUrl,
      website: settings.appearance.parishWebsiteUrl,
      extra: extraLinks,
    },
  }
  const baseSocialLinks = [
    { key: 'parishInstagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/sua_paroquia' },
    { key: 'parishFacebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/sua_paroquia' },
    { key: 'parishYoutubeUrl', label: 'YouTube', placeholder: 'https://youtube.com/@sua_paroquia' },
    { key: 'parishWhatsappUrl', label: 'WhatsApp', placeholder: 'https://wa.me/5511999999999' },
    { key: 'parishWebsiteUrl', label: 'Site', placeholder: 'https://sua-paroquia.com.br' },
  ]
  const activeBaseSocialLinks = baseSocialLinks.filter((item) => String(settings.appearance[item.key] || '').trim())
  const hasSocialLinks = activeBaseSocialLinks.length > 0 || extraLinks.length > 0

  const updateExtraLink = (index, key, value) => {
    updateSettings(
      'appearance',
      'parishSocialLinks',
      extraLinks.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    )
  }

  const addExtraLink = () => {
    updateSettings('appearance', 'parishSocialLinks', [...extraLinks, { label: '', url: '' }])
  }

  const removeExtraLink = (index) => {
    updateSettings('appearance', 'parishSocialLinks', extraLinks.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual público</CardTitle>
        <CardDescription>Organize identidade, dados da paróquia e redes sociais.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="perfil" className="space-y-4">
          <TabsList className="grid w-full max-w-xs grid-cols-1">
            <TabsTrigger value="perfil">Perfil público</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-6">
            <BrandPreview {...previewProps} />

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-6 rounded-lg border border-border p-4">
                <div>
                  <Label>Dados da paróquia</Label>
                  <p className="text-sm text-muted-foreground">Informações exibidas sobre a capa da página pública.</p>
                </div>
                <div className="space-y-2">
                  <Label>Nome da paróquia</Label>
                  <Input
                    value={settings.appearance.parishName}
                    onChange={(e) => updateSettings('appearance', 'parishName', e.target.value)}
                    placeholder="Ex: Paróquia São José"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={settings.appearance.parishCity}
                      onChange={(e) => updateSettings('appearance', 'parishCity', e.target.value)}
                      placeholder="Ex: Limeira - SP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil público</Label>
                    <Input
                      value={settings.appearance.parishProfile}
                      onChange={(e) => updateSettings('appearance', 'parishProfile', e.target.value)}
                      placeholder="Ex: PASCOM, Santuário, Matriz"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Logo da paróquia</Label>
                    <Input
                      value={settings.appearance.parishLogoUrl}
                      onChange={(e) => updateSettings('appearance', 'parishLogoUrl', e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload da logo</Label>
                    <Input type="file" accept="image/*" onChange={(event) => onUploadParishLogo(event.target.files?.[0])} />
                  </div>
                  <div className="space-y-2">
                    <Label>Capa pública</Label>
                    <Input
                      value={settings.appearance.parishCoverUrl}
                      onChange={(e) => updateSettings('appearance', 'parishCoverUrl', e.target.value)}
                      placeholder="https://exemplo.com/capa.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload da capa</Label>
                    <Input type="file" accept="image/*" onChange={(event) => onUploadParishCover(event.target.files?.[0])} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border p-4">
                <div>
                  <Label>Redes sociais públicas</Label>
                  <p className="text-sm text-muted-foreground">Links exibidos no canto inferior da capa pública.</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Adicione apenas as redes que deseja exibir.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={addExtraLink}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                {!hasSocialLinks ? (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Nenhuma rede social adicionada.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeBaseSocialLinks.map((item) => (
                      <div key={item.key} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[0.8fr_1.2fr_auto]">
                        <Input value={item.label} disabled aria-label="Rede social" />
                        <Input
                          value={settings.appearance[item.key] || ''}
                          onChange={(e) => updateSettings('appearance', item.key, e.target.value)}
                          placeholder={item.placeholder}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={() => updateSettings('appearance', item.key, '')} aria-label="Remover rede social">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {extraLinks.map((item, index) => (
                      <div key={index} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[0.8fr_1.2fr_auto]">
                        <Input value={item.label || ''} onChange={(e) => updateExtraLink(index, 'label', e.target.value)} placeholder="Nome da rede" />
                        <Input value={item.url || ''} onChange={(e) => updateExtraLink(index, 'url', e.target.value)} placeholder="https://..." />
                        <Button type="button" variant="outline" size="icon" onClick={() => removeExtraLink(index)} aria-label="Remover rede social">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export function DataSettingsSection({ onExport, onImport, onClearData }) {
  const fileInputRef = useRef(null)
  const [pendingImportFile, setPendingImportFile] = useState(null)

  const clearPendingImport = () => {
    setPendingImportFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confirmImport = () => {
    if (pendingImportFile) onImport(pendingImportFile)
    clearPendingImport()
  }

  return (
    <Tabs defaultValue="backup" className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="backup">Backup</TabsTrigger>
        <TabsTrigger value="perigo">Perigo</TabsTrigger>
      </TabsList>

      <TabsContent value="backup" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Backup e restauração</CardTitle>
            <CardDescription>Exporte ou importe um snapshot das configurações e do conteúdo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button variant="outline" onClick={onExport} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Exportar dados
              </Button>
              <div className="relative flex-1">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={(event) => setPendingImportFile(event.target.files?.[0] || null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Button variant="outline" className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Importar dados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="perigo" className="space-y-6">
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
                  <AlertDialogAction onClick={onClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sim, redefinir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </TabsContent>

      <AlertDialog open={Boolean(pendingImportFile)} onOpenChange={(open) => !open && clearPendingImport()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação substitui as configurações atuais pelos dados do arquivo selecionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Importar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}
