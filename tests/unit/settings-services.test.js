import { describe, expect, it } from "vitest";
import { mergeSponsorSettings } from "@/lib/mappers/settings";
import {
  getTelaoDefaultDurations,
  saveAdminSettings,
} from "@/lib/services/settings";

function createSettingsSupabaseMock(initialValue) {
  const calls = [];

  return {
    calls,
    from(table) {
      expect(table).toBe("app_settings");
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle() {
          return Promise.resolve({
            data: { value: initialValue },
            error: null,
          });
        },
        upsert(payload) {
          calls.push(payload);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
}

describe("settings services", () => {
  it("normalizes legacy telao default duration", async () => {
    const supabase = createSettingsSupabaseMock({
      telao: {
        defaultDuration: 22,
      },
    });

    await expect(
      getTelaoDefaultDurations(supabase, "church-1"),
    ).resolves.toEqual({
      NORMAL: 22,
      MASTER: 22,
    });
  });

  it("saves normalized admin settings", async () => {
    const supabase = createSettingsSupabaseMock(null);
    const saved = await saveAdminSettings(
      supabase,
      {
        telao: { defaultDurationNormal: 9 },
      },
      "church-1",
    );

    expect(saved.telao.defaultDurationNormal).toBe(9);
    expect(saved.telao.defaultDurationMaster).toBe(15);
    expect(supabase.calls[0]).toMatchObject({
      key: "admin_settings",
      value: {
        telao: saved.telao,
      },
    });
    expect(supabase.calls[0].value.appearance).toBeUndefined();
  });

  it("normalizes paused sponsor counters by screen", () => {
    expect(
      mergeSponsorSettings({
        metricsEnabled: true,
        metricsPaused: {
          NORMAL: true,
        },
      }),
    ).toMatchObject({
      metricsEnabled: true,
      metricsPaused: {
        NORMAL: true,
        MASTER: false,
      },
    });
  });

  it("uses one shared design and migrates the legacy normal layout", () => {
    const settings = mergeSponsorSettings({
      designs: {
        NORMAL: {
          backgroundUrl: "https://cdn.example/legacy-background.webp",
          contentWidth: 64,
        },
      },
    });

    expect(settings.designs).toEqual({
      SHARED: expect.objectContaining({
        backgroundUrl: "https://cdn.example/legacy-background.webp",
        contentWidth: 64,
      }),
    });
  });
});
