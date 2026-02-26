"use client";

import useSWR from "swr";
import type { DataApiResponse, InstagramAnalytics } from "@/types/instagram";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface UseInstagramDataReturn {
  data: InstagramAnalytics | undefined;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
  /** Update the SWR cache directly (no re-fetch). Use after upload to show data immediately. */
  setData: (analytics: InstagramAnalytics) => void;
}

export function useInstagramData(): UseInstagramDataReturn {
  const { data, error, isLoading, mutate } = useSWR<DataApiResponse>("/api/data", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5_000, // short dedup — mutate() after upload triggers a real re-fetch
  });

  return {
    data: data?.data,
    isLoading,
    isError: !!error || (!!data && !data.success),
    // Force revalidation ignoring cache/dedup
    mutate: () => { void mutate(undefined, { revalidate: true }); },
    // Directly inject parsed data into the SWR cache (no extra /api/data round-trip)
    setData: (analytics: InstagramAnalytics) => {
      void mutate({ success: true, data: analytics }, { revalidate: false });
    },
  };
}
