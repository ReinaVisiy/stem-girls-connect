import { lazy, Suspense, useMemo } from 'react';
import GirlhoodPaperFrame from '../paper/GirlhoodPaperFrame';
import type { PersonalWords } from '../paper/renderImage';
const PersonalImageComposer = lazy(() => import('../components/PersonalImageComposer'));
import { useGirlhoodRuntime } from "../GirlhoodRuntime";
import {
  AvailabilityNotice,
  availabilityCopy,
  useCampaignAvailability,
} from "../components/CampaignAvailability";
import { useGirlhoodBasePath } from "../GirlhoodPaths";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "../GirlhoodRuntime";
import Seo from "../../../components/Seo";
import { Check, Download, ShieldCheck } from "lucide-react";
import { experience } from "../config/experience";

import { copy } from "../config/copy";
import { ui } from "../config/ui";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
import type { GirlhoodSubmissionInput } from "../types";
import { validateGirlhoodSubmission } from "../validation";

const empty: GirlhoodSubmissionInput = {
  age: "",
  perspective: "",
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
    <label className="girlhood-choice">
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
  const [receiptSaved, setReceiptSaved] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
      publicReference: string;
      withdrawalCode: string;
      publicationRequested?: boolean;
      published?: boolean;
      withdrawn?: boolean;
    } | null>(null),
    [feedback, setFeedback] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<PersonalWords | null>(null);
  const currentWords = useMemo<PersonalWords>(() => ({ answers: [form.girlhoodResponse, form.futureResponse, form.supportResponse], younger: typeof form.age === 'number' && form.age < 15, ageKnown: typeof form.age === 'number', name: form.displayName }), [form.girlhoodResponse, form.futureResponse, form.supportResponse, form.age, form.displayName]);
  const imageWords = success ? snapshot : currentWords;
  const heading = useRef<HTMLHeadingElement>(null),
    alert = useRef<HTMLDivElement>(null),
    busy = useRef(false);
  useEffect(() => {
    if (success) heading.current?.focus();
  }, [success]);
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
  }, [request, isPreview]);
  useEffect(() => {
    if (!success || receiptSaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const remind = (event: MouseEvent) => {
      if (
        (event.target as HTMLElement).closest("a[href]:not([download])") &&
        !window.confirm(x.receiptHelp)
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", remind, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", remind, true);
    };
  }, [success, receiptSaved, x.receiptHelp]);
  const under15 = typeof form.age === "number" && form.age < 15;
  const under18 = typeof form.age === "number" && form.age < 18;
  const [ageNoticeOpen, setAgeNoticeOpen] = useState(false);
  const [ageNoticeSeen, setAgeNoticeSeen] = useState<number | null>(null);
  const ageDone = () => {
    if (under15 && ageNoticeSeen !== form.age) setAgeNoticeOpen(true);
  };
  const update = <K extends keyof GirlhoodSubmissionInput>(
    key: K,
    value: GirlhoodSubmissionInput[K],
  ) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
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
      : code === "perspective"
        ? l.perspectiveRequired
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
      window.location.origin + (basePath + "/withdraw"),
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
    setReceiptSaved(true);
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
    setSnapshot(null);
    setImageOpen(false);
    setReceiptSaved(false);
    setFeedback("");
    setError("");
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current || isPreview) return;
    if (errors.length) {
      setError(errorFor(errors[0]));
      return;
    }
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      if ((await availability.refresh()) !== "open") return;
      const response = await request("/api/girlhood/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, requestToken: tokenForAttempt() }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (data.code === "CAMPAIGN_CLOSED") {
        availability.close(
          data.state === "not_yet_open" ? "not_yet_open" : "closed",
        );
        setError(availabilityCopy[language].closed);
        return;
      }
      if (!response.ok) throw new Error(data.error || l.sendError);
      if (
        typeof data.publicReference !== "string" ||
        typeof data.withdrawalCode !== "string"
      )
        throw new Error(l.sendError);
      setSnapshot(currentWords);
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
  async function copyText(value: string, receipt = false) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(l.copied);
      if (receipt) setReceiptSaved(true);
    } catch {
      setFeedback(l.copyFailed);
    }
  }
  return (
    <section className="girlhood-form-page">
      <Seo
        title={
          (success ? l.received : t.addVoice) + " | Girlhood Should Be Hers"
        }
        description={t.intro}
        path={basePath + "/share-your-voice"}
      />
      <h1 ref={heading} tabIndex={-1} className="girlhood-page-title">
        {success ? l.received : t.addVoice}
      </h1>
      {!success && (
        <>
          <p className="girlhood-subtitle">
            {language === "fr"
              ? "Quelques mots, comme ils te viennent."
              : "A few words, just as they come."}
          </p>
          <AvailabilityNotice />
        </>
      )}
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

          <p className="mt-4">
            {!success.withdrawn &&
              (success.published ? l.published : success.publicationRequested ? l.pending : l.privateReceipt)}
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
            className="girlhood-quiet-link mt-4 block"
            onClick={() =>
              copyText(
                l.reference +
                  ": " +
                  success.publicReference +
                  "\n" +
                  l.code +
                  ": " +
                  success.withdrawalCode +
                  "\n" +
                  window.location.origin +
                  basePath +
                  "/withdraw",
                true,
              )
            }
          >
            {language === "fr"
              ? "Copier mon reçu privé"
              : "Copy my private receipt"}
          </button>
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
            <Link className="girlhood-button" to={basePath + "/wall"}>
              {t.wall}
            </Link>
            <Link className="girlhood-button" to={basePath + "/withdraw"}>
              {l.withdraw}
            </Link>
            <button
              onClick={() => copyText(window.location.origin + (basePath + ""))}
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
      ) : (
        <form onSubmit={submit} noValidate className="girlhood-notebook">
          <GirlhoodPaperFrame className="girlhood-writing-paper">
            <h2 className="girlhood-paper-title">Girlhood Should Be Hers</h2>
          <div className="girlhood-writing-cards">
            {(
              [
                ["girlhoodResponse", t.q1],
                ["futureResponse", t.q2],
                ["supportResponse", t.q3],
              ] as const
            ).map(([key, title], i) => (
              <div
                key={key}
                className="girlhood-writing-card is-active"
              >
                <label htmlFor={"note-" + i}>
                  {title}
                  <span className="sr-only">
                    {" "}
                    · {i === 0 ? t.required : t.optional}
                  </span>
                </label>
                <textarea
                  id={"note-" + i}
                  required={i === 0}
                  rows={3}
                  value={form[key]}
                  placeholder={
                    i === 0
                      ? language === "fr"
                        ? "Tes mots ici…"
                        : "Your words here…"
                      : language === "fr"
                        ? "Si tu le souhaites…"
                        : "If you like…"
                  }
                  onChange={(e) => {
                    update(key, e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />
              </div>
            ))}
          </div>
          <div className="girlhood-signature-field">
            <label htmlFor="note-name">
              {language === "fr"
                ? "Ton nom ou surnom (facultatif)"
                : "Your name or nickname (optional)"}
            </label>
            <input
              id="note-name"
              className="girlhood-signature-input"
              value={form.displayName}
              maxLength={80}
              autoComplete="nickname"
              aria-describedby="note-name-help"
              onChange={(e) => update("displayName", e.target.value)}
            />
            <p id="note-name-help">
              {language === "fr"
                ? "Ce nom apparaît sur ta carte. Il n’est affiché publiquement que si tu le choisis plus bas."
                : "This name appears on your card. It is only shown publicly if you choose that below."}
            </p>
          </div>
          </GirlhoodPaperFrame>
          <p>{language === 'fr' ? 'Tu peux garder une image sans envoyer tes mots.' : 'You can keep an image without sending your words.'}</p>
          <button type="button" className="girlhood-button girlhood-create-image" disabled={!currentWords.answers.some(answer => answer.trim())} onClick={() => setImageOpen(true)}>{language === 'fr' ? 'Créer mon image' : 'Create my image'}</button>
          <section className="girlhood-before">
            <h2>
              {language === "fr"
                ? "Avant de partager tes mots"
                : "Before you leave your note"}{" "}
              <span aria-hidden="true">↗</span>
            </h2>
            <div className="girlhood-before-content">
              <div className="girlhood-personal">
                <fieldset className="girlhood-perspective">
                  <legend>
                    {l.perspectiveQuestion}
                    {" · "}
                    {language === "fr" ? "Obligatoire" : "Required"}
                  </legend>
                  {(["own", "ally"] as const).map((value) => (
                    <label className="girlhood-choice" key={value}>
                      <input
                        type="radio"
                        name="perspective"
                        value={value}
                        className="mt-1 size-5 shrink-0 accent-[#82246d]"
                        checked={form.perspective === value}
                        onChange={() => update("perspective", value)}
                        aria-required="true"
                      />
                      <span>
                        {value === "own" ? l.perspectiveOwn : l.perspectiveAlly}
                      </span>
                    </label>
                  ))}
                </fieldset>
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
                    className="girlhood-input girlhood-age"
                    aria-describedby="age-help"
                    onBlur={ageDone}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        ageDone();
                        if (under15) e.preventDefault();
                      }
                    }}
                  />
                </Field>
                <p id="age-help">
                  {language === "fr"
                    ? "Ton âge reste privé."
                    : "Your age stays private."}
                </p>
                {ageNoticeOpen && under15 && (
                  <div className="girlhood-age-notice" role="group" aria-labelledby="age-notice-title">
                    <p id="age-notice-title"><strong>{language === "fr" ? "Un petit mot sur le partage" : "A little note about sharing"}</strong></p>
                    <p>
                      {language === "fr"
                        ? "Tu peux partager tes idées ! Comme tu as moins de 15 ans, ta réponse sera relue par l’équipe de STEM Girls Connect avant de pouvoir apparaître sur le mur public."
                        : "You're welcome to share your thoughts! Because you're under 15, your response will be reviewed by the STEM Girls Connect team before it can appear on the public wall."}
                    </p>
                    <button type="button" className="girlhood-button" onClick={() => { setAgeNoticeSeen(typeof form.age === "number" ? form.age : null); setAgeNoticeOpen(false); }}>
                      {language === "fr" ? "J’ai compris" : "Got it"}
                    </button>
                  </div>
                )}
                {typeof form.age === "number" && !under15 && (
                  <p className="girlhood-age-inline">
                    {language === "fr"
                      ? "Ta réponse peut apparaître sur le mur public après l’envoi si tu choisis de la partager et si elle passe nos contrôles de sécurité."
                      : "Your response can appear on the public wall after submission if you choose to share it publicly and it passes our safety checks."}
                  </p>
                )}
                {(
                  <>
                  <Field
                    label={
                      language === "fr"
                        ? "Dans quel pays vis-tu ? (facultatif)"
                        : "Which country are you in? (optional)"
                    }
                  >
                    <input
                      className="girlhood-input girlhood-country"
                      value={form.country}
                      maxLength={100}
                      autoComplete="country-name"
                      onChange={(e) => update("country", e.target.value)}
                    />
                  </Field>
                  <Field
                    label={
                      language === "fr"
                        ? "Dans quelle ville ou région ? (facultatif)"
                        : "City or region (optional)"
                    }
                  >
                    <input
                      className="girlhood-input"
                      value={form.cityRegion}
                      maxLength={100}
                      autoComplete="address-level2"
                      onChange={(e) => update("cityRegion", e.target.value)}
                    />
                  </Field>
                  </>
                )}
              </div>
              <>
                  <Choice
                    label={l.publish}
                    checked={form.consentPublic}
                    onChange={(v) => update("consentPublic", v)}
                  />
                  {form.consentPublic && (
                    <div className="girlhood-public-choices">
                      <Choice
                        label={l.showName}
                        checked={form.consentDisplayName}
                        onChange={(v) => update("consentDisplayName", v)}
                      />
                      <Choice
                        label={
                          language === "fr"
                            ? under18 ? "Afficher mon pays avec mon petit mot (vérifié séparément par l’équipe)" : "Afficher mon pays avec mon petit mot"
                            : under18 ? "Show my country with my note (reviewed separately by the team)" : "Show my country with my note"
                        }
                        checked={form.consentDisplayCountry}
                        onChange={(v) => update("consentDisplayCountry", v)}
                      />
                      <Choice
                        label={
                          language === "fr"
                            ? "Afficher cette ville ou région avec mon petit mot"
                            : "Show this city or region with my note"
                        }
                        checked={form.consentDisplayCity}
                        onChange={(v) => update("consentDisplayCity", v)}
                      />
                    </div>
                  )}
              </>
              <div className="girlhood-required-checks" role="group" aria-labelledby="required-checks-title">
                <p id="required-checks-title" className="girlhood-required-title">
                  {language === "fr" ? "Avant d’envoyer (obligatoire)" : "Before you share (required)"}
                </p>
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
              </div>
              <Link
                to={basePath + "/privacy"}
                target="_blank"
                rel="noopener"
                className="girlhood-quiet-link"
              >
                {l.privacy}
              </Link>
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
          </section>
          {error && (
            <div
              ref={alert}
              tabIndex={-1}
              role="alert"
              className="girlhood-form-error"
            >
              {error}
            </div>
          )}
          <div className="girlhood-send">
            <button
              type="submit"
              disabled={
                loading ||
                availability.state !== "open" ||
                isPreview
              }
              className="girlhood-button"
            >
              {loading ? l.sending : t.submit} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      )}
      {success && imageWords && imageWords.answers.some(answer => answer.trim()) && <button type="button" className="girlhood-button girlhood-create-image" onClick={() => setImageOpen(true)}>{language === 'fr' ? 'Créer mon image' : 'Create my image'}</button>}
      {imageOpen && imageWords && <Suspense fallback={<p role="status">{l.loading}</p>}><PersonalImageComposer words={imageWords} language={language} onClose={() => setImageOpen(false)} /></Suspense>}
    </section>
  );
}
