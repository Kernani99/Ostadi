"use client";

import { DirectionProvider } from "@radix-ui/react-direction";

/** يجعل كل مكوّنات Radix (القوائم، التبويبات، الاختيارات…) تتصرف RTL دون تمرير dir لكل واحد. */
export function AppDirection({ children }: { children: React.ReactNode }) {
  return <DirectionProvider dir="rtl">{children}</DirectionProvider>;
}
