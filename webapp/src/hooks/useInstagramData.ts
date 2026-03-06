"use client";

import { useEffect } from "react";
import useSWR from "swr";
import type { DataApiResponse, InstagramAnalytics } from "@/types/instagram";

export function getIgHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("ig_access_token");
  const accountId = localStorage.getItem("ig_account_id");
  if (token && accountId) {
    return {
      "X-Instagram-Token": token,
      "X-Instagram-Account-Id": accountId,
    };
  }
  return {};
}

const fetcher = (url: string) => fetch(url, { headers: getIgHeaders() }).then((r) => r.json());

export interface UseInstagramDataReturn {
  data: InstagramAnalytics | undefined;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
  /** Update the SWR cache directly (no re-fetch). Use after upload to show data immediately. */
  setData: (analytics: InstagramAnalytics) => void;
}

export interface UseInstagramDataParams {
  from?: string;
  to?: string;
}

export function useInstagramData(params?: UseInstagramDataParams): UseInstagramDataReturn {
  const queryString = params
    ? new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null) as [string, string][]
      ).toString()
    : "";
  const url = queryString ? `/api/data?${queryString}` : "/api/data";

  const { data, error, isLoading, mutate } = useSWR<DataApiResponse>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5_000,
  });

  // Re-fetch when the Instagram token changes in localStorage (e.g. after connecting the API)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ig_access_token" || e.key === "ig_account_id") {
        void mutate(undefined, { revalidate: true });
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [mutate]);

  return {
    data: data?.data,
    isLoading,
    isError: !!error || (!!data && !data.success),
    // Force revalidation ignoring cache/dedup
    mutate: () => {
      void mutate(undefined, { revalidate: true });
    },
    // Directly inject parsed data into the SWR cache (no extra /api/data round-trip)
    setData: (analytics: InstagramAnalytics) => {
      void mutate({ success: true, data: analytics }, { revalidate: false });
    },
  };
}
