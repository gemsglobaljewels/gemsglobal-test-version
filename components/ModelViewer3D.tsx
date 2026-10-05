"use client";

import { useEffect, useRef, useState } from "react";

interface ModelViewer3DProps {
  src: string;
  poster?: string;
  height?: number;
  className?: string;
  fill?: boolean;
}

/** USDZ is Apple AR Quick Look only — <model-viewer> can't render it inline. */
export function isUsdz(src: string) {
  return /\.usdz([?#]|$)/i.test(src || "");
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Route cross-origin model URLs through our proxy which adds CORS headers.
 * R2 public buckets don't send Access-Control-Allow-Origin, blocking fetch.
 */
function proxyUrl(src: string) {
  if (!src || typeof window === "undefined") return src;
  try {
    const u = new URL(src, window.location.href);
    // Same-origin URLs don't need the proxy.
    if (u.origin === window.location.origin) return src;
    return `/api/proxy-model?url=${encodeURIComponent(u.href)}`;
  } catch {
    return src;
  }
}

/** Warm up the viewer script early (page load) so the 3D tab opens fast. */
export function preloadModelViewer() {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) return Promise.resolve();
  return import("@google/model-viewer")
    .then(() => customElements.whenDefined("model-viewer"))
    .then(() => undefined)
    .catch(() => undefined);
}

/** Hint the browser to start downloading the model file early. */
export function prefetchModel(src: string) {
  if (typeof window === "undefined" || !src || isUsdz(src)) return;
  const href = proxyUrl(src.split("#")[0]);
  if (document.querySelector(`link[data-model-prefetch="${CSS.escape(href)}"]`)) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  link.setAttribute("data-model-prefetch", href);
  document.head.appendChild(link);
}

export default function ModelViewer3D({
  src,
  poster,
  height = 360,
  className,
  fill = false,
}: ModelViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const usdz = isUsdz(src);

  useEffect(() => {
    if (!src || usdz) return;

    let mounted = true;

    // Load model-viewer script once globally.
    const load = async () => {
      if (customElements.get("model-viewer")) {
        if (mounted) setState("ready");
        return;
      }

      try {
        await import("@google/model-viewer");
        await customElements.whenDefined("model-viewer");
        if (mounted) setState("ready");
      } catch (err) {
        console.error("[ModelViewer3D] Script load failed:", err);
        if (mounted) setState("error");
      }
    };

    load();
    return () => { mounted = false; };
  }, [src, usdz]);

  useEffect(() => {
    if (state !== "ready" || !containerRef.current || !src || usdz) return;

    const container = containerRef.current;
    const proxied = proxyUrl(src);

    // Build model-viewer element imperatively (React doesn't handle custom element props well).
    const mv = document.createElement("model-viewer") as any;
    mv.src = proxied;
    if (poster) mv.poster = poster;
    mv.setAttribute("camera-controls", "");
    mv.setAttribute("auto-rotate", "");
    mv.setAttribute("auto-rotate-delay", "1000");
    mv.setAttribute("environment-image", "neutral");
    mv.setAttribute("shadow-intensity", "1");
    mv.setAttribute("exposure", "1");
    mv.setAttribute("loading", "eager");
    mv.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
      ${fill ? "" : `min-height: ${height}px;`}
      background: transparent;
      border-radius: 8px;
      --poster-color: transparent;
    `;

    const onError = (e: any) => {
      console.error("[ModelViewer3D] Model load error:", e?.detail || e);
      setState("error");
    };
    mv.addEventListener("error", onError);
    mv.addEventListener("load", () => console.log("[ModelViewer3D] Model loaded"));

    container.appendChild(mv);

    return () => {
      mv.removeEventListener("error", onError);
      mv.remove();
    };
  }, [state, src, poster, height, fill, usdz]);

  const boxStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%" }
    : { width: "100%", height, minHeight: height };

  // USDZ: browsers can't render it inline — AR Quick Look on iOS, download elsewhere.
  if (usdz) {
    return (
      <div
        className={className}
        style={{
          ...boxStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f6fa",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center", padding: 16 }}>
          <span style={{ fontSize: 28 }}>📱</span>
          <p style={{ fontSize: 13, color: "#555", margin: "10px 0 4px", fontWeight: 600 }}>
            {isIOS() ? "View this model in AR" : "3D preview not supported"}
          </p>
          <p style={{ fontSize: 11, color: "#888", margin: "0 0 10px" }}>
            {isIOS()
              ? "Tap below to open in AR Quick Look."
              : "This model is USDZ (Apple AR). Open on iPhone/iPad for AR, or download."}
          </p>
          <a
            href={src}
            rel="ar noreferrer"
            download={!isIOS()}
            style={{
              display: "inline-block",
              fontSize: 12,
              color: "#fff",
              background: "#4169E1",
              padding: "8px 18px",
              borderRadius: 20,
              textDecoration: "none",
            }}
          >
            {isIOS() ? "Open in AR" : "Download model"}
          </a>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        className={className}
        style={{
          ...boxStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f6fa",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 24, opacity: 0.3 }}>💎</span>
          <p style={{ fontSize: 12, color: "#888", margin: "8px 0 4px" }}>
            3D preview unavailable
          </p>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: "#4169E1", textDecoration: "underline" }}
          >
            Download model file
          </a>
        </div>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div
        className={className}
        style={{
          ...boxStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f6fa",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2px solid rgba(26,58,107,0.15)",
              borderTopColor: "#4169E1",
              animation: "spin 0.75s linear infinite",
              margin: "0 auto 8px",
            }}
          />
          <span style={{ fontSize: 12, color: "#888" }}>Loading 3D viewer…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...boxStyle, borderRadius: 8, overflow: "hidden" }}
    />
  );
}
