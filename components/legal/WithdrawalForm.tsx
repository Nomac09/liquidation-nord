import { COMPANY, formatHeadOffice } from '@/lib/company'
import { BRAND_NAME } from '@/lib/brand'

/**
 * The modèle de formulaire de rétractation from annexe to article R221-1
 * of the Code de la consommation. It appears twice, as the CGV annexe and
 * as the body of /retractation, and is one component so the two can never
 * say different things.
 *
 * Not a <form>: there is nothing to submit. The law requires the model to
 * be made available, and the buyer sends it back by email or by post. A
 * real form here would imply the withdrawal is registered on submission,
 * which it would not be, and that gap is exactly where a genuine dispute
 * about "I did notify you in time" starts.
 */
export default function WithdrawalForm() {
  return (
    <div className="rounded-lg border border-hairline bg-paper px-5 py-5 text-[15px] leading-relaxed text-ink print:break-inside-avoid">
      <p className="italic text-ink/75">
        (Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous
        rétracter du contrat.)
      </p>

      <p className="mt-4">
        À l’attention de {COMPANY.legalName} ({BRAND_NAME}), {formatHeadOffice({ withCountry: true })},{' '}
        <a href={`mailto:${COMPANY.email}`} className="text-verdigris-deep underline underline-offset-2 hover:text-ink">
          {COMPANY.email}
        </a>{' '}
        :
      </p>

      <p className="mt-4">
        Je/nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat
        portant sur la vente du bien (*) ci-dessous :
      </p>

      <dl className="mt-4 space-y-3">
        {[
          'Commandé le (*) / reçu le (*)',
          'Numéro de commande',
          'Nom du (des) consommateur(s)',
          'Adresse du (des) consommateur(s)',
          'Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier)',
          'Date',
        ].map((label) => (
          <div key={label}>
            <dt className="text-ink/85">{label} :</dt>
            <dd className="mt-1 border-b border-dashed border-hairline-strong pb-5" />
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-dust">(*) Rayez la mention inutile.</p>
    </div>
  )
}
