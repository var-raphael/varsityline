import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CalculatorPanel } from "@/components/CalculatorPanel";
import { University, FlatCourse } from "@/types/university";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CalculatorPage() {
  const { data: universitiesData, error: uniError } = await supabase
    .from("universities")
    .select("*");

  const { data: coursesData, error: courseError } = await supabase
    .from("courses")
    .select("*, universities(id, slug, name, state, type)");

  if (uniError || courseError) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Couldn&apos;t load universities right now. Please try again shortly.
        </p>
      </main>
    );
  }

  const universities: University[] = (universitiesData ?? []).map((u) => ({
    id: u.id,
    slug: u.slug,
    name: u.name,
    state: u.state,
    type: u.type,
    jambCutoff: u.jamb_cutoff,
    admissionStatus: u.admission_status,
    lastVerifiedAt: u.last_verified_at,
    topCourses: [],
  }));

  const allCourses: FlatCourse[] = (coursesData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    faculty: c.faculty,
    cutoffMark: c.cutoff_mark,
    subjectCombo: c.subject_combo,
    sourceUrl: c.source_url,
    deEligible: c.de_eligible,
    deCutoffMark: c.de_cutoff_mark,
    universityId: c.universities.id,
    universitySlug: c.universities.slug,
    universityName: c.universities.name,
    universityState: c.universities.state,
    universityType: c.universities.type,
  }));

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="border-b" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            varsity<span style={{ color: "var(--amber)" }}>line</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pt-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs"
          style={{ color: "var(--text-faint)" }}
        >
          <ArrowLeft size={13} /> Back home
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-6 pt-6">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Aggregate score calculator
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--text-muted)" }}>
          Enter your JAMB and Post-UTME scores to see your aggregate for any course, how it compares to the cut-off, and what your realistic alternatives are.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-16">
        <CalculatorPanel universities={universities} allCourses={allCourses} />
      </div>
    </main>
  );
}
