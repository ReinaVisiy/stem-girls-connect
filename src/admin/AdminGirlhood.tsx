import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  AdminButton,
  AdminCard,
  AdminInput,
  AdminPageHeader,
  AdminTextarea,
} from "./AdminUI";
import GirlhoodResponseCard from "../features/girlhood/components/GirlhoodResponseCard";
import type {
  GirlhoodCategory,
  GirlhoodLanguage,
  GirlhoodModerationStatus,
} from "../features/girlhood/types";
import { eligible } from "../../shared/girlhood";

interface Submission {
  id: string;
  public_reference: string;
  age: number;
  perspective: string;
  public_category: GirlhoodCategory;
  language: GirlhoodLanguage;
  display_name: string | null;
  country: string | null;
  city_region: string | null;
  public_display_name: string | null;
  public_country: string | null;
  public_city: string | null;
  girlhood_response: string;
  future_response: string | null;
  support_response: string | null;
  public_girlhood_response: string;
  public_future_response: string | null;
  public_support_response: string | null;
  consent_public: boolean;
  consent_display_name: boolean;
  consent_display_country: boolean;
  consent_display_city: boolean;
  consent_reuse: boolean;
  consent_analysis: boolean;
  moderation_status: GirlhoodModerationStatus;
  moderation_reason: string | null;
  moderation_notes: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  withdrawn_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  escalation_owner: string | null;
  escalation_resolution: string | null;
  reuse_cleanup_required: boolean;
}
const originalColumns =
  "id,public_reference,age,perspective,public_category,language,display_name,country,city_region,girlhood_response,future_response,support_response,public_girlhood_response,public_future_response,public_support_response,consent_public,consent_display_name,consent_display_country,consent_display_city,consent_reuse,consent_analysis,moderation_status,moderation_reason,moderation_notes,featured,created_at,updated_at,withdrawn_at,reviewed_by,reviewed_at,escalation_owner,escalation_resolution,reuse_cleanup_required";
const columns =
  originalColumns + ",public_display_name,public_country,public_city";
