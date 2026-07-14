'use client'

import { useEffect, useState } from 'react'
import { Database, Monitor, Palette, UserRound } from 'lucide-react'
import AppShell from '@/components/layout/app-shell'
import PageContainer from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useStore } from '@/lib/store/store'
import { defaultAdminSettings, mergeAdminSettings } from '@/lib/mappers/settings'
import {
  getAdminSettings,
  resetAdministrativeData,
  resetAdminSettings,
  saveAdminSettings,
} from '@/lib/services/settings'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'
import { uploadMedia } from '@/services/supabase/upload'
import {
  AccountSettingsSection,
  AppearanceSettingsSection,
  DataSettingsSection,
  SettingsHeader,
  SettingsTabs,
  SponsorDesignSection,
  TelaoSettingsSection,
} from '@/components/settings/settings-sections'

export default function ConfiguracoesPage() {
  const { sponsorSettings, updateSponsorSettings, overlays, ads, reload } = useStore()
  const [settings, setSettings] = useState(defaultAdminSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [account, setAccount] = useState({
    userId: '',
    email: '',
    originalEmail: '',
    displayName: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isAccountLoading, setIsAccountLoading] = useState(true)
  const [isAccountSaving, setIsAccountSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      try {
        const supabase = createSupabaseBrowserClient()
        const [loadedSettings, userResult] = await Promise.all([
          getAdminSettings(supabase),
          supabase.auth.getUser(),
        ])

        if (userResult.error) throw userResult.error

        const user = userResult.data.user
        let displayName = user?.user_metadata?.name || ''

        if (user?.id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle()

          if (profileError) throw profileError
          displayName = profile?.display_name || displayName
        }

        if (mounted) {
          setSettings(loadedSettings)
          setAccount({
            userId: user?.id || '',
            email: user?.email || '',
            originalEmail: user?.email || '',
            displayName,
            newPassword: '',
            confirmPassword: '',
          })
          setIsAccountLoading(false)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar configurações')
        if (mounted) setIsAccountLoading(false)
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

  const updateAccount = (key, value) => {
    setAccount((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveAccount = async () => {
    const nextEmail = account.email.trim()
    const nextDisplayName = account.displayName.trim()
    const nextPassword = account.newPassword

    if (!nextEmail) {
      toast.error('Informe um email de acesso')
      return
    }

    if (nextPassword || account.confirmPassword) {
      if (nextPassword.length < 6) {
        toast.error('A nova senha precisa ter pelo menos 6 caracteres')
        return
      }

      if (nextPassword !== account.confirmPassword) {
        toast.error('As senhas não conferem')
        return
      }
    }

    setIsAccountSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const authUpdates = {
        data: {
          name: nextDisplayName,
        },
      }

      if (nextEmail !== account.originalEmail) {
        authUpdates.email = nextEmail
      }

      if (nextPassword) {
        authUpdates.password = nextPassword
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdates)
      if (authError) throw authError

      if (account.userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ display_name: nextDisplayName || null })
          .eq('id', account.userId)

        if (profileError) throw profileError
      }

      setAccount((prev) => ({
        ...prev,
        email: nextEmail,
        originalEmail: nextEmail,
        displayName: nextDisplayName,
        newPassword: '',
        confirmPassword: '',
      }))

      toast.success(
        nextEmail !== account.originalEmail
          ? 'Dados atualizados. Confirme o novo email se o Supabase solicitar.'
          : 'Dados de login atualizados'
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar dados de login')
    } finally {
      setIsAccountSaving(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const savedSettings = await saveAdminSettings(supabase, settings)
      setSettings(savedSettings)
      setHasChanges(false)
      await reload()
      toast.success('Configurações salvas com sucesso')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configurações')
    } finally {
      setTimeout(() => setIsSaving(false), 300)
    }
  }

  const resetSettings = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const resetSettingsValue = await resetAdminSettings(supabase)
      setSettings(resetSettingsValue)
      setHasChanges(false)
      await reload()
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

  const importData = (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (!data.settings) throw new Error('O arquivo não possui configurações válidas')

        const supabase = createSupabaseBrowserClient()
        const normalizedSettings = await saveAdminSettings(supabase, mergeAdminSettings(data.settings))
        setSettings(normalizedSettings)
        setHasChanges(false)
        await reload()
        toast.success('Configurações importadas com sucesso')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Arquivo inválido')
      }
    }

    reader.readAsText(file)
  }

  const clearAllData = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const resetSettingsValue = await resetAdministrativeData(supabase)
      setSettings(resetSettingsValue)
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

  const uploadParishLogo = async (file) => {
    if (!file) return
    try {
      const url = await uploadMedia(file, 'branding')
      updateSettings('appearance', 'parishLogoUrl', url)
      toast.success('Logo enviada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar logo')
    }
  }

  const uploadParishCover = async (file) => {
    if (!file) return
    try {
      const url = await uploadMedia(file, 'branding')
      updateSettings('appearance', 'parishCoverUrl', url)
      toast.success('Capa enviada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar capa')
    }
  }

  return (
    <AppShell>
      <PageContainer size="narrow">
        <SettingsHeader onReset={resetSettings} onSave={saveSettings} hasChanges={hasChanges} isSaving={isSaving} />

        <Tabs defaultValue="telao" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="telao" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Telão</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Conta</span>
            </TabsTrigger>
          </TabsList>

          <SettingsTabs>
            <TabsContent value="telao" className="space-y-6">
              <Tabs defaultValue="comportamento" className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                </TabsList>
                <TabsContent value="comportamento" className="space-y-6">
                  <TelaoSettingsSection settings={settings} updateSettings={updateSettings} />
                </TabsContent>
                <TabsContent value="design" className="space-y-6">
                  <SponsorDesignSection
                    sponsorSettings={sponsorSettings}
                    onDesignChange={updateSponsorDesign}
                    onDesignBatchChange={updateSponsorDesignValues}
                    onUploadBackground={uploadSponsorBackground}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <AppearanceSettingsSection
                settings={settings}
                updateSettings={updateSettings}
                onUploadParishLogo={uploadParishLogo}
                onUploadParishCover={uploadParishCover}
              />
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <DataSettingsSection onExport={exportData} onImport={importData} onClearData={clearAllData} />
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <AccountSettingsSection
                account={account}
                onAccountChange={updateAccount}
                onSaveAccount={saveAccount}
                isLoading={isAccountLoading}
                isSaving={isAccountSaving}
              />
            </TabsContent>
          </SettingsTabs>
        </Tabs>
      </PageContainer>
    </AppShell>
  )
}

