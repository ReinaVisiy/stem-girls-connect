import { useGirlhoodBasePath } from '../GirlhoodPaths';
import Seo from "../../../components/Seo";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
import { ui } from "../config/ui";
export default function GirlhoodPrivacy() {
  const basePath = useGirlhoodBasePath();
  const { language } = useGirlhoodLanguage();
  const t = ui[language];
  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Seo
        title={t.privacy + " | Girlhood Should Be Hers"}
        description={t.privacyIntro}
        path={basePath + '/privacy'}
      />
      <h1 className="text-4xl font-black">{t.privacy}</h1>
      {[
        t.privacyIntro,
        t.privacyAge,
        t.privacyChoices,
        t.privacyRetention,
        t.privacyNoAnalysis,
        t.privacyWithdraw,
        t.privacyStorage,
        t.privacyContact,
        t.privacyReminder,
      ].map((p) => (
        <p key={p} className="mt-5 leading-relaxed">
          {p}
        </p>
      ))}
    </section>
  );
}
