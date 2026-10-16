export const defaultAdminSettings = {
  telao: {
    defaultDurationNormal: 10,
    defaultDurationMaster: 15,
  },
  appearance: {
    parishName: "",
    parishCity: "",
    parishLogoUrl: "/brand/virtus-playcast-mark.png",
    parishCoverUrl: "",
    parishSocialLinks: [],
  },
};

export const defaultSponsorSettings = {
  metricsEnabled: false,
  metricsPaused: {
    NORMAL: false,
    MASTER: false,
  },
  adsFilterMaster: false,
  designs: {
    SHARED: {
      enabled: true,
      backgroundEnabled: false,
      backgroundUrl: "",
      contentWidth: 58,
      contentHeight: 58,
      x: 50,
      y: 50,
      objectFit: "contain",
    },
  },
};

export function mergeAdminSettings(settings) {
  const rawTelao = settings?.telao || {};
  const rawAppearance = settings?.appearance || {};
  const appearanceWithoutLegacyLinks = { ...rawAppearance };
  delete appearanceWithoutLegacyLinks.parishInstagramUrl;
  delete appearanceWithoutLegacyLinks.parishFacebookUrl;
  delete appearanceWithoutLegacyLinks.parishYoutubeUrl;
  delete appearanceWithoutLegacyLinks.parishWhatsappUrl;
  delete appearanceWithoutLegacyLinks.parishWebsiteUrl;
  const merged = {
    ...defaultAdminSettings,
    ...(settings || {}),
    telao: {
      ...defaultAdminSettings.telao,
      ...rawTelao,
    },
    appearance: {
      ...defaultAdminSettings.appearance,
      ...appearanceWithoutLegacyLinks,
      parishSocialLinks: Array.isArray(rawAppearance.parishSocialLinks)
        ? rawAppearance.parishSocialLinks
        : [],
    },
  };

  const legacyDefault = Number(rawTelao.defaultDuration);
  if (
    rawTelao.defaultDurationNormal == null &&
    Number.isFinite(legacyDefault)
  ) {
    merged.telao.defaultDurationNormal = legacyDefault;
  }
  if (
    rawTelao.defaultDurationMaster == null &&
    Number.isFinite(legacyDefault)
  ) {
    merged.telao.defaultDurationMaster = legacyDefault;
  }

  return merged;
}

export function mergeSponsorSettings(settings) {
  const sharedSettings = settings?.designs?.SHARED || {};
  const masterSettings = settings?.designs?.MASTER || {};
  const normalSettings = settings?.designs?.NORMAL || {};
  // Old installations persisted one design per type. Prefer the normal layout
  // for migration, falling back to master when it is the only configured one.
  const legacySettings =
    Object.keys(normalSettings).length > 0 ? normalSettings : masterSettings;
  const metricsPaused = settings?.metricsPaused || {};
  const adsFilterMaster = settings?.adsFilterMaster;

  return {
    ...defaultSponsorSettings,
    ...(settings || {}),
    metricsPaused: {
      NORMAL: Boolean(metricsPaused.NORMAL),
      MASTER: Boolean(metricsPaused.MASTER),
    },
    adsFilterMaster:
      adsFilterMaster !== undefined
        ? Boolean(adsFilterMaster)
        : defaultSponsorSettings.adsFilterMaster,
    designs: {
      SHARED: {
        ...defaultSponsorSettings.designs.SHARED,
        ...legacySettings,
        ...sharedSettings,
        contentWidth:
          sharedSettings.contentWidth ??
          legacySettings.contentWidth ??
          legacySettings.imageWidth ??
          defaultSponsorSettings.designs.SHARED.contentWidth,
        contentHeight:
          sharedSettings.contentHeight ??
          legacySettings.contentHeight ??
          legacySettings.imageHeight ??
          defaultSponsorSettings.designs.SHARED.contentHeight,
      },
    },
  };
}
