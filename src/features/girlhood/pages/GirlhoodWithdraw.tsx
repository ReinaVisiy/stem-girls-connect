import { useGirlhoodRuntime } from '../GirlhoodRuntime';
import { useGirlhoodBasePath } from '../GirlhoodPaths';
import { useRef, useState, type FormEvent } from "react";
import { Link } from "../GirlhoodRuntime";
import Seo from "../../../components/Seo";
import { ui } from "../config/ui";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
export default function GirlhoodWithdraw() {
  const { request, preview: isPreview } = useGirlhoodRuntime();
  const basePath = useGirlhoodBasePath();
  const { language } = useGirlhoodLanguage();
  const t = ui[language];
  const [reference, setReference] = useState(""),
    [code, setCode] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const busy = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current || isPreview) return;
    busy.current = true;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const r = await request("/api/girlhood/withdraw", {
        signal: AbortSignal.timeout(20000),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicReference: reference,
          withdrawalCode: code,
          language,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t.withdrawError);
      setMessage(data.message);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.withdrawError);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <Seo
        title={t.withdraw + " | Girlhood Should Be Hers"}
        description={t.withdrawalHelp}
        path={basePath + '/withdraw'}
      />
      <h1 className="text-4xl font-black">{t.withdraw}</h1>
      <p className="mt-5">{t.withdrawalHelp}</p>
      <form onSubmit={submit} className="mt-8 rounded-3xl bg-white p-6">
        <label className="block font-bold">
          {t.reference}
          <input
            required
            maxLength={40}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            autoCapitalize="characters"
            spellCheck={false}
            className="girlhood-input mt-2"
          />
        </label>
        <label className="mt-5 block font-bold">
          {t.code}
          <input
            required
            type="password"
            maxLength={100}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="girlhood-input mt-2"
          />
        </label>
        <button disabled={loading || isPreview} className="girlhood-button mt-6">
          {loading ? t.checking : t.withdrawButton}
        </button>
        {error && (
          <p role="alert" className="mt-4 text-red-800">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 font-bold">
            {message}
          </p>
        )}
      </form>
      <p className="mt-6">{t.privacyWithdraw}</p>
      <Link to={basePath + '/privacy'} className="mt-4 inline-block underline">
        {t.privacy}
      </Link>
    </section>
  );
}
