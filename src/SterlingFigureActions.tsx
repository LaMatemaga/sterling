"use client";

import { Check, ClipboardCopy, Download, LoaderCircle, MoreHorizontal, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { sterlingRowsToCsv, type SterlingDataExport } from "./dataExport";
import type { SterlingLocale } from "./types";

type ActionState =
  | "idle"
  | "copying"
  | "copied"
  | "downloading-image"
  | "downloading-data"
  | "sharing"
  | "shared"
  | "error";

const copy = {
  es: {
    copy: "Copiar imagen",
    copied: "Imagen copiada",
    more: "Exportar o compartir",
    downloadImage: "Descargar imagen PNG",
    downloadData: "Descargar datos de la figura (.csv)",
    share: "Compartir figura",
    shared: "Compartida",
    error: "No se pudo completar la acción",
  },
  en: {
    copy: "Copy image",
    copied: "Image copied",
    more: "Export or share",
    downloadImage: "Download PNG image",
    downloadData: "Download figure data (.csv)",
    share: "Share figure",
    shared: "Shared",
    error: "The action could not be completed",
  },
} as const;

function fileName(title: string, extension: "png" | "csv") {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "sterling-figure"}.${extension}`;
}

function resolveSvgColors(root: HTMLElement) {
  const snapshots: Array<{ element: SVGElement; style: string | null }> = [];
  const properties = ["color", "fill", "stroke", "stop-color", "flood-color"] as const;

  root.querySelectorAll<SVGElement>("svg, svg *").forEach((element) => {
    snapshots.push({ element, style: element.getAttribute("style") });
    const computed = getComputedStyle(element);

    for (const property of properties) {
      const value = computed.getPropertyValue(property).trim();
      if (value && value !== "none" && !value.startsWith("url(")) {
        element.style.setProperty(property, value);
      }
    }
  });

  return () => {
    for (const { element, style } of snapshots) {
      if (style === null) element.removeAttribute("style");
      else element.setAttribute("style", style);
    }
  };
}

function triggerDownload(href: string, name: string) {
  const link = document.createElement("a");
  link.download = name;
  link.href = href;
  document.body.append(link);
  link.click();
  link.remove();
}

export function SterlingFigureActions({
  locale,
  title,
  dataExport,
}: {
  locale: SterlingLocale;
  title: string;
  dataExport?: SterlingDataExport;
}) {
  const actionsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<ActionState>("idle");
  const t = copy[locale];
  const busy = ["copying", "downloading-image", "downloading-data", "sharing"].includes(state);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function renderCard() {
    const figure = actionsRef.current?.closest(".sterling-figure");
    const card = figure?.querySelector<HTMLElement>(".sterling-figure__inner");
    if (!card) throw new Error("Sterling figure not found");
    await document.fonts.ready;

    const actions = card.querySelector<HTMLElement>(".sterling-figure__actions");
    const actionsVisibility = actions?.style.visibility ?? "";
    if (actions) actions.style.visibility = "hidden";

    const bounds = card.getBoundingClientRect();
    const backgroundColor = getComputedStyle(card).backgroundColor;
    const restoreSvgColors = resolveSvgColors(card);

    try {
      return await toPng(card, {
        backgroundColor,
        cacheBust: true,
        width: Math.ceil(bounds.width),
        height: Math.ceil(bounds.height),
        pixelRatio: 2,
      });
    } finally {
      restoreSvgColors();
      if (actions) actions.style.visibility = actionsVisibility;
    }
  }

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }

  function resetSoon(next: ActionState) {
    setState(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 1800);
  }

  async function copyImage() {
    try {
      setState("copying");
      const dataUrl = await renderCard();
      const blob = await fetch(dataUrl).then((response) => response.blob());
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Image clipboard is not available");
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      resetSoon("copied");
    } catch {
      resetSoon("error");
    }
  }

  async function downloadImage() {
    try {
      setState("downloading-image");
      const dataUrl = await renderCard();
      triggerDownload(dataUrl, fileName(title, "png"));
      closeMenu();
      resetSoon("idle");
    } catch {
      resetSoon("error");
    }
  }

  function downloadData() {
    if (!dataExport) return;
    try {
      setState("downloading-data");
      const csv = sterlingRowsToCsv(dataExport.rows);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, dataExport.fileName ? `${dataExport.fileName}.csv` : fileName(title, "csv"));
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      closeMenu();
      resetSoon("idle");
    } catch {
      resetSoon("error");
    }
  }

  async function shareFigure() {
    try {
      setState("sharing");
      const dataUrl = await renderCard();
      const blob = await fetch(dataUrl).then((response) => response.blob());
      const image = new File([blob], fileName(title, "png"), { type: "image/png" });
      const shareData = { title, text: title, url: window.location.href, files: [image] };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        closeMenu();
        await navigator.share(shareData);
        resetSoon("shared");
        return;
      }

      if (!navigator.clipboard?.writeText) throw new Error("Sharing is not available");
      await navigator.clipboard.writeText(window.location.href);
      closeMenu();
      resetSoon("shared");
    } catch (error) {
      // Cancelling a native share sheet is not an error worth alarming the reader about.
      if (error instanceof DOMException && error.name === "AbortError") {
        setState("idle");
        return;
      }
      resetSoon("error");
    }
  }

  const copyLabel = state === "copied" ? t.copied : state === "error" ? t.error : t.copy;
  const moreLabel = state === "shared" ? t.shared : state === "error" ? t.error : t.more;

  return (
    <div ref={actionsRef} className="sterling-figure__actions">
      <button
        type="button"
        onClick={copyImage}
        disabled={busy}
        data-state={state}
        aria-label={copyLabel}
        title={copyLabel}
      >
        {state === "copying" ? <LoaderCircle aria-hidden="true" /> : state === "copied" ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
      </button>
      <details ref={menuRef} className="sterling-figure__action-menu">
        <summary aria-label={moreLabel} title={moreLabel}>
          {busy && state !== "copying" ? <LoaderCircle aria-hidden="true" data-state={state} /> : state === "shared" ? <Check aria-hidden="true" /> : <MoreHorizontal aria-hidden="true" />}
        </summary>
        <div role="menu" className="sterling-figure__action-popover">
          <button type="button" role="menuitem" onClick={downloadImage} disabled={busy}>
            <Download aria-hidden="true" /> <span>{t.downloadImage}</span>
          </button>
          {dataExport ? (
            <button type="button" role="menuitem" onClick={downloadData} disabled={busy}>
              <Download aria-hidden="true" /> <span>{t.downloadData}</span>
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={shareFigure} disabled={busy}>
            <Share2 aria-hidden="true" /> <span>{t.share}</span>
          </button>
        </div>
      </details>
    </div>
  );
}
