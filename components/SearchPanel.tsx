"use client";

import { useState } from "react";
import { Search, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import { University, FlatCourse } from "@/types/university";
import { SearchAccessGate } from "@/components/SearchAccessGate";
import { generateSearchResultsPdf } from "@/lib/generatePdf";

type Mode = "university" | "course" | "combined";

export function SearchPanel({
  universities,
  allCourses,
}: {
  universities: University[];
  allCourses: FlatCourse[];
}) {
  const [mode, setMode] = useState<Mode>("university");

  // University-mode state
  const [uniQuery, setUniQuery] = useState("");
  const [uniState, setUniState] = useState("");
  const [uniType, setUniType] = useState("");

  // Course-mode state
  const [courseQuery, setCourseQuery] = useState("");
  const [comparator, setComparator] = useState<"any" | "under" | "over">("any");
  const [cutoffValue, setCutoffValue] = useState<number | "">("");

  // Combined-mode adds state/type on top of course search
  const [combinedState, setCombinedState] = useState("");
  const [combinedType, setCombinedType] = useState("");

  const states = Array.from(new Set(universities.map((u) => u.state))).sort();

  const uniResults = universities
    .filter((u) => {
      const q = uniQuery.trim().toLowerCase();
      const matchesQuery = !q || u.name.toLowerCase().includes(q);
      const matchesState = !uniState || u.state === uniState;
      const matchesType = !uniType || u.type === uniType;
      return matchesQuery && matchesState && matchesType;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const courseResults = allCourses
    .filter((c) => {
      const q = courseQuery.trim().toLowerCase();
      const matchesQuery = !q || c.name.toLowerCase().includes(q);
      const matchesCutoff =
        comparator === "any" || cutoffValue === ""
          ? true
          : comparator === "under"
          ? c.cutoffMark < Number(cutoffValue)
          : c.cutoffMark > Number(cutoffValue);
      const matchesState = mode === "combined" ? !combinedState || c.universityState === combinedState : true;
      const matchesType = mode === "combined" ? !combinedType || c.universityType === combinedType : true;
      return matchesQuery && matchesCutoff && matchesState && matchesType;
    })
    .sort((a, b) => a.cutoffMark - b.cutoffMark);

  const showCourseResults = mode !== "university" && (courseQuery.trim() !== "" || cutoffValue !== "");
  const showUniResults = mode === "university";

  async function handleDownloadPdf() {
    const rows = courseResults.map((c) => ({
      courseName: c.name,
      universityName: c.universityName,
      universityState: c.universityState,
      cutoffMark: c.cutoffMark,
    }));

    const label =
      courseQuery.trim() || (cutoffValue !== "" ? `Cut-off ${comparator} ${cutoffValue}` : "All courses");

    const pdfBytes = await generateSearchResultsPdf(rows, label);
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `varsityline-search-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Mode tabs */}
      <div className="mb-3 flex gap-1.5">
        {(["university", "course", "combined"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: mode === m ? "var(--amber)" : "var(--border)",
              color: mode === m ? "var(--amber)" : "var(--text-muted)",
              background: mode === m ? "var(--amber-dim)" : "var(--bg-card)",
            }}
          >
            {m === "university" ? "By university" : m === "course" ? "By course" : "Course + filters"}
          </button>
        ))}
      </div>

      {/* University mode */}
      {mode === "university" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput
            value={uniQuery}
            onChange={setUniQuery}
            placeholder="Search a university (e.g. UNILAG)"
          />
          <select
            value={uniState}
            onChange={(e) => setUniState(e.target.value)}
            className="rounded-card border px-3.5 py-2.5 text-sm outline-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="">Any state</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={uniType}
            onChange={(e) => setUniType(e.target.value)}
            className="rounded-card border px-3.5 py-2.5 text-sm outline-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="">Any type</option>
            <option value="Federal">Federal</option>
            <option value="State">State</option>
            <option value="Private">Private</option>
          </select>
        </div>
      )}

      {/* Course + Combined modes */}
      {mode !== "university" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={courseQuery}
              onChange={setCourseQuery}
              placeholder="Search a course (e.g. Computer Science)"
            />
            <div className="flex gap-2">
              <select
                value={comparator}
                onChange={(e) => setComparator(e.target.value as typeof comparator)}
                className="rounded-card border px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <option value="any">Any score</option>
                <option value="under">Score under</option>
                <option value="over">Score over</option>
              </select>
              <input
                type="number"
                disabled={comparator === "any"}
                value={cutoffValue}
                onChange={(e) => setCutoffValue(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 220"
                className="w-24 rounded-card border px-3 py-2.5 text-sm outline-none disabled:opacity-40"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>

          {mode === "combined" && (
            <div className="flex gap-2">
              <select
                value={combinedState}
                onChange={(e) => setCombinedState(e.target.value)}
                className="flex-1 rounded-card border px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <option value="">Any state</option>
                {states.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={combinedType}
                onChange={(e) => setCombinedType(e.target.value)}
                className="flex-1 rounded-card border px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <option value="">Any type</option>
                <option value="Federal">Federal</option>
                <option value="State">State</option>
                <option value="Private">Private</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="mt-4">
        {showUniResults && (
          <ResultsList
            count={uniResults.length}
            items={uniResults.map((u) => ({
              key: u.id,
              href: `/${u.slug}`,
              title: u.name,
              subtitle: `${u.state} State · ${u.type}`,
              badge: `Cut-off ${u.jambCutoff}`,
            }))}
          />
        )}

        {showCourseResults && (
          <SearchAccessGate>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs" style={{ color: "var(--text-faint)" }}>
                {courseResults.length} {courseResults.length === 1 ? "result" : "results"}
              </span>
              {courseResults.length > 0 && (
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px]"
                  style={{ borderColor: "var(--amber)", color: "var(--amber)" }}
                >
                  <Download size={12} /> Download PDF
                </button>
              )}
            </div>
            <ResultsList
              count={courseResults.length}
              items={courseResults.map((c) => ({
                key: c.id,
                href: `/${c.universitySlug}`,
                title: c.name,
                subtitle: `${c.universityName} · ${c.universityState} State`,
                badge: `${c.cutoffMark}`,
              }))}
              hideCount
            />
          </SearchAccessGate>
        )}
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div
      className="flex flex-1 items-center gap-2 rounded-card border px-3.5 py-2.5"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <Search size={16} style={{ color: "var(--text-faint)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-faint)]"
        style={{ color: "var(--text)" }}
      />
    </div>
  );
}

function ResultsList({
  count,
  items,
  hideCount,
}: {
  count: number;
  items: { key: string; href: string; title: string; subtitle: string; badge: string }[];
  hideCount?: boolean;
}) {
  return (
    <div>
      {!hideCount && (
        <div className="mb-2 font-mono text-xs" style={{ color: "var(--text-faint)" }}>
          {count} {count === 1 ? "result" : "results"}
        </div>
      )}
      {count === 0 ? (
        <div
          className="rounded-card border p-6 text-center text-sm"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text-muted)" }}
        >
          No matches. Try a different course name or cut-off range.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center justify-between rounded-card border p-3.5 transition-colors hover:border-[var(--amber)]"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.subtitle}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-xs font-semibold"
                  style={{ color: "var(--amber)" }}
                >
                  {item.badge}
                </span>
                <ArrowRight size={14} style={{ color: "var(--amber)" }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
