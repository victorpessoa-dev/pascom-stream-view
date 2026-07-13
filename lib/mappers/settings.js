export const defaultAdminSettings = {
  telao: {
    defaultDurationNormal: 10,
    defaultDurationMaster: 15,
  },
  appearance: {
    parishName: '',
    parishCity: '',
    parishProfile: '',
    parishLogoUrl: '/brand/icon-logo.svg',
    parishCoverUrl: '',
    parishInstagramUrl: '',
    parishFacebookUrl: '',
    parishYoutubeUrl: '',
    parishWhatsappUrl: '',
    parishWebsiteUrl: '',
    parishSocialLinks: [],
  },
}

export const defaultSponsorSettings = {
  metricsEnabled: false,
  designs: {
    MASTER: {
      enabled: false,
      backgroundEnabled: false,
      backgroundUrl: '',
      contentWidth: 72,
      contentHeight: 72,
      x: 50,
      y: 50,
      objectFit: 'contain',
    },
    NORMAL: {
      enabled: true,
      backgroundEnabled: false,
      backgroundUrl: '',
      contentWidth: 58,
      contentHeight: 58,
      x: 50,
      y: 50,
      objectFit: 'contain',
    },
  },
}

export function mergeAdminSettings(settings) {
  const rawTelao = settings?.telao || {}
  const merged = {
    ...defaultAdminSettings,
    ...(settings || {}),
    telao: {
      ...defaultAdminSettings.telao,
      ...rawTelao,
    },
    appearance: {
      ...defaultAdminSettings.appearance,
      ...(settings?.appearance || {}),
      parishSocialLinks: Array.isArray(settings?.appearance?.parishSocialLinks)
        ? settings.appearance.parishSocialLinks
        : [],
    },
  }

  const legacyDefault = Number(rawTelao.defaultDuration)
  if (rawTelao.defaultDurationNormal == null && Number.isFinite(legacyDefault)) {
    merged.telao.defaultDurationNormal = legacyDefault
  }
  if (rawTelao.defaultDurationMaster == null && Number.isFinite(legacyDefault)) {
    merged.telao.defaultDurationMaster = legacyDefault
  }

  return merged
}

export function mergeSponsorSettings(settings) {
  const masterSettings = settings?.designs?.MASTER || {}
  const normalSettings = settings?.designs?.NORMAL || {}

  return {
    ...defaultSponsorSettings,
    ...(settings || {}),
    designs: {
      MASTER: {
        ...defaultSponsorSettings.designs.MASTER,
        ...masterSettings,
        contentWidth: masterSettings.contentWidth ?? masterSettings.imageWidth ?? defaultSponsorSettings.designs.MASTER.contentWidth,
        contentHeight: masterSettings.contentHeight ?? masterSettings.imageHeight ?? defaultSponsorSettings.designs.MASTER.contentHeight,
      },
      NORMAL: {
        ...defaultSponsorSettings.designs.NORMAL,
        ...normalSettings,
        contentWidth: normalSettings.contentWidth ?? normalSettings.imageWidth ?? defaultSponsorSettings.designs.NORMAL.contentWidth,
        contentHeight: normalSettings.contentHeight ?? normalSettings.imageHeight ?? defaultSponsorSettings.designs.NORMAL.contentHeight,
      },
    },
  }
}
