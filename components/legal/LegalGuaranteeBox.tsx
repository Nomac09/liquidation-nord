import { COMPANY, isPlaceholder } from '@/lib/company'

/**
 * The encadré imposed by the annexe to décret n° 2022-424 du 25 mars 2022,
 * covering the garantie légale de conformité and the garantie des vices
 * cachés.
 *
 * TODO (Nasim): paste the official text into COMPANY.legalGuaranteeBoxText.
 *
 * It is deliberately NOT written here, and must not be paraphrased,
 * summarised or reconstructed from memory. The décret fixes the wording
 * itself: an approximation is not a smaller version of compliance, it is
 * non-compliance that looks compliant, which is worse, because nobody
 * reviews a box that appears to be already done. Copy it from Légifrance
 * verbatim, including its own headings and line breaks.
 *
 * Until it is filled, `npm run check:legal` fails the build, so this
 * cannot reach a customer by accident.
 */
export default function LegalGuaranteeBox() {
  const text = COMPANY.legalGuaranteeBoxText

  if (isPlaceholder(text)) {
    // Only ever visible to whoever is running the site locally with
    // LEGAL_ALLOW_INCOMPLETE=1: the gate blocks any build without it.
    return (
      <div
        role="note"
        className="my-4 rounded-lg border-2 border-dashed border-alert bg-alert-pale px-5 py-4 text-sm leading-relaxed text-alert"
      >
        <p className="font-semibold">Encadré légal manquant</p>
        <p className="mt-1">
          Le texte officiel de l’encadré relatif à la garantie légale de conformité et à la garantie
          des vices cachés (annexe du décret n° 2022-424 du 25 mars 2022) doit être copié depuis
          Légifrance dans <code className="font-mono">COMPANY.legalGuaranteeBoxText</code>. Il ne doit
          pas être réécrit : la rédaction est elle-même l’obligation.
        </p>
      </div>
    )
  }

  return (
    <div className="my-4 whitespace-pre-line rounded-lg border-2 border-ink bg-paper px-5 py-4 text-sm leading-relaxed text-ink">
      {text}
    </div>
  )
}
