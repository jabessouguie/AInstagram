"use client";

import { useState } from "react";
import { Clock, CalendarPlus } from "lucide-react";

import { ScheduleModal } from "@/components/calendar/ScheduleModal";
import { saveItem } from "@/lib/calendar-store";
import type { OptimalSlot, ScheduledItem } from "@/types/instagram";

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface OptimalSlotsWidgetProps {
  slots: OptimalSlot[];
  contentType: "carousel" | "reel" | "post" | "story";
  caption?: string;
}

export function OptimalSlotsWidget({ slots, contentType, caption }: OptimalSlotsWidgetProps) {
  const [draft, setDraft] = useState<Partial<ScheduledItem> | null>(null);
  const topSlots = slots.filter((s) => s.isTopSlot).slice(0, 3);

  if (topSlots.length === 0) return null;

  const contentTypeLabel = {
    carousel: "Carousel",
    reel: "Réel",
    post: "Post",
    story: "Story",
  }[contentType];

  const openSchedule = (slot: OptimalSlot) => {
    // Build a date for the next occurrence of this day/hour
    const now = new Date();
    const target = new Date(now);
    const todayDay = now.getDay();
    let daysUntil = (slot.dayIndex - todayDay + 7) % 7;
    if (daysUntil === 0 && now.getHours() >= slot.hour) daysUntil = 7;
    target.setDate(now.getDate() + daysUntil);
    target.setHours(slot.hour, 0, 0, 0);

    setDraft({
      type: contentType,
      status: "draft",
      caption: caption ?? "",
      scheduledAt: target.toISOString(),
      assets: [],
      hashtags: [],
    });
  };

  return (
    <>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Clock className="h-3.5 w-3.5" />
          Meilleurs créneaux pour un {contentTypeLabel.toLowerCase()}
        </div>
        <div className="flex flex-wrap gap-2">
          {topSlots.map((slot, i) => (
            <button
              key={i}
              onClick={() => openSchedule(slot)}
              className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <CalendarPlus className="h-3 w-3" />
              {DAYS_FR[slot.dayIndex]} {String(slot.hour).padStart(2, "0")}h
              <span className="text-[10px] text-primary/70">({Math.round(slot.score * 100)}%)</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Cliquez sur un créneau pour programmer votre contenu.
        </p>
      </div>

      {draft && (
        <ScheduleModal
          draft={draft}
          slots={slots}
          onSchedule={(item) => {
            saveItem(item);
            setDraft(null);
          }}
          onDismiss={() => setDraft(null)}
        />
      )}
    </>
  );
}
