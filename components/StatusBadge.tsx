import { AdmissionStatus } from "@/types/university";

const STATUS_COPY: Record<AdmissionStatus, string> = {
  open: "Admission open",
  upcoming: "Opening soon",
  closed: "Admission closed",
};

export function StatusBadge({ status }: { status: AdmissionStatus }) {
  const isOpen = status === "open";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wide whitespace-nowrap"
      style={{
        borderColor: isOpen ? "var(--amber)" : "var(--border)",
        color: isOpen ? "var(--amber)" : "var(--text-faint)",
        background: isOpen ? "var(--amber-dim)" : "transparent",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: isOpen ? "var(--amber)" : "var(--text-faint)" }}
      />
      {STATUS_COPY[status]}
    </span>
  );
}