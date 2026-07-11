"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial = stored === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}
    >
      {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}