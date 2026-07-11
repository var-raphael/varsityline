"use client";

import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";

export function SearchAccessGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("vl_search_access");
    if (stored) {
      const { email: storedEmail, expiresAt } = JSON.parse(stored);
      if (new Date(expiresAt) > new Date()) {
        setUnlocked(true);
        setEmail(storedEmail);
      } else {
        localStorage.removeItem("vl_search_access");
      }
    }
    setCheckedStorage(true);
  }, []);

  async function handleCheckEmail() {
    setIsProcessing(true);
    setError("");
    const res = await fetch("/api/check-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setIsProcessing(false);

    if (data.unlocked) {
      localStorage.setItem("vl_search_access", JSON.stringify({ email, expiresAt: data.expiresAt }));
      setUnlocked(true);
    } else {
      setError("No active access found for this email.");
    }
  }

function waitForPaystack(timeoutMs = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const existing = (window as any).PaystackPop;
    if (typeof existing === "function") {
      resolve(existing);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      const PaystackPop = (window as any).PaystackPop;
      if (typeof PaystackPop === "function") {
        clearInterval(interval);
        resolve(PaystackPop);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("Paystack failed to load"));
      }
    }, 100);
  });
}

  async function handlePay() {
  setIsProcessing(true);
  setError("");

  let PaystackPop: any;
  try {
    PaystackPop = await waitForPaystack();
  } catch {
    setIsProcessing(false);
    setError("Payment system is still loading. Please try again in a moment.");
    return;
  }

  const initRes = await fetch("/api/initialize-search-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const initData = await initRes.json();

  if (!initData.success) {
    setIsProcessing(false);
    setError("Could not start payment. Try again.");
    return;
  }

  const popup = new PaystackPop();

  popup.resumeTransaction(initData.accessCode, {
    onSuccess: async () => {
      const verifyRes = await fetch("/api/verify-search-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: initData.reference }),
      });
      const verifyData = await verifyRes.json();
      setIsProcessing(false);

      if (verifyData.success) {
        localStorage.setItem(
          "vl_search_access",
          JSON.stringify({ email: verifyData.email, expiresAt: verifyData.expiresAt })
        );
        setUnlocked(true);
      } else {
        setError("Payment could not be confirmed.");
      }
    },
    onCancel: () => setIsProcessing(false),
    onError: () => {
      setIsProcessing(false);
      setError("Payment failed. Try again.");
    },
  });
}

  function handleLogout() {
    localStorage.removeItem("vl_search_access");
    setUnlocked(false);
    setEmail("");
  }

  if (!checkedStorage) return null;

  if (unlocked) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between font-mono text-[11px]" style={{ color: "var(--text-faint)" }}>
          <span>Unlocked as {email}</span>
          <button onClick={handleLogout} className="underline underline-offset-2">
            Not you?
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className="rounded-card border p-5"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Lock size={16} style={{ color: "var(--amber)" }} />
        <span className="text-sm font-semibold">Search across every university</span>
      </div>
      <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
        Find every course you qualify for, in any state, sorted by cut-off. One payment covers the full admission season.
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mb-2 w-full rounded-card border px-3.5 py-2.5 text-sm outline-none"
        style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
      />

      {error && <p className="mb-2 text-xs" style={{ color: "var(--amber)" }}>{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleCheckEmail}
          disabled={!email || isProcessing}
          className="flex-1 rounded-lg border py-2.5 text-sm disabled:opacity-40"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          {isProcessing && <Loader2 size={14} className="mr-1 inline animate-spin" />}
          Already paid? Check
        </button>
        <button
          onClick={handlePay}
          disabled={!email || isProcessing}
          className="flex-1 rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40"
          style={{ background: "var(--amber)", color: "#17150F" }}
        >
          Unlock — ₦500
        </button>
      </div>
    </div>
  );
}