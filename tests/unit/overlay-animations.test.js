import { describe, expect, it } from "vitest";
import {
  getOverlayAnimationClass,
  getOverlayBackground,
  getOverlayMediaType,
  getOverlayOutputUrl,
  normalizeOverlayAnimation,
} from "@/lib/overlays/animations";

describe("overlay animation helpers", () => {
  it("keeps existing animation values compatible", () => {
    expect(normalizeOverlayAnimation("fade-in-up")).toBe("fade-up");
    expect(getOverlayAnimationClass("slide-in-from-left")).toBe(
      "overlay-motion-slide-left",
    );
  });

  it("identifies browser-playable video media", () => {
    expect(getOverlayMediaType({ src: "https://cdn.test/intro.webm" })).toBe(
      "video",
    );
    expect(getOverlayMediaType({ src: "https://cdn.test/logo.png" })).toBe(
      "image",
    );
  });

  it("allows safe chroma-key output backgrounds only", () => {
    expect(getOverlayBackground("rgb(0, 255, 0)")).toBe("rgb(0, 255, 0)");
    expect(getOverlayBackground("green; color: red")).toBe("transparent");
  });

  it("builds a chroma-key output URL without accepting unsafe colors", () => {
    expect(getOverlayOutputUrl("/minha-igreja/shared/overlay-1")).toBe(
      "/minha-igreja/shared/overlay-1",
    );
    expect(
      getOverlayOutputUrl("/minha-igreja/shared/overlay-1", "green"),
    ).toBe(
      "/minha-igreja/shared/overlay-1?bgcolor=green",
    );
    expect(
      getOverlayOutputUrl("/minha-igreja/shared/overlay-1", "green; color:red"),
    ).toBe("/minha-igreja/shared/overlay-1");
  });
});
