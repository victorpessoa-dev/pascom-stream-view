'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, Check, Database, Download, Eye, EyeOff, Monitor, Palette, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { defaultSponsorSettings } from '@/lib/mappers/settings'

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

export function AccountSettingsSection({
  account,
  onAccountChange,
  onSaveAccount,
  isLoading,
  isSaving,
}) {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const passwordMismatch =
    account.newPassword.length > 0
    && account.confirmPassword.length > 0
    && account.newPassword !== account.confirmPassword

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados de login</CardTitle>
        <CardDescription>Atualize o email de acesso, o nome do perfil e a senha do usuário autenticado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="account-email">Email de acesso</Label>
            <Input
              id="account-email"
              type="email"
              value={account.email}
              onChange={(event) => onAccountChange('email', event.target.value)}
              disabled={isLoading || isSaving}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-display-name">Nome do perfil</Label>
            <Input
              id="account-display-name"
              value={account.displayName}
              onChange={(event) => onAccountChange('displayName', event.target.value)}
              disabled={isLoading || isSaving}
              autoComplete="name"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div>
            <Label>Alterar senha</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Deixe em branco para manter a senha atual.
            </p>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="account-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={account.newPassword}
                  onChange={(event) => onAccountChange('newPassword', event.target.value)}
                  disabled={isLoading || isSaving}
                  autoComplete="new-password"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  disabled={isLoading || isSaving}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  aria-label={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="account-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={account.confirmPassword}
                  onChange={(event) => onAccountChange('confirmPassword', event.target.value)}
                  disabled={isLoading || isSaving}
                  autoComplete="new-password"
                  minLength={6}
                  aria-invalid={passwordMismatch}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  disabled={isLoading || isSaving}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordMismatch ? (
                <p className="text-xs text-destructive">As senhas não conferem.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSaveAccount} disabled={isLoading || isSaving || passwordMismatch} className="gap-2">
            {isSaving ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Salvando...' : 'Salvar dados de login'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
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
        <Tabs defaultValue="NORMAL" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="NORMAL">Telão normal</TabsTrigger>
            <TabsTrigger value="MASTER">Telão master</TabsTrigger>
          </TabsList>
          {['NORMAL', 'MASTER'].map((kind) => (
            <TabsContent key={kind} value={kind}>
              <DesignAdjustmentDrop
                kind={kind}
                settings={sponsorSettings.designs[kind]}
                onChange={(key, value) => onDesignChange(kind, key, value)}
                onModeChange={(checked) => onDesignBatchChange(kind, { enabled: checked, backgroundEnabled: checked })}
                onUpload={(file) => onUploadBackground(kind, file)}
                onRestore={() => {
                  const defaults = defaultSponsorSettings.designs[kind]
                  onDesignBatchChange(kind, {
                    contentWidth: defaults.contentWidth,
                    contentHeight: defaults.contentHeight,
                    x: defaults.x,
                    y: defaults.y,
                    objectFit: defaults.objectFit,
                  })
                }}
              />
            </TabsContent>
          ))}
        </Tabs>
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
      extra: extraLinks,
    },
  }
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
                  <div>
                    <Label>Links adicionados</Label>
                    <p className="text-sm text-muted-foreground">Adicione Instagram, WhatsApp, YouTube, site ou outro canal.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addExtraLink}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                {extraLinks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Nenhuma rede social adicionada.
                  </p>
                ) : (
                  <div className="space-y-3">
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
