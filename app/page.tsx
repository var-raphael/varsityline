import { supabase } from "@/lib/supabase";
import { SearchPanel } from "@/components/SearchPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { University, FlatCourse } from "@/types/university";

export default async function HomePage() {
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

  // Map snake_case DB fields to the camelCase shape the rest of the app expects
  const universities: University[] = (universitiesData ?? []).map((u) => ({
    id: u.id,
    slug: u.slug,
    name: u.name,
    state: u.state,
    type: u.type,
    jambCutoff: u.jamb_cutoff,
    admissionStatus: u.admission_status,
    lastVerifiedAt: u.last_verified_at,
    topCourses: [], // no longer needed on detail page; listing card no longer shows pills
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
          <div className="font-display text-lg font-semibold tracking-tight">
            varsity<span style={{ color: "var(--amber)" }}>line</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-6 pt-10">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Everything your admission depends on, in one place.
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--text-muted)" }}>
          Cut-off marks, courses, screening dates, requirements. Checked against the university&apos;s own admissions office, with the date it was last confirmed shown on the page.
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16">
        <SearchPanel universities={universities} allCourses={allCourses} />
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-10">
        <div
          className="rounded-card border py-5 text-center font-mono text-[11px] tracking-wide"
          style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
        >
          Advertisement
        </div>
      </div>
    </main>
  );
}