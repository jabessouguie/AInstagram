"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AudienceInsights } from "@/types/instagram";

interface AudienceDemographicsProps {
  audienceInsights: AudienceInsights | undefined;
  isLoading?: boolean;
}

export function AudienceDemographics({ audienceInsights, isLoading }: AudienceDemographicsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-1 h-3 w-32" />
        </CardHeader>
        <CardContent className="space-y-5">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-28 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!audienceInsights) {
    return (
      <Card className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Données démographiques non disponibles</p>
      </Card>
    );
  }

  const { genderSplit, ageGroups, topCountries, topCities, period } = audienceInsights;

  const ageData = Object.entries(ageGroups).map(([group, pct]) => ({ group, pct }));

  const topCountriesList = Object.entries(topCountries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topCitiesList = Object.entries(topCities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxCountryPct = topCountriesList[0]?.[1] ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Démographie de l&apos;audience</CardTitle>
        <CardDescription>Période : {period}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gender split */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Genre</p>
          <div className="flex h-3 overflow-hidden rounded-full">
            <div
              className="bg-pink-400 transition-all duration-700"
              style={{ width: `${genderSplit.female}%` }}
            />
            <div className="flex-1 bg-blue-400" />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px]">
            <span className="font-semibold text-pink-400">♀ Femmes {genderSplit.female}%</span>
            <span className="font-semibold text-blue-400">♂ Hommes {genderSplit.male}%</span>
          </div>
        </div>

        {/* Age groups */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Tranches d&apos;âge</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={ageData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <XAxis
                dataKey="group"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Part"]}
                contentStyle={{
                  fontSize: 11,
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              />
              <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                {ageData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill="hsl(var(--primary))"
                    fillOpacity={entry.group === "25-34" ? 1 : 0.35 + i * 0.08}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top countries */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Top pays</p>
          <div className="space-y-2">
            {topCountriesList.map(([country, pct]) => (
              <div key={country} className="flex items-center gap-2.5">
                <span className="w-28 shrink-0 truncate text-[11px] text-muted-foreground">
                  {country}
                </span>
                <div
                  className="flex-1 overflow-hidden rounded-full bg-muted/50"
                  style={{ height: 5 }}
                >
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all duration-700"
                    style={{ width: `${(pct / maxCountryPct) * 100}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-[11px] font-medium tabular-nums">
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top cities */}
        {topCitiesList.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Top villes</p>
            <div className="flex flex-wrap gap-1.5">
              {topCitiesList.map(([city, pct]) => (
                <span
                  key={city}
                  className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {city} <span className="font-medium">{pct}%</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
