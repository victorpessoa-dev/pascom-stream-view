import { describe, expect, it } from "vitest";
import { normalizeLogPayload } from "@/app/api/anunciantes/logs/route";

const sponsorId = "00000000-0000-4000-8000-000000000001";

describe("sponsor log payload validation", () => {
  it("normalizes a single log payload", () => {
    expect(
      normalizeLogPayload({
        sponsor_id: sponsorId,
        duration_seconds: "12",
        source: "telao",
      }),
    ).toMatchObject([
      {
        sponsorId,
        durationSeconds: 12,
        source: "telao",
      },
    ]);
  });

  it("normalizes batch payloads", () => {
    expect(
      normalizeLogPayload({
        logs: [
          { sponsorId, durationSeconds: 1 },
          { sponsor_id: sponsorId, duration_seconds: 2 },
        ],
      }),
    ).toHaveLength(2);
  });

  it("rejects missing sponsor ids", () => {
    expect(() => normalizeLogPayload({ durationSeconds: 10 })).toThrow();
  });
});
