"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2, ShieldCheck, ArrowRight, FileCheck } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("1992-05-14");
  const [nationality, setNationality] = useState("United States");
  const [addressLine1, setAddressLine1] = useState("240 Market Street");
  const [city, setCity] = useState("San Francisco");
  const [postalCode, setPostalCode] = useState("94105");
  const [country, setCountry] = useState("United States");

  const [idType, setIdType] = useState<"PASSPORT" | "DRIVERS_LICENSE" | "NATIONAL_ID">("PASSPORT");
  const [idNumberLast4, setIdNumberLast4] = useState("4829");
  const [idDocumentName, setIdDocumentName] = useState("passport-demo.pdf");

  const [horizonScore, setHorizonScore] = useState(25);
  const [drawdownScore, setDrawdownScore] = useState(25);
  const [experienceScore, setExperienceScore] = useState(15);
  const [investmentGoal, setInvestmentGoal] = useState("Long-term wealth growth");
  const [annualIncomeBand, setAnnualIncomeBand] = useState("$75,000 – $150,000");

  const [agreementsAccepted, setAgreementsAccepted] = useState(false);
  const [autoApproveDemo, setAutoApproveDemo] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push("/login");
          return;
        }
        setFullName(d.user.name || "");
        setExistingStatus(d.user.kycStatus);
      });
  }, [router]);

  const riskScore = horizonScore + drawdownScore + experienceScore;

  const submitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementsAccepted) {
      setError("Please accept the risk disclosures and customer agreement.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          dateOfBirth,
          nationality,
          addressLine1,
          city,
          postalCode,
          country,
          idType,
          idNumberLast4,
          idDocumentName,
          riskScore,
          investmentGoal,
          annualIncomeBand,
          agreementsAccepted: true,
          autoApproveDemo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit onboarding.");
      } else {
        router.push(autoApproveDemo ? "/wallet" : "/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  if (existingStatus === "APPROVED") {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Onboarding Complete</h1>
          <p className="text-sm text-slate-600">
            Your identity and risk profile are approved. You have full access to trading, FX conversion, and managed portfolios.
          </p>
          <button
            type="button"
            onClick={() => router.push("/wallet")}
            className="px-6 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
          >
            Go to Wallet & Fund Account
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Verification & Risk Profile</h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete this 4-step suitability check to unlock deposits and trading.
          </p>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2">
          {["Personal", "Identity", "Risk Profile", "Review"].map((label, idx) => {
            const s = idx + 1;
            const active = step === s;
            const done = step > s;
            return (
              <div
                key={label}
                className={`rounded-xl px-3 py-2 border text-xs font-semibold text-center ${
                  active
                    ? "bg-teal-50 border-teal-600 text-teal-800"
                    : done
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                {s}. {label}
              </div>
            );
          })}
        </div>

        <form
          onSubmit={submitKyc}
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Personal & Address Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Legal Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Country of Residence</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Simulated ID Document Check</h2>
              <p className="text-xs text-slate-500">
                In a live brokerage this connects to an identity vendor. Here you can select a document type and mock file.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Document Type</label>
                  <select
                    value={idType}
                    onChange={(e) =>
                      setIdType(e.target.value as "PASSPORT" | "DRIVERS_LICENSE" | "NATIONAL_ID")
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                    <option value="NATIONAL_ID">National ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    minLength={4}
                    required
                    value={idNumberLast4}
                    onChange={(e) => setIdNumberLast4(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center space-y-2 bg-slate-50">
                <FileCheck className="w-6 h-6 text-teal-700 mx-auto" />
                <div className="text-sm font-medium text-slate-800">
                  Attached: {idDocumentName}
                </div>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setIdDocumentName(f.name);
                  }}
                  className="text-xs text-slate-500"
                />
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Investment Suitability & Risk</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Primary Goal</label>
                  <select
                    value={investmentGoal}
                    onChange={(e) => setInvestmentGoal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option>Capital preservation</option>
                    <option>Steady income & dividends</option>
                    <option>Long-term wealth growth</option>
                    <option>Active trading & high growth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Annual Income</label>
                  <select
                    value={annualIncomeBand}
                    onChange={(e) => setAnnualIncomeBand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option>Under $50,000</option>
                    <option>$50,000 – $75,000</option>
                    <option>$75,000 – $150,000</option>
                    <option>$150,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Investment Time Horizon
                </label>
                <select
                  value={horizonScore}
                  onChange={(e) => setHorizonScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value={10}>Less than 2 years</option>
                  <option value={20}>2 – 5 years</option>
                  <option value={25}>5 – 10 years</option>
                  <option value={35}>10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  If your portfolio dropped 15% in a quarter, what would you do?
                </label>
                <select
                  value={drawdownScore}
                  onChange={(e) => setDrawdownScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value={10}>Sell everything to stop losses</option>
                  <option value={20}>Wait and hold</option>
                  <option value={25}>Hold and rebalance</option>
                  <option value={35}>Buy more at lower prices</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Prior Investing Experience
                </label>
                <select
                  value={experienceScore}
                  onChange={(e) => setExperienceScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value={5}>First-time investor</option>
                  <option value={15}>Some ETFs / stocks</option>
                  <option value={25}>Experienced multi-asset trader</option>
                </select>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
                >
                  <span>Review & Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Agreements & Demo Approval</h2>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
                <div><strong>Applicant:</strong> {fullName}</div>
                <div><strong>Location:</strong> {city}, {country}</div>
                <div><strong>ID Check:</strong> {idType} ending in {idNumberLast4}</div>
                <div><strong>Calculated Risk Score:</strong> {riskScore}/100</div>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementsAccepted}
                  onChange={(e) => setAgreementsAccepted(e.target.checked)}
                  className="mt-1 accent-teal-700"
                />
                <span>
                  I acknowledge this is a simulated brokerage demo and accept the risk disclosures.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm text-teal-900 bg-teal-50 p-3 rounded-xl border border-teal-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApproveDemo}
                  onChange={(e) => setAutoApproveDemo(e.target.checked)}
                  className="mt-1 accent-teal-700"
                />
                <span>
                  <strong>Instant Demo Approval:</strong> Auto-approve KYC immediately so I can fund and trade right away (uncheck to test the Admin KYC Review Queue).
                </span>
              </label>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? "Submitting..." : "Complete Onboarding"}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppShell>
  );
}
