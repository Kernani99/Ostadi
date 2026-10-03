"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ostadi-theme";

/** يُحقن في <head> قبل الرسم الأول لتفادي وميض الوضع الفاتح. محتوى ثابت لا يقبل أي مدخلات. */
export const themeInitScript = `try{if(localStorage.getItem("${STORAGE_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // التخزين المحلي غير متاح (وضع خاص) — التبديل يبقى فعّالاً لهذه الجلسة فقط
    }
    setDark(next);
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
      className="h-9 w-9 text-muted-foreground"
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
