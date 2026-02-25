"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIFeedbackBarProps {
  onRegenerate: (feedback: string) => void;
  isGenerating: boolean;
  placeholder?: string;
}

/**
 * Reusable feedback + regeneration bar shown below any AI-generated output.
 * Lets the user type optional directions and trigger a new generation.
 */
export function AIFeedbackBar({ onRegenerate, isGenerating, placeholder }: AIFeedbackBarProps) {
  const [feedback, setFeedback] = useState("");

  const handleClick = () => {
    onRegenerate(feedback);
    setFeedback("");
  };

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border/50 bg-muted/30 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Pas satisfait · précisez vos retours (optionnel)
      </p>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={
          placeholder ??
          "Ex : rends le ton plus professionnel, ajoute plus de chiffres, cible une audience plus jeune…"
        }
        rows={2}
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
      />
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs"
        onClick={handleClick}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        {isGenerating ? "Régénération…" : "Régénérer"}
      </Button>
    </div>
  );
}
