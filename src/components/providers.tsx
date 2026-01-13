'use client';

import { I18nProvider } from "@/hooks/useI18n";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
