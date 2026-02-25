"use client";

import { useState, useCallback } from "react";
import { Bug, X, Camera, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "capturing" | "analyzing" | "success" | "error";

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null); // base64
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const reset = () => {
    setStatus("idle");
    setDescription("");
    setScreenshot(null);
    setIssueUrl(null);
    setErrorMsg(null);
  };

  const captureScreen = useCallback(async () => {
    setStatus("capturing");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      // Draw first frame to canvas
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext("2d")!.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const base64 = canvas.toDataURL("image/png").split(",")[1];
      setScreenshot(base64);
      setStatus("idle");
    } catch {
      // User cancelled or permission denied — stay idle
      setStatus("idle");
    }
  }, []);

  const submit = useCallback(async () => {
    setStatus("analyzing");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshot,
          description,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIssueUrl(json.issueUrl ?? null);
        setStatus("success");
      } else {
        throw new Error(json.error ?? "Erreur inconnue");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur lors de l'envoi");
      setStatus("error");
    }
  }, [screenshot, description]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Signaler un bug"
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background shadow-lg transition-all hover:scale-105 hover:border-red-400 hover:text-red-400"
      >
        <Bug className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 rounded-xl border border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Bug className="h-4 w-4 text-red-400" />
          Signaler un bug
        </span>
        <button
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 p-4">
        {status === "success" ? (
          <div className="space-y-3 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium">Issue créée avec succès !</p>
            {issueUrl && (
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-400 underline"
              >
                Voir l&apos;issue GitLab →
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Fermer
            </Button>
          </div>
        ) : status === "error" ? (
          <div className="space-y-3 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={reset}>
              Réessayer
            </Button>
          </div>
        ) : (
          <>
            {/* Screenshot preview */}
            {screenshot ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${screenshot}`}
                  alt="Capture d'écran"
                  className="w-full rounded-lg border border-border object-cover"
                  style={{ maxHeight: 120 }}
                />
                <button
                  onClick={() => setScreenshot(null)}
                  className="absolute right-1 top-1 rounded bg-background/80 p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={captureScreen}
                disabled={status === "capturing"}
              >
                {status === "capturing" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
                {status === "capturing" ? "Capture en cours…" : "Capturer l'écran"}
              </Button>
            )}

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement le problème (optionnel)…"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />

            <p className="text-[10px] text-muted-foreground">
              L&apos;IA analysera la capture et créera automatiquement une issue GitLab.
            </p>

            <Button
              size="sm"
              className="w-full text-xs"
              onClick={submit}
              disabled={status === "analyzing" || (!screenshot && !description.trim())}
            >
              {status === "analyzing" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyse en cours…
                </>
              ) : (
                <>
                  <Bug className="h-3 w-3" />
                  Créer l&apos;issue
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