const tabs = [
  "pending",
  "approved",
  "escalated",
  "rejected",
  "withdrawn",
  "cleanup",
] as const;
type Tab = (typeof tabs)[number];
export default function AdminGirlhood() {
  const savingRef = useRef(false);
  const [feedback, setFeedback] = useState('');
  const [tab, setTab] = useState<Tab>("pending"),
    [language, setLanguage] = useState("all"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const [rows, setRows] = useState<Submission[]>([]),
    [count, setCount] = useState(0),
    [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const [notes, setNotes] = useState(""),
    [reason, setReason] = useState(""),
    [owner, setOwner] = useState(""),
    [resolution, setResolution] = useState("");
  const [text, setText] = useState({ q1: "", q2: "", q3: "" });
  const [identity, setIdentity] = useState({ name: "", country: "", city: "" });
  const [events, setEvents] = useState<
    {
      id: number;
      created_at: string;
      moderator_id: string | null;
      new_status: string;
      changes: Record<string, boolean>;
    }[]
  >([]);
  const [auditError, setAuditError] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        let query = supabase
          .from("girlhood_submissions")
          .select(columns, { count: "exact" })
          .order("created_at", { ascending: false })
          .order("id")
          .range((page - 1) * 25, page * 25 - 1);
        if (tab === "approved")
          query = query.in("moderation_status", [
            "approved",
            "approved_redacted",
          ]);
        else if (tab === "cleanup")
          query = query.eq("reuse_cleanup_required", true);
        else query = query.eq("moderation_status", tab);
        if (language !== "all") query = query.eq("language", language);
        const reference = search.trim().replace(/[^A-Za-z0-9-]/g, "");
        if (reference)
          query = query.ilike("public_reference", "%" + reference + "%");
        if (signal) query = query.abortSignal(signal);
        const { data, error, count: total } = await query;
        if (signal?.aborted) return;
        if (error) throw error;
        setRows((data ?? []) as unknown as Submission[]);
        setCount(total ?? 0);
      } catch {
        if (!signal?.aborted)
          setError("Could not load the moderation queue. Try refreshing.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [tab, language, search, page],
  );
  useEffect(() => {
    const c = new AbortController();
    void load(c.signal);
    return () => c.abort();
  }, [load]);
  useEffect(() => {
    if (!selected) return;
    setNotes(selected.moderation_notes ?? "");
    setReason(selected.moderation_reason ?? "");
    setOwner(selected.escalation_owner ?? "");
    setResolution(selected.escalation_resolution ?? "");
    setText({
      q1: selected.public_girlhood_response ?? "",
      q2: selected.public_future_response ?? "",
      q3: selected.public_support_response ?? "",
    });
    setIdentity({
      name: selected.public_display_name ?? "",
      country: selected.public_country ?? "",
      city: selected.public_city ?? "",
    });
    setEvents([]);
    setAuditError(false);
    const c = new AbortController();
    supabase
      .from("girlhood_moderation_events")
      .select("id,created_at,moderator_id,new_status,changes")
      .eq("submission_id", selected.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .abortSignal(c.signal)
      .then(({ data, error }) => {
        if (!c.signal.aborted) {
          if (error) setAuditError(true);
          else setEvents(data ?? []);
        }
      });
    return () => c.abort();
  }, [selected]);
  async function save(
    status: GirlhoodModerationStatus,
    extra: Record<string, unknown> = {},
  ) {
    if (!selected || savingRef.current) return;
    setError("");
    setFeedback('');
    if (["rejected", "escalated"].includes(status) && !reason.trim()) {
      setError("A reason is required for rejection or escalation.");
      return;
    }
    if (status === "escalated" && !owner.trim()) {
      setError("Assign a safeguarding owner before escalating.");
      return;
    }
    if (
      selected.moderation_status === "escalated" &&
      !["escalated", "withdrawn"].includes(status) &&
      !resolution.trim()
    ) {
      setError("Record how the escalation was resolved.");
      return;
    }
    if (status.startsWith("approved") && !text.q1.trim()) {
      setError("The public-safe first answer cannot be empty.");
      return;
    }
    if (['approved', 'approved_redacted', 'rejected', 'escalated'].includes(status)
      && !window.confirm(status.startsWith('approved')
        ? (selected.age >= 13 && selected.consent_public ? 'Publish this reviewed text and the public identity shown in the preview?' : 'Approve for private review only? This response cannot be published.')
        : `Confirm ${status} status for this contribution?`)) return;
    const redacted =
      text.q1.trim() !== selected.girlhood_response ||
      text.q2.trim() !== (selected.future_response ?? "") ||
      text.q3.trim() !== (selected.support_response ?? "") ||
      (selected.consent_display_name &&
        (identity.name.trim() || "Anonymous") !==
          (selected.display_name || "Anonymous")) ||
      (selected.consent_display_country &&
        identity.country.trim() !== (selected.country ?? "")) ||
      (selected.consent_display_city &&
        identity.city.trim() !== (selected.city_region ?? ""));
    const payload = {
      moderation_status: status.startsWith("approved")
        ? redacted
          ? "approved_redacted"
          : "approved"
        : status,
      moderation_reason: reason.trim() || null,
      moderation_notes: notes.trim() || null,
      escalation_owner: owner.trim() || null,
      escalation_resolution: resolution.trim() || null,
      ...(status.startsWith("approved")
        ? {
            public_girlhood_response: text.q1.trim(),
            public_future_response: text.q2.trim() || null,
            public_support_response: text.q3.trim() || null,
            public_display_name: selected.consent_display_name
              ? identity.name.trim() || null
              : null,
            public_country: selected.consent_display_country
              ? identity.country.trim() || null
              : null,
            public_city: selected.consent_display_city
              ? identity.city.trim() || null
              : null,
          }
        : {}),
      ...extra,
    };
    savingRef.current = true;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("girlhood_submissions")
        .update(payload)
        .eq("id", selected.id)
        .eq("updated_at", selected.updated_at)
        .select("id");
      if (error) throw new Error(error.message);
      if (!data?.length)
        throw new Error(
          "This record changed since you opened it. Refresh and review it again.",
        );
      setSelected(null);
      await load();
      setFeedback('Review saved. The queue has been refreshed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  const publicEligible =
    selected &&
    eligible(
      selected.age,
      selected.consent_public,
      selected.moderation_status,
      selected.withdrawn_at,
    );
  const terminal =
    selected &&
    (selected.withdrawn_at !== null ||
      selected.moderation_status === "withdrawn");
  return (
    <div className="text-brandSlate dark:text-slate-200">
      <AdminPageHeader
        title="Girlhood Campaign"
        description="Review the original answers and the exact public preview. Consent and age cannot be overridden."
      />
      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {feedback && <p role="status" className="my-4 rounded-xl bg-emerald-50 p-4 text-emerald-900">{feedback}</p>}
      <div className="flex flex-wrap gap-2">
        {tabs.map((s) => (
          <button
            key={s}
            aria-pressed={tab === s}
            onClick={() => {
              setTab(s);
              setPage(1);
              setSelected(null);
            }}
            className={
              tab === s ? "girlhood-button" : "rounded-full border px-4 py-2"
            }
          >
            {s === "cleanup" ? "Reuse removal follow-up" : s}
          </button>
        ))}
      </div>
      <div className="my-6 grid gap-4 sm:grid-cols-3">
        <label>
          Find reference
          <AdminInput
            value={search}
            maxLength={40}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setSelected(null);
            }}
            placeholder="GSH-…"
          />
        </label>
        <label>
          Language
          <select
            className="girlhood-input"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
              setSelected(null);
            }}
          >
            <option value="all">All languages</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
        <button
          className="girlhood-button self-end"
          onClick={() => {
            setSelected(null);
            void load();
          }}
        >
          Refresh queue
        </button>
      </div>
      <p role="status">
        {count} matching contributions · Page {page}
      </p>
      <div className="mt-5 grid items-start gap-6 xl:grid-cols-[.8fr_1.4fr]">
        <AdminCard>
          {loading ? (
            <p>Loading…</p>
          ) : rows.length === 0 ? (
            <p>No matching submissions.</p>
          ) : (
            rows.map((r) => (
              <button
                key={r.id}
                className="block w-full border-b py-4 text-left"
                aria-pressed={selected?.id === r.id}
                disabled={saving} onClick={() => setSelected(r)}
              >
                <strong>{r.public_reference}</strong>
                <p className="mt-2 line-clamp-2">{r.girlhood_response}</p>
                <p className="mt-2 text-sm">
                  Age {r.age} · {r.language.toUpperCase()} ·{" "}
                  {r.moderation_status}
                </p>
              </button>
            ))
          )}
          <div className="mt-6 flex justify-between gap-2">
            <AdminButton
              disabled={loading || page === 1}
              onClick={() => {
                setPage((p) => p - 1);
                setSelected(null);
              }}
            >
              Previous
            </AdminButton>
            <AdminButton
              disabled={loading || page * 25 >= count}
              onClick={() => {
                setPage((p) => p + 1);
                setSelected(null);
              }}
            >
              Next
            </AdminButton>
          </div>
        </AdminCard>
        {selected ? (
          <AdminCard>
            <h2 className="text-xl font-black">{selected.public_reference}</h2>
            <p className="my-3 font-bold">
              {terminal
                ? "WITHDRAWN — cannot be republished"
                : selected.age < 13
                  ? "PRIVATE — under 13"
                  : !selected.consent_public
                    ? "PRIVATE — publication not permitted"
                    : publicEligible
                      ? "PUBLIC"
                      : "Awaiting moderation"}
            </p>
            <p>
              Age {selected.age} · {selected.public_category} ·{" "}
              {selected.language} · {selected.display_name || "Anonymous"}
            </p>
            <p>
              {[selected.city_region, selected.country]
                .filter(Boolean)
                .join(", ") || "No location"}
            </p>
            <p className="mt-3">
              Website: {selected.consent_public ? "Yes" : "No"} · Name:{" "}
              {selected.consent_display_name ? "Yes" : "No"} · Country:{" "}
              {selected.consent_display_country ? "Yes" : "No"} · City:{" "}
              {selected.consent_display_city ? "Yes" : "No"} · Reuse:{" "}
              {selected.consent_reuse ? "Yes" : "No"} · Analysis:{" "}
              {selected.consent_analysis ? "Yes" : "No"}
            </p>
            <h3 className="mt-6 font-bold">Original answers</h3>
            {[
              selected.girlhood_response,
              selected.future_response,
              selected.support_response,
            ]
              .filter(Boolean)
              .map((q, i) => (
                <p
                  key={i}
                  lang={selected.language}
                  className="mt-3 whitespace-pre-wrap break-words"
                >
                  {q}
                </p>
              ))}
            {!terminal && (
              <div className="mt-6 space-y-4">
                <h3 className="font-bold">Public-safe answers</h3>
                {(["q1", "q2", "q3"] as const).map((key, i) => (
                  <label key={key} className="block">
                    Answer {i + 1}
                    <AdminTextarea
                      maxLength={2000}
                      rows={3}
                      value={text[key]}
                      onChange={(e) =>
                        setText({ ...text, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                {selected.age >= 13 && selected.consent_public && (
                  <>
                    <h3 className="font-bold">Public name and location</h3>
                    <p className="text-sm">
                      Original details above stay private. Leave these fields
                      blank to keep the public voice anonymous. Use only a safe
                      nickname or broad location, and only where the participant
                      allowed it.
                    </p>
                    {(
                      [
                        [
                          "name",
                          "Public nickname",
                          selected.consent_display_name,
                          80,
                        ],
                        [
                          "country",
                          "Public country",
                          selected.consent_display_country,
                          100,
                        ],
                        [
                          "city",
                          "Public city / region",
                          selected.consent_display_city,
                          100,
                        ],
                      ] as const
                    ).map(([key, label, permitted, limit]) => (
                      <label className="block" key={key}>
                        {label}
                        {!permitted && " — not permitted"}
                        <AdminInput
                          disabled={!permitted}
                          maxLength={limit}
                          value={identity[key]}
                          onChange={(e) =>
                            setIdentity({ ...identity, [key]: e.target.value })
                          }
                          placeholder={key === "name" ? "Anonymous" : "Hidden"}
                        />
                      </label>
                    ))}
                    <AdminButton
                      variant="ghost"
                      onClick={() =>
                        setIdentity({ name: "", country: "", city: "" })
                      }
                    >
                      Hide all public identity
                    </AdminButton>
                    <h3 className="font-bold">Public preview</h3>
                    <GirlhoodResponseCard
                      response={{
                        ...selected,
                        public_girlhood_response: text.q1,
                        public_future_response: text.q2 || null,
                        public_support_response: text.q3 || null,
                        safe_display_name: selected.consent_display_name
                          ? identity.name.trim() || "Anonymous"
                          : "Anonymous",
                        safe_country: selected.consent_display_country
                          ? identity.country.trim() || null
                          : null,
                        safe_city: selected.consent_display_city
                          ? identity.city.trim() || null
                          : null,
                      }}
                    />
                  </>
                )}
              </div>
            )}
            <div className="mt-6 space-y-4">
              <label className="block">
                Reason (required for rejection / escalation)
                <AdminTextarea
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <label className="block">
                Private notes
                <AdminTextarea
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <label className="block">
                Assigned safeguarding owner
                <AdminInput
                  maxLength={120}
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </label>
              <label className="block">
                Escalation resolution / removal follow-up
                <AdminTextarea
                  maxLength={2000}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {!terminal && (
                <>
                  <AdminButton
                    disabled={saving}
                    onClick={() => save("approved")}
                  >
                    Approve reviewed text
                    {selected.age < 13 || !selected.consent_public
                      ? " (private)"
                      : ""}
                  </AdminButton>
                  <AdminButton
                    disabled={saving}
                    variant="danger"
                    onClick={() => save("rejected")}
                  >
                    Reject
                  </AdminButton>
                  <AdminButton
                    disabled={saving}
                    variant="ghost"
                    onClick={() => save("escalated")}
                  >
                    Escalate
                  </AdminButton>
                  {publicEligible && (
                    <AdminButton
                      disabled={saving}
                      variant="ghost"
                      onClick={() =>
                        save(selected.moderation_status, {
                          featured: !selected.featured,
                        })
                      }
                    >
                      {selected.featured ? "Unfeature" : "Feature"}
                    </AdminButton>
                  )}
                  <AdminButton
                    disabled={saving}
                    variant="danger"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Permanently withdraw this contribution? It cannot be republished.",
                        )
                      )
                        void save("withdrawn");
                    }}
                  >
                    Withdraw
                  </AdminButton>
                </>
              )}
              {terminal && (
                <AdminButton
                  disabled={saving || !resolution.trim()}
                  onClick={() =>
                    save("withdrawn", { reuse_cleanup_required: false })
                  }
                >
                  Save removal follow-up
                </AdminButton>
              )}
            </div>
            <h3 className="mt-8 font-bold">Recent audit events (up to 50)</h3>
            {auditError ? (
              <p role="alert">Could not load audit history.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs">
                {events.map((e) => (
                  <li key={e.id}>
                    {new Date(e.created_at).toLocaleString()} · {e.new_status} ·{" "}
                    {e.moderator_id || "Participant / system"} ·{" "}
                    {Object.keys(e.changes).join(", ")}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs">
              Last reviewer: {selected.reviewed_by || "—"} ·{" "}
              {selected.reviewed_at
                ? new Date(selected.reviewed_at).toLocaleString()
                : "—"}
            </p>
          </AdminCard>
        ) : (
          <AdminCard>Select a contribution to review.</AdminCard>
        )}
      </div>
    </div>
  );
}

