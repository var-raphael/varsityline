import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { University } from "@/types/university";
import { StatusBadge } from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";

export function UniversityCard({ uni }: { uni: University }) {
  const isClosed = uni.admissionStatus === "closed";

  return (
    <Link
      href={`/${uni.slug}`}
      className="group flex flex-col justify-between rounded-card border p-5 transition-colors hover:border-[var(--amber)]"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        opacity: isClosed ? 0.55 : 1,
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight">
            {uni.name}
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {uni.state} State · {uni.type}
          </p>
        </div>
        <StatusBadge status={uni.admissionStatus} />
      </div>

      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <div className="font-mono text-xs" style={{ color: "var(--text-faint)" }}>
          Cut-off <span className="font-semibold" style={{ color: "var(--amber)" }}>{uni.jambCutoff}</span>
          <span className="mx-2">·</span>
          Verified {formatDistanceToNow(new Date(uni.lastVerifiedAt), { addSuffix: true })}
        </div>
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--amber)" }}
        />
      </div>
    </Link>
  );
}