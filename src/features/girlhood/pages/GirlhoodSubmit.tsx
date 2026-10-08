import { useGirlhoodRuntime } from '../GirlhoodRuntime';
import { AvailabilityNotice, availabilityCopy, useCampaignAvailability } from '../components/CampaignAvailability';
import { useGirlhoodBasePath } from '../GirlhoodPaths';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "../GirlhoodRuntime";
import Seo from "../../../components/Seo";
import {
  Check,
  Download,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { experience } from "../config/experience";
import GirlhoodResponseCard from "../components/GirlhoodResponseCard";
import { copy } from "../config/copy";
import { ui } from "../config/ui";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
import type { GirlhoodSubmissionInput, GirlhoodPublicResponse } from "../types";
import {
  validateGirlhoodSubmission,
  derivePublicCategory,
  normalizePlainText,
} from "../validation";

const empty: GirlhoodSubmissionInput = {
  age: "",
  perspective: "own",
  language: "en",
  displayName: "",
  country: "",
  cityRegion: "",
  girlhoodResponse: "",
  futureResponse: "",
  supportResponse: "",
  consentPublic: false,
  consentDisplayName: false,
  consentDisplayCountry: false,
  consentDisplayCity: false,
  consentReuse: false,
  consentAnalysis: false,
  acknowledgementReview: false,
  acknowledgementPrivacy: false,
  website: "",
};
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold">{label}</span>
      {children}
    </label>
  );
}
function Choice({
  label,
  checked,
  onChange,
  required = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-2xl border p-4">
      <input
        type="checkbox"
        className="mt-1 size-5 shrink-0 accent-[#82246d]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-required={required}
      />
      <span>{label}</span>
    </label>
  );
}
export default function GirlhoodSubmit() {
  const { request, preview: isPreview } = useGirlhoodRuntime();
  const basePath = useGirlhoodBasePath();
  const availability = useCampaignAvailability();
  const { language } = useGirlhoodLanguage();
  const t = copy[language],
    l = ui[language];
  const x = experience[language];
  const requestToken = useRef<string | null>(null);
  const [pendingReceipt, setPendingReceipt] = useState(false);
  const [form, setForm] = useState<GirlhoodSubmissionInput>(empty);
  const [step, setStep] = useState(0),
    [examples, setExamples] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
      publicReference: string;
      withdrawalCode: string;
      publicationRequested?: boolean;
      withdrawn?: boolean;
    } | null>(null),
    [feedback, setFeedback] = useState("");
  const heading = useRef<HTMLHeadingElement>(null),
    alert = useRef<HTMLDivElement>(null),
    busy = useRef(false);
  useEffect(() => {
    heading.current?.focus();
  }, [step, success]);
  useEffect(() => {
    if (error) alert.current?.focus();
  }, [error]);
  // Remove drafts left by v1; answers and consent are never persisted in this version.
  useEffect(() => {
    if (isPreview) return;
    try {
      sessionStorage.removeItem("sgc-girlhood-draft");
      const savedToken = sessionStorage.getItem("sgc-girlhood-receipt");
      if (savedToken && /^[a-f0-9]{64}$/.test(savedToken)) {
        requestToken.current = savedToken;
        setPendingReceipt(true);
      }
    } catch {
      /* Storage disabled. */
    }
  }, [request]);
  const under13 = typeof form.age === "number" && form.age < 13;
  const update = <K extends keyof GirlhoodSubmissionInput>(
    key: K,
    value: GirlhoodSubmissionInput[K],
  ) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "age" && typeof value === "number" && value < 13)
        Object.assign(next, {
          displayName: "",
          country: "",
          cityRegion: "",
          consentPublic: false,
          consentDisplayName: false,
          consentDisplayCountry: false,
          consentDisplayCity: false,
          consentReuse: false,
        });
      if (key === "consentPublic" && value === false)
        Object.assign(next, {
          consentDisplayName: false,
          consentDisplayCountry: false,
          consentDisplayCity: false,
        });
      return next;
    });
    setError("");
  };
  function errorFor(code: string) {
    return code === "age"
      ? l.ageRequired
      : code === "answers"
        ? l.answerError
        : code === "acknowledgements"
          ? l.acknowledgeError
          : l.choiceError;
  }
  const input = { ...form, language };
  const errors = validateGirlhoodSubmission(input);
  function tokenForAttempt() {
    if (!requestToken.current) {
      requestToken.current = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
    }
    try {
      sessionStorage.setItem("sgc-girlhood-receipt", requestToken.current);
    } catch {
      /* Memory-only recovery still works. */
    }
    setPendingReceipt(true);
    return requestToken.current;
  }
  async function recoverReceipt() {
    if (isPreview) return;
    if (busy.current || !requestToken.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await request("/api/girlhood/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestToken: requestToken.current,
          recoverOnly: true,
          language,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || x.retryHelp);
      if (
        typeof data.publicReference !== "string" ||
        typeof data.withdrawalCode !== "string"
      )
        throw new Error(x.retryHelp);
      setSuccess(data);
      setForm(empty);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "Error"
          ? err.message
          : x.retryHelp,
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  function downloadReceipt() {
    if (!success) return;
    const text = [
      x.receipt,
      "Girlhood Should Be Hers",
      "",
      l.reference + ": " + success.publicReference,
      l.code + ": " + success.withdrawalCode,
      "",
      x.receiptHelp,
      "",
      window.location.origin + (basePath + '/withdraw'),
      "info@stemgirlsconnect.org",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = success.publicReference + "-private-receipt.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback(x.downloaded);
  }
  function clearReceipt() {
    if (isPreview) return;
    if (!window.confirm(x.savedReminder)) return;
    try {
      sessionStorage.removeItem("sgc-girlhood-receipt");
    } catch {
      /* Storage unavailable. */
    }
    requestToken.current = null;
    setPendingReceipt(false);
    setSuccess(null);
    setForm(empty);
    setStep(0);
    setFeedback("");
    setError("");
  }
  function next() {
    setError("");
    const blocking =
      step === 0
        ? errors.find((e) => ["age", "perspective", "identity"].includes(e))
        : step === 1
          ? errors.find((e) => e === "answers")
          : errors[0];
    if (blocking) {
      setError(errorFor(blocking));
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) {
      next();
      return;
    }
    if (busy.current || isPreview) return;
    if (errors.length) {
      setError(errorFor(errors[0]));
      return;
    }
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      if (await availability.refresh() !== "open") return;
      const response = await request("/api/girlhood/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, requestToken: tokenForAttempt() }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (data.code === "CAMPAIGN_CLOSED") {
        availability.close(data.state === "not_yet_open" ? "not_yet_open" : "closed");
        setError(availabilityCopy[language].closed); return;
      }
      if (!response.ok) throw new Error(data.error || l.sendError);
      if (
        typeof data.publicReference !== "string" ||
        typeof data.withdrawalCode !== "string"
      )
        throw new Error(l.sendError);
      setSuccess(data);
      setForm(empty);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "Error"
          ? err.message
          : x.retryHelp,
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(l.copied);
    } catch {
      setFeedback(l.copyFailed);
    }
  }
  const preview: GirlhoodPublicResponse = {
    public_reference: "preview",
    public_category: derivePublicCategory(Number(form.age), form.perspective),
    language,
    public_girlhood_response: normalizePlainText(form.girlhoodResponse),
    public_future_response: normalizePlainText(form.futureResponse) || null,
    public_support_response: normalizePlainText(form.supportResponse) || null,
    safe_display_name: form.consentDisplayName
      ? normalizePlainText(form.displayName) || "Anonymous"
      : "Anonymous",
    safe_country: form.consentDisplayCountry
      ? normalizePlainText(form.country)
      : null,
    safe_city: form.consentDisplayCity
      ? normalizePlainText(form.cityRegion)
      : null,
    featured: false,
    created_at: "",
  };
  const choices = [
    ["consentPublic", l.publish],
    ["consentDisplayName", l.showName],
    ["consentDisplayCountry", l.showCountry],
    ["consentDisplayCity", l.showCity],
    ["consentReuse", l.reuse],
    ["consentAnalysis", l.analysis],
  ] as const;
  return (
    <section className="girlhood-form-page mx-auto max-w-3xl px-5 py-12">
      <Seo
        title={
          (success ? l.received : t.addVoice) + " | Girlhood Should Be Hers"
        }
        description={t.intro}
        path={basePath + '/share-your-voice'}
      />
      <h1 ref={heading} tabIndex={-1} className="text-4xl font-black">
        {success ? l.received : t.addVoice}
      </h1>
      {!success && <><p className="mt-4 text-lg">{x.invitation}</p><AvailabilityNotice /></>}
      {!success && pendingReceipt && (
        <aside className="girlhood-recovery mt-6" aria-label={x.recoveryTitle}>
          <ShieldCheck size={24} aria-hidden="true" />
          <div>
            <h2 className="font-bold">{x.recoveryTitle}</h2>
            <p className="mt-2 text-sm">{x.recoveryHelp}</p>
            <button
              type="button"
              disabled={loading}
              onClick={recoverReceipt}
              className="girlhood-button mt-4"
            >
              {loading ? l.sending : x.recover}
            </button>
          </div>
        </aside>
      )}
      {success ? (
        <div className="girlhood-receipt mt-8 rounded-3xl bg-white p-6 sm:p-10">
          <div className="girlhood-success-mark">
            <Check size={36} aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-3xl font-black">
            {success.withdrawn ? x.withdrawn : x.saved}
          </h2>
          <p className="mt-3">{x.savedHelp}</p>
          <p className="mt-4">
            {!success.withdrawn &&
              (success.publicationRequested ? l.pending : l.privateReceipt)}
          </p>
          <div className="mt-6 space-y-4">
            {[
              [l.reference, success.publicReference],
              [l.code, success.withdrawalCode],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#fff9f4] p-4">
                <p className="font-bold">{label}</p>
                <code className="mt-2 block select-all break-all">{value}</code>
                <button
                  type="button"
                  onClick={() => copyText(value)}
                  className="mt-3 rounded-full border px-4 py-2"
                  aria-label={l.copy + " " + label}
                >
                  {l.copy}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-5 font-bold">{x.receiptHelp}</p>
          <button
            type="button"
            className="girlhood-button mt-5 inline-flex items-center gap-2"
            onClick={downloadReceipt}
          >
            <Download size={18} aria-hidden="true" />
            {x.download}
          </button>
          <p role="status" className="mt-3">
            {feedback}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link className="girlhood-button" to={basePath + '/wall'}>
              {t.wall}
            </Link>
            <Link className="girlhood-button" to={basePath + '/withdraw'}>
              {l.withdraw}
            </Link>
            <button
              onClick={() => copyText(window.location.origin + (basePath + ''))}
              className="girlhood-button"
            >
              {l.shareLink}
            </button>
          </div>
          <div className="mt-8 border-t pt-6">
            <button
              type="button"
              className="font-bold underline"
              onClick={clearReceipt}
            >
              {x.done}
            </button>
            <p className="mt-2 text-sm">{x.doneHelp}</p>
          </div>
        </div>
      ) : availability.state !== "open" && form.age === "" && !form.girlhoodResponse ? (
        <div className="mt-6">{error && <p role="alert">{error}</p>}<Link to={basePath + "/withdraw"} className="underline">{l.withdraw}</Link></div>
      ) : (
        <>
          <div className="mt-8 flex items-center justify-between gap-3 text-sm font-bold">
            <span aria-live="polite">
              {x.step} {step + 1} {x.of} 4
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} aria-hidden="true" />
              {x.trust}
            </span>
          </div>
          <div
            className="girlhood-progress mt-3"
            role="progressbar"
            aria-label={
              language === "fr" ? "Progression du formulaire" : "Form progress"
            }
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={step + 1}
          >
            <span style={{ width: `${(step + 1) * 25}%` }} />
          </div>
          <ol
            className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
            aria-label={
              language === "fr" ? "Étapes du formulaire" : "Form steps"
            }
          >
            {l.steps.map((name, i) => (
              <li
                key={name}
                aria-current={step === i ? "step" : undefined}
                className={
                  step === i
                    ? "border-b-4 border-brandPink pb-3 font-black"
                    : "border-b-4 border-gray-200 pb-3"
                }
              >
                {i < step ? (
                  <Check size={16} className="inline" aria-hidden="true" />
                ) : (
                  i + 1
                )}
                . {name}
              </li>
            ))}
          </ol>
          <form
            onSubmit={submit}
            noValidate
            className="girlhood-form-card rounded-3xl bg-white p-6 sm:p-10"
          >
            <h2 className="text-2xl font-bold">{l.steps[step]}</h2>
            <p className="mt-3 mb-6">{x.stepHelp[step]}</p>
            {error && (
              <div
                ref={alert}
                tabIndex={-1}
                role="alert"
                className="mt-4 rounded-xl bg-red-50 p-4 text-red-800"
              >
                {error}
              </div>
            )}
            {step === 0 && (
              <div className="mt-6 space-y-6">
                <Field label={l.age}>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    step={1}
                    required
                    value={form.age}
                    onChange={(e) =>
                      update(
                        "age",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    aria-describedby="age-help"
                    className="girlhood-input"
                  />
                </Field>
                <p id="age-help">{l.ageHelp}</p>
                <fieldset>
                  <legend className="mb-3 font-bold">{l.perspective}</legend>
                  <div className="space-y-3">
                    {(
                      [
                        ["own", l.own],
                        ["ally", l.ally],
                      ] as const
                    ).map(([v, label]) => (
                      <label key={v} className="flex gap-3">
                        <input
                          type="radio"
                          name="perspective"
                          value={v}
                          checked={form.perspective === v}
                          onChange={() => update("perspective", v)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {!under13 && (
                  <>
                    <Field label={l.known + " · " + t.optional}>
                      <input
                        value={form.displayName}
                        maxLength={80}
                        onChange={(e) => update("displayName", e.target.value)}
                        placeholder={l.anonymous}
                        className="girlhood-input"
                        aria-describedby="name-help"
                      />
                    </Field>
                    <p id="name-help">{l.knownHelp}</p>
                  </>
                )}
                {!under13 && <Field label={l.country + " · " + t.optional}>
                  <input
                    value={form.country}
                    maxLength={100}
                    onChange={(e) => update("country", e.target.value)}
                    className="girlhood-input"
                  />
                </Field>}
                {!under13 && (
                  <Field label={l.city + " · " + t.optional}>
                    <input
                      value={form.cityRegion}
                      maxLength={100}
                      onChange={(e) => update("cityRegion", e.target.value)}
                      className="girlhood-input"
                    />
                  </Field>
                )}
              </div>
            )}
            {step === 1 && (
              <div className="mt-6 space-y-6">
                {(
                  [
                    ["girlhoodResponse", t.q1, t.q1Help, true],
                    ["futureResponse", t.q2, t.q2Help, false],
                    ["supportResponse", t.q3, t.q3Help, false],
                  ] as const
                ).map(([key, title, help, required]) => (
                  <div key={key}>
                    <Field
                      label={
                        title + " · " + (required ? t.required : t.optional)
                      }
                    >
                      <textarea
                        required={required}
                        rows={4}
                        maxLength={500}
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                        className="girlhood-input"
                        aria-describedby={key + "-help"}
                      />
                    </Field>
                    <p id={key + "-help"} className="mt-2 text-sm">
                      {help} ({form[key].length}/500)
                    </p>
                  </div>
                ))}
                <p className="text-sm">{l.privacyReminder}</p>
                <button
                  type="button"
                  aria-expanded={examples}
                  aria-controls="inspiration"
                  onClick={() => setExamples((v) => !v)}
                  className="font-bold text-brandPink"
                >
                  {l.inspiration}
                </button>
                {examples && (
                  <p id="inspiration" className="rounded-xl bg-[#e3f4ec] p-4">
                    {l.examples}
                  </p>
                )}
              </div>
            )}
            {step === 2 && (
              <div className="mt-6 space-y-4">
                <p>{l.privacyIntro}</p>
                <Link
                  to={basePath + '/privacy'}
                  target="_blank"
                  rel="noopener"
                  className="underline"
                >
                  {l.privacy}
                </Link>
                {under13 ? (
                  <p className="rounded-xl bg-[#f9eaf3] p-4 font-bold">
                    {l.under13}
                  </p>
                ) : (
                  <>
                    <Choice
                      label={l.publish}
                      checked={form.consentPublic}
                      onChange={(v) => update("consentPublic", v)}
                    />
                    {form.consentPublic && (
                      <div className="space-y-3 pl-4">
                        {choices.slice(1, 4).map(([key, label]) => (
                          <Choice
                            key={key}
                            label={label}
                            checked={form[key]}
                            onChange={(v) => update(key, v)}
                          />
                        ))}
                      </div>
                    )}
                    <Choice
                      label={l.reuse}
                      checked={form.consentReuse}
                      onChange={(v) => update("consentReuse", v)}
                    />
                  </>
                )}
                <Choice
                  label={l.analysis}
                  checked={form.consentAnalysis}
                  onChange={(v) => update("consentAnalysis", v)}
                />
                <Choice
                  required
                  label={l.review + " · " + t.required}
                  checked={form.acknowledgementReview}
                  onChange={(v) => update("acknowledgementReview", v)}
                />
                <Choice
                  required
                  label={l.privateInfo + " · " + t.required}
                  checked={form.acknowledgementPrivacy}
                  onChange={(v) => update("acknowledgementPrivacy", v)}
                />
                <div hidden>
                  <input
                    name="website"
                    autoComplete="off"
                    tabIndex={-1}
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                  />
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="mt-6 space-y-5">
                <dl className="rounded-xl bg-[#fff9f4] p-4">
                  <dt className="font-bold">{l.age}</dt>
                  <dd>{form.age}</dd>
                  <dt className="mt-3 font-bold">{l.perspective}</dt>
                  <dd>{form.perspective === "own" ? l.own : l.ally}</dd>
                  {!under13 && (
                    <>
                      <dt className="mt-3 font-bold">{l.known}</dt>
                      <dd>{form.displayName || l.anonymous}</dd>
                      <dt className="mt-3 font-bold">{l.city}</dt>
                      <dd>{form.cityRegion || "—"}</dd>
                    </>
                  )}
                  <dt className="mt-3 font-bold">{l.country}</dt>
                  <dd>{form.country || "—"}</dd>
                </dl>
                {(
                  [
                    ["girlhoodResponse", t.q1],
                    ["futureResponse", t.q2],
                    ["supportResponse", t.q3],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <h3 className="font-bold">{label}</h3>
                    <p className="whitespace-pre-wrap break-words">
                      {normalizePlainText(form[key]) || "—"}
                    </p>
                  </div>
                ))}
                <h3 className="font-bold">{l.permissions}</h3>
                <ul className="space-y-2">
                  {choices
                    .filter(([key]) => !under13 || key === "consentAnalysis")
                    .map(([key, label]) => (
                      <li key={key}>
                        {label} <strong>{form[key] ? l.yes : l.no}</strong>
                      </li>
                    ))}
                </ul>
                {under13 && <p>{l.under13}</p>}
                {!under13 && form.consentPublic && (
                  <>
                    <h3 className="font-bold">{l.preview}</h3>
                    <GirlhoodResponseCard
                      response={preview}
                      language={language}
                    />
                  </>
                )}
                <button
                  type="button"
                  className="underline"
                  disabled={loading}
                  onClick={() => setStep(0)}
                >
                  {l.edit}
                </button>
              </div>
            )}
            <div className="mt-8 flex justify-between gap-3">
              {step > 0 ? (
                <button
                  disabled={loading}
                  type="button"
                  className="girlhood-button"
                  onClick={() => {
                    setError("");
                    setStep((s) => s - 1);
                  }}
                >
                  {t.back}
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={loading || availability.state !== "open" || (isPreview && step === 3)}
                className="girlhood-button inline-flex items-center gap-2"
              >
                {loading ? l.sending : step === 3 ? t.submit : t.next}
                {!loading &&
                  (step === 3 ? (
                    <Sparkles size={18} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={18} aria-hidden="true" />
                  ))}
              </button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm">{x.privacyNote}</p>
        </>
      )}
    </section>
  );
}
