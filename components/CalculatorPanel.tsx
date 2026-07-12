"use client";

import { useMemo, useState } from "react";
import { Calculator, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { University, FlatCourse } from "@/types/university";
import { getFormula, FormulaResult } from "@/lib/formulas";
import { SearchAccessGate } from "@/components/SearchAccessGate";

type Verdict = "likely" | "borderline" | "unlikely";

type CalculationResult = {
  formulaResult: FormulaResult;
  formulaLabel: string;
  verified: boolean;
  course: FlatCourse;
  university: University;
  difference: number;
  verdict: Verdict;
  alternatives: (FlatCourse & { difference: number })[];
};

export function CalculatorPanel({
  universities,
  allCourses,
}: {
  universities: University[];
  allCourses: FlatCourse[];
}) {
  const [universityId, setUniversityId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [jamb, setJamb] = useState<number | "">("");
  const [postUtme, setPostUtme] = useState<number | "">("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const sortedUniversities = useMemo(
    () => universities.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [universities]
  );

  const coursesForUniversity = useMemo(
    () =>
      allCourses
        .filter((c) => c.universityId === universityId)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allCourses, universityId]
  );

  const selectedUniversity = universities.find((u) => u.id === universityId) ?? null;
  const selectedCourse = allCourses.find((c) => c.id === courseId) ?? null;

  const canCalculate =
    selectedUniversity !== null && selectedCourse !== null && jamb !== "" && Number(jamb) > 0;

  function handleUniversityChange(id: string) {
    setUniversityId(id);
    setCourseId("");
    setResult(null);
  }

  function getVerdict(difference: number): Verdict {
    if (difference >= 0) return "likely";
    if (difference >= -2) return "borderline";
    return "unlikely";
  }

  function handleCalculate() {
    if (!selectedUniversity || !selectedCourse || jamb === "") return;

    const formula = getFormula(selectedUniversity.slug);
    const formulaResult = formula.calculate({
      jamb: Number(jamb),
      postUtme: postUtme === "" ? undefined : Number(postUtme),
    });

    const difference = Math.round((formulaResult.aggregate - selectedCourse.cutoffMark) * 100) / 100;
    const verdict = getVerdict(difference);

    // Alternative courses at the same university the student's aggregate clears,
    // excluding the one they just checked, closest cutoff first.
    const alternatives = coursesForUniversity
      .filter((c) => c.id !== selectedCourse.id && formulaResult.aggregate >= c.cutoffMark)
      .map((c) => ({
        ...c,
        difference: Math.round((formulaResult.aggregate - c.cutoffMark) * 100) / 100,
      }))
      .sort((a, b) => a.difference - b.difference)
      .slice(0, 5);

    setResult({
      formulaResult,
      formulaLabel: formula.label,
      verified: formula.verified,
      course: selectedCourse,
      university: selectedUniversity,
      difference,
      verdict,
      alternatives,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-card border p-5"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-3">
          <Field label="University">
            <select
              value={universityId}
              onChange={(e) => handleUniversityChange(e.target.value)}
              className="w-full rounded-card border px-3.5 py-2.5 text-sm outline-none"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="">Select a university</option>
              {sortedUniversities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Course">
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setResult(null);
              }}
              disabled={!universityId}
              className="w-full rounded-card border px-3.5 py-2.5 text-sm outline-none disabled:opacity-40"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="">
                {universityId ? "Select a course" : "Select a university first"}
              </option>
              {coursesForUniversity.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="JAMB score">
              <input
                type="number"
                min={0}
                max={400}
                value={jamb}
                onChange={(e) => setJamb(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 240"
                className="w-full rounded-card border px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </Field>

            <Field label="Post-UTME score">
              <input
                type="number"
                min={0}
                max={100}
                value={postUtme}
                onChange={(e) => setPostUtme(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 70 (if applicable)"
                className="w-full rounded-card border px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </Field>
          </div>

          <button
            onClick={handleCalculate}
            disabled={!canCalculate}
            className="mt-1 flex items-center justify-center gap-2 rounded-card border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--amber)", color: "var(--amber)", background: "var(--amber-dim)" }}
          >
            <Calculator size={15} />
            Calculate my aggregate
          </button>
        </div>
      </div>

      {result && (
        <SearchAccessGate>
          <ResultCard result={result} />
        </SearchAccessGate>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: CalculationResult }) {
  const { formulaResult, formulaLabel, verified, course, university, difference, verdict, alternatives } = result;

  const verdictConfig: Record<Verdict, { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }> = {
    likely: { label: "Likely", color: "#16a34a", bg: "rgba(22,163,74,0.12)", Icon: CheckCircle2 },
    borderline: { label: "Borderline", color: "#d97706", bg: "rgba(217,119,6,0.12)", Icon: AlertTriangle },
    unlikely: { label: "Unlikely", color: "#dc2626", bg: "rgba(220,38,38,0.12)", Icon: XCircle },
  };
  const v = verdictConfig[verdict];

  return (
    <div
      className="rounded-card border p-5"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--amber)" }}>
          Result
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ color: v.color, background: v.bg }}
        >
          <v.Icon size={13} />
          {v.label}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium">{course.name}</div>
        <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {university.name} · {university.state} State
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Your aggregate" value={formulaResult.aggregate.toFixed(2)} accent />
        <StatBox label="Course cut-off" value={course.cutoffMark.toString()} />
        <StatBox
          label="Difference"
          value={`${difference >= 0 ? "+" : ""}${difference.toFixed(2)}`}
          color={v.color}
        />
        <StatBox label="Formula used" value={formulaLabel} small />
      </div>

      <div className="mt-4 rounded-card border p-3.5" style={{ borderColor: "var(--border)" }}>
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
          Score breakdown
        </div>
        <div className="flex flex-col gap-1">
          {formulaResult.breakdown.map((b, i) => (
            <div key={i} className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>{b.label}</span>
              <span className="font-mono">{b.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {!verified && (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
          This university&apos;s exact formula hasn&apos;t been confirmed yet — this uses the common default. Verify with {university.name}&apos;s admissions office before relying on this result.
        </p>
      )}

      {alternatives.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--amber)" }}>
            Courses your aggregate qualifies for at {university.name}
          </div>
          <div className="flex flex-col gap-2">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="flex items-center justify-between rounded-card border p-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="text-sm font-medium">{alt.name}</div>
                <div className="text-right">
                  <div className="font-mono text-xs font-semibold" style={{ color: "var(--amber)" }}>
                    Cut-off {alt.cutoffMark}
                  </div>
                  <div className="font-mono text-[10px]" style={{ color: "var(--text-faint)" }}>
                    +{alt.difference.toFixed(2)} above
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
        This is an estimate based on published cut-off marks and formulas, not a guarantee of admission. Final admission depends on JAMB CAPS, available slots, and the university&apos;s own selection process.
      </p>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
  color,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-card border p-3.5" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
      <div
        className={small ? "text-xs font-medium leading-snug" : "text-lg font-semibold"}
        style={{ color: color ?? (accent ? "var(--amber)" : "var(--text)") }}
      >
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

