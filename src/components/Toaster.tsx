"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          error: "group-[.toast]:bg-red-500/10 group-[.toast]:text-red-400 group-[.toast]:border-red-500/20",
          success: "group-[.toast]:bg-emerald-500/10 group-[.toast]:text-emerald-400 group-[.toast]:border-emerald-500/20",
          warning: "group-[.toast]:bg-amber-500/10 group-[.toast]:text-amber-400 group-[.toast]:border-amber-500/20",
          info: "group-[.toast]:bg-blue-500/10 group-[.toast]:text-blue-400 group-[.toast]:border-blue-500/20",
        },
      }}
    />
  );
}
