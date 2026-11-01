"use client";

import { useEffect } from "react";

type Props = { sw?: string; scope?: string };

// Enregistre le service worker de la PWA. Rendu nul : aucun impact sur la page.
export function PwaRegister({ sw = "/sw.js", scope }: Props) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(sw, scope ? { scope } : undefined).catch(() => {
      // Hors ligne ou navigateur sans support : l'app reste utilisable sans SW.
    });
  }, [sw, scope]);
  return null;
}
