import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageCircle, Users, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";

const LINK_ICONS = {
  official_site: Globe,
  whatsapp: MessageCircle,
  facebook: Users,
};

export default async function UniversityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: uni, error } = await supabase
    .from("universities")
    .select("*, courses(*), links(*)")
    .eq("slug", slug)
    .single();

  if (error || !uni) return notFound();

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="mx-auto max-w-3xl px-5 pt-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs"
          style={{ color: "var(--text-faint)" }}
        >
          <ArrowLeft size={13} /> All universities
        </Link>
      </div>

      <div className="mx-auto max-w-3xl border-b px-5 pb-8 pt-5" style={{ borderColor: "var(--border)" }}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {uni.name}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {uni.state} State · {uni.type} University
            </p>
          </div>
          <StatusBadge status={uni.admission_status} />
        </div>

        <div className="font-mono text-xs" style={{ color: "var(--text-faint)" }}>
          {uni.last_verified_at
            ? `Last confirmed ${formatDistanceToNow(new Date(uni.last_verified_at), { addSuffix: true })}`
            : "Not yet verified"}
          {" · "}Sources: JAMB CAPS, {uni.name} Admissions Office
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8">

        <Section label="Key dates">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateCard label="Post-UTME screening" value={uni.post_utme_date ?? "Not yet announced"} />
            <DateCard label="Admission list release" value={uni.admission_list_date ?? "Not yet announced"} />
            <DateCard label="O'Level upload deadline" value={uni.o_level_deadline ?? "Not yet announced"} />
            <DateCard label="JAMB cut-off" value={String(uni.jamb_cutoff)} accent />
          </div>
        </Section>

        <Section label="Requirements">
          <div className="rounded-card border" style={{ borderColor: "var(--border)" }}>
            <ReqRow label="UTME subjects" value={uni.utme_subjects ?? "—"} />
            <ReqRow label="O'Level (WAEC/NECO)" value={uni.o_level_requirement ?? "—"} />
            <ReqRow label="Direct Entry" value={uni.direct_entry_requirement ?? "—"} last />
          </div>
        </Section>

        <Section label="Fees">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateCard label="Acceptance fee" value={uni.acceptance_fee ?? "—"} accent />
            <DateCard label="Tuition range" value={uni.tuition_range ?? "—"} />
          </div>
        </Section>

        <Section label="Courses & cut-off marks">
          <div className="overflow-x-auto rounded-card border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <Th>Course</Th>
                  <Th className="hidden md:table-cell">Faculty</Th>
                  <Th>UTME</Th>
                  <Th className="hidden sm:table-cell">DE</Th>
                  <Th>O&apos;Level combo</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {(uni.courses ?? []).map((course: any, i: number) => (
                  <tr
                    key={course.id}
                    className={i !== uni.courses.length - 1 ? "border-b" : ""}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-3.5 py-3 font-medium">{course.name}</td>
                    <td className="hidden px-3.5 py-3 md:table-cell" style={{ color: "var(--text-muted)" }}>
                      {course.faculty}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-semibold" style={{ color: "var(--amber)" }}>
                      {course.cutoff_mark}
                    </td>
                    <td className="hidden px-3.5 py-3 font-mono sm:table-cell" style={{ color: "var(--text-muted)" }}>
                      {course.de_eligible ? course.de_cutoff_mark : "—"}
                    </td>
                    <td className="px-3.5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {course.subject_combo}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <a
                        href={course.source_url ?? "#"}
                        className="font-mono text-xs whitespace-nowrap"
                        style={{ color: "var(--text-faint)" }}
                      >
                        Source ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
            Meeting the cut-off does not guarantee admission. Post-UTME score and O&apos;Level grades are also weighted.
          </p>
        </Section>

        <Section label="What to know this cycle">
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {(uni.article_markdown ?? "").split("\n\n").filter(Boolean).map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Section>

        <div
          className="mb-8 flex items-center gap-3 rounded-card border border-dashed p-4 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
        >
          <span
            className="rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide"
            style={{ background: "var(--border)", color: "var(--text-muted)" }}
          >
            Partner
          </span>
          <span>Struggling with Post-UTME prep? Verified past questions and mock tests.</span>
        </div>

        <Section label="Community & official links">
          <div className="flex flex-col gap-2">
            {(uni.links ?? []).map((link: any) => {
              const Icon = LINK_ICONS[link.type as keyof typeof LINK_ICONS];
              return (
                <a
                  key={link.type}
                  href={link.url}
                  className="flex items-center justify-between rounded-card border p-3.5 text-sm transition-colors hover:border-[var(--amber)]"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={15} style={{ color: "var(--text-faint)" }} />
                    {link.label}
                  </span>
                  <ExternalLink size={14} style={{ color: "var(--amber)" }} />
                </a>
              );
            })}
          </div>
        </Section>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-10">
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--amber)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function DateCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-card border p-3.5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
      <div className="text-sm font-semibold" style={{ color: accent ? "var(--amber)" : "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}

function ReqRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 p-3.5 sm:flex-row sm:items-center sm:gap-4 ${!last ? "border-b" : ""}`}
      style={{ borderColor: "var(--border)" }}
    >
      <div className="w-40 shrink-0 text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3.5 py-2.5 text-left font-mono text-[10px] uppercase tracking-wide ${className}`}
      style={{ color: "var(--text-faint)" }}
    >
      {children}
    </th>
  );
}