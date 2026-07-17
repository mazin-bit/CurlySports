"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshWhenHidden: false,
        errorRetryCount: 3,
        dedupingInterval: 10_000,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
