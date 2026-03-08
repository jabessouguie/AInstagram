"use client";

import { useState, useEffect } from "react";
import { Palette, Type, Check, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstagramData } from "@/hooks/useInstagramData";
import { useT } from "@/lib/i18n";
import {
  loadBrandSettings,
  saveBrandSettings,
  DEFAULT_BRAND_SETTINGS,
  type BrandSettings,
} from "@/lib/brand-settings-store";

// Popular Google Fonts for creator content
const FONT_OPTIONS = [
  "Playfair Display",
  "Montserrat",
  "Roboto",
  "Inter",
  "Lato",
  "Poppins",
  "Raleway",
  "Oswald",
  "Merriweather",
  "Nunito",
  "Josefin Sans",
  "Cormorant Garamond",
  "DM Serif Display",
  "Space Grotesk",
  "Bebas Neue",
];

// ─── Font selector ─────────────────────────────────────────────────────────────

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>
      <p className="text-sm" style={{ fontFamily: value }}>
        Aperçu : Créateur de contenu passionné
      </p>
    </div>
  );
}

// ─── Color input ──────────────────────────────────────────────────────────────

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
      />
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-mono text-xs text-foreground">{value.toUpperCase()}</p>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-f]{0,6}$/i.test(v)) onChange(v);
        }}
        className="w-28 rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        maxLength={7}
        placeholder="#000000"
      />
    </div>
  );
}

// ─── Color palette preview ────────────────────────────────────────────────────

function PalettePreview({ settings }: { settings: BrandSettings }) {
  return (
    <div className="flex gap-2 pt-2">
      {[
        settings.primaryColor,
        settings.secondaryColor,
        settings.accentColor,
        settings.neutralColor,
      ].map((color, i) => (
        <div
          key={i}
          className="h-10 flex-1 rounded-lg border border-border/40"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useT();
  const { data: instagramData } = useInstagramData();
  const [settings, setSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings(loadBrandSettings());
  }, []);

  const update = (key: keyof BrandSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveBrandSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings(DEFAULT_BRAND_SETTINGS);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header profile={instagramData?.profile} mode="creator" />

      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Palette className="h-6 w-6 text-primary" />
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        <div className="space-y-6">
          {/* Fonts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="h-4 w-4 text-primary" />
                {t("settings.fonts.title")}
              </CardTitle>
              <CardDescription>
                Ces polices seront pré-remplies dans le créateur de carousel et le media kit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FontSelect
                label={t("settings.fonts.title_label")}
                value={settings.fontTitle}
                onChange={(v) => update("fontTitle", v)}
              />
              <FontSelect
                label={t("settings.fonts.subtitle_label")}
                value={settings.fontSubtitle}
                onChange={(v) => update("fontSubtitle", v)}
              />
              <FontSelect
                label={t("settings.fonts.body_label")}
                value={settings.fontBody}
                onChange={(v) => update("fontBody", v)}
              />
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-primary" />
                {t("settings.colors.title")}
              </CardTitle>
              <CardDescription>
                Ces couleurs seront utilisées comme valeurs par défaut dans vos créations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorInput
                label={t("settings.colors.primary")}
                value={settings.primaryColor}
                onChange={(v) => update("primaryColor", v)}
              />
              <ColorInput
                label={t("settings.colors.secondary")}
                value={settings.secondaryColor}
                onChange={(v) => update("secondaryColor", v)}
              />
              <ColorInput
                label={t("settings.colors.accent")}
                value={settings.accentColor}
                onChange={(v) => update("accentColor", v)}
              />
              <ColorInput
                label={t("settings.colors.neutral")}
                value={settings.neutralColor}
                onChange={(v) => update("neutralColor", v)}
              />
              <PalettePreview settings={settings} />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} className="gap-2">
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  {t("settings.saved")}
                </>
              ) : (
                t("settings.save")
              )}
            </Button>
            <Button variant="ghost" onClick={handleReset} className="gap-2 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              {t("settings.reset")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
