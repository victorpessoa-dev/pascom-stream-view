"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/services/supabase/browser";
import {
  getOverlayAnimationClass,
  getOverlayBackground,
  getOverlayElementKey,
  getOverlayMediaType,
} from "@/lib/overlays/animations";

const OVERLAY_WIDTH = 1920;
const OVERLAY_HEIGHT = 1080;
const OVERLAY_REFRESH_INTERVAL_MS = 3_000;

function renderElement(element) {
  const mediaType = getOverlayMediaType(element);

  return (
    <div
      key={getOverlayElementKey(element)}
      className={`absolute bg-transparent ${getOverlayAnimationClass(element.animationType)}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
      }}
    >
      <div className="absolute inset-0 overflow-hidden bg-transparent">
        <div
          className="absolute"
          style={{
            left: -(element.cropLeft || 0),
            top: -(element.cropTop || 0),
            width:
              element.width +
              (element.cropLeft || 0) +
              (element.cropRight || 0),
            height:
              element.height +
              (element.cropTop || 0) +
              (element.cropBottom || 0),
          }}
        >
          {element.type === "image" && element.src && mediaType === "image" ? (
            <img
              src={element.src}
              alt=""
              className="h-full w-full object-contain bg-transparent"
              draggable={false}
            />
          ) : null}
          {element.type === "image" && element.src && mediaType === "video" ? (
            <video
              src={element.src}
              className="h-full w-full object-contain bg-transparent"
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
            />
          ) : null}
          {element.type === "text" ? (
            <div
              className="flex h-full w-full items-center justify-center bg-transparent text-center"
              style={{
                fontSize: element.fontSize,
                color: element.fontColor,
                fontFamily: element.fontFamily,
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                lineHeight: 1.2,
              }}
            >
              {element.text}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function PublicOverlayPage({ churchId = "" }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const publicId = typeof params?.id === "string" ? params.id : "";
  const outputBackground = getOverlayBackground(searchParams.get("bgcolor"));

  const [overlay, setOverlay] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    const loadOverlay = async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_overlay", {
          public_id_arg: publicId,
          church_id_arg: churchId,
        });

        if (error) throw error;
        if (cancelled) return;

        // get_public_overlay already validates the church and intentionally does
        // not expose church_id in its public response.
        const row = Array.isArray(data) ? data[0] : data;
        setOverlay(row || null);
      } catch {
        if (!cancelled) {
          setOverlay(null);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    };

    loadOverlay();

    if (!churchId || !publicId) return () => {
      cancelled = true;
    };

    const channel = supabase
      .channel(`shared-overlay-${churchId}-${publicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "overlays",
          filter: `church_id=eq.${churchId}`,
        },
        () => {
          loadOverlay();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") loadOverlay();
      });

    // Realtime handles normal updates; the slower interval recovers from a
    // missed subscription without continuously polling the public API.
    const interval = setInterval(loadOverlay, OVERLAY_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [churchId, publicId]);

  const elements = useMemo(() => {
    return [...(overlay?.data?.elements || [])]
      .filter((element) => element.visible !== false)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [overlay]);

  const fitScale = Math.min(
    viewport.width / OVERLAY_WIDTH,
    viewport.height / OVERLAY_HEIGHT,
  );
  const unusedWidth = Math.max(
    0,
    (viewport.width - OVERLAY_WIDTH * fitScale) / 2,
  );
  const unusedHeight = Math.max(
    0,
    (viewport.height - OVERLAY_HEIGHT * fitScale) / 2,
  );

  if (!loaded || !overlay) {
    return <div className="fixed inset-0 bg-transparent overflow-hidden" />;
  }

  return (
    <div
      data-overlay-transparent-root
      className="fixed inset-0 overflow-hidden select-none pointer-events-none"
      style={{
        userSelect: "none",
        background: outputBackground,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 transition-[height] duration-200 ease-out"
        style={{ height: unusedHeight, background: outputBackground }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 transition-[height] duration-200 ease-out"
        style={{ height: unusedHeight, background: outputBackground }}
      />
      <div
        aria-hidden
        className="absolute left-0 transition-[top,bottom,width] duration-200 ease-out"
        style={{
          top: unusedHeight,
          bottom: unusedHeight,
          width: unusedWidth,
          background: outputBackground,
        }}
      />
      <div
        aria-hidden
        className="absolute right-0 transition-[top,bottom,width] duration-200 ease-out"
        style={{
          top: unusedHeight,
          bottom: unusedHeight,
          width: unusedWidth,
          background: outputBackground,
        }}
      />
      <div className="absolute left-1/2 top-1/2 flex aspect-video w-[min(100vw,177.777vh)] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden bg-transparent transition-[width] duration-200 ease-out">
        <div
          className="relative shrink-0 origin-center select-none bg-transparent transition-transform duration-200 ease-out"
          style={{
            width: OVERLAY_WIDTH,
            height: OVERLAY_HEIGHT,
            transform: `scale(${fitScale})`,
            background: outputBackground,
          }}
        >
          {elements.map(renderElement)}
        </div>
      </div>
    </div>
  );
}
