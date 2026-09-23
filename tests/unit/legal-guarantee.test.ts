import { describe, it, expect } from 'vitest'
import { LEGAL_GUARANTEE_TEXT } from '@/components/legal/LegalGuaranteeBox'

/**
 * The encadré from the annexe to art. D211-2 du code de la consommation,
 * held here a second time, by hand.
 *
 * This is deliberately a duplicated copy rather than an import: a
 * snapshot that reads from the same module it is checking passes no
 * matter what happens to the text. The point of the test is that a future
 * edit to the component — a tidied apostrophe, a rewrapped line, a
 * paragraph someone thought read better shorter — fails loudly, because
 * in this one box the exact wording is the legal obligation rather than a
 * stylistic preference. If this test fails, the fix is almost always to
 * revert the component, not to update the expectation. Change the
 * expectation only after checking the new wording against Légifrance.
 */
const OFFICIAL = `Le consommateur dispose d'un délai de deux ans à compter de la délivrance du bien pour obtenir la mise en œuvre de la garantie légale de conformité en cas d'apparition d'un défaut de conformité. Durant ce délai, le consommateur n'est tenu d'établir que l'existence du défaut de conformité et non la date d'apparition de celui-ci.

Lorsque le contrat de vente du bien prévoit la fourniture d'un contenu numérique ou d'un service numérique de manière continue pendant une durée supérieure à deux ans, la garantie légale est applicable à ce contenu numérique ou ce service numérique tout au long de la période de fourniture prévue. Durant ce délai, le consommateur n'est tenu d'établir que l'existence du défaut de conformité affectant le contenu numérique ou le service numérique et non la date d'apparition de celui-ci.

La garantie légale de conformité emporte obligation pour le professionnel, le cas échéant, de fournir toutes les mises à jour nécessaires au maintien de la conformité du bien.

La garantie légale de conformité donne au consommateur droit à la réparation ou au remplacement du bien dans un délai de trente jours suivant sa demande, sans frais et sans inconvénient majeur pour lui.

Si le bien est réparé dans le cadre de la garantie légale de conformité, le consommateur bénéficie d'une extension de six mois de la garantie initiale.

Si le consommateur demande la réparation du bien, mais que le vendeur impose le remplacement, la garantie légale de conformité est renouvelée pour une période de deux ans à compter de la date de remplacement du bien.

Le consommateur peut obtenir une réduction du prix d'achat en conservant le bien ou mettre fin au contrat en se faisant rembourser intégralement contre restitution du bien, si :
1° Le professionnel refuse de réparer ou de remplacer le bien ;
2° La réparation ou le remplacement du bien intervient après un délai de trente jours ;
3° La réparation ou le remplacement du bien occasionne un inconvénient majeur pour le consommateur, notamment lorsque le consommateur supporte définitivement les frais de reprise ou d'enlèvement du bien non conforme, ou s'il supporte les frais d'installation du bien réparé ou de remplacement ;
4° La non-conformité du bien persiste en dépit de la tentative de mise en conformité du vendeur restée infructueuse.

Le consommateur a également droit à une réduction du prix du bien ou à la résolution du contrat lorsque le défaut de conformité est si grave qu'il justifie que la réduction du prix ou la résolution du contrat soit immédiate. Le consommateur n'est alors pas tenu de demander la réparation ou le remplacement du bien au préalable.

Le consommateur n'a pas droit à la résolution de la vente si le défaut de conformité est mineur.

Toute période d'immobilisation du bien en vue de sa réparation ou de son remplacement suspend la garantie qui restait à courir jusqu'à la délivrance du bien remis en état.

Les droits mentionnés ci-dessus résultent de l'application des articles L. 217-1 à L. 217-32 du code de la consommation.

Le vendeur qui fait obstacle de mauvaise foi à la mise en œuvre de la garantie légale de conformité encourt une amende civile d'un montant maximal de 300 000 euros, qui peut être porté jusqu'à 10 % du chiffre d'affaires moyen annuel (article L. 241-5 du code de la consommation).

Le consommateur bénéficie également de la garantie légale des vices cachés en application des articles 1641 à 1649 du code civil, pendant une durée de deux ans à compter de la découverte du défaut. Cette garantie donne droit à une réduction de prix si le bien est conservé ou à un remboursement intégral contre restitution du bien.`

describe('LegalGuaranteeBox', () => {
  it('holds the official text, to the character', () => {
    expect(LEGAL_GUARANTEE_TEXT).toBe(OFFICIAL)
  })

  it('keeps the thirteen paragraphs and the four numbered items', () => {
    const paragraphs = LEGAL_GUARANTEE_TEXT.split(/\n\n/)
    expect(paragraphs).toHaveLength(13)
    for (const marker of ['1°', '2°', '3°', '4°']) {
      expect(LEGAL_GUARANTEE_TEXT).toContain(marker)
    }
  })

  it('still cites the three articles it is required to cite', () => {
    expect(LEGAL_GUARANTEE_TEXT).toContain('L. 217-1 à L. 217-32')
    expect(LEGAL_GUARANTEE_TEXT).toContain('L. 241-5')
    expect(LEGAL_GUARANTEE_TEXT).toContain('1641 à 1649')
    expect(LEGAL_GUARANTEE_TEXT).toContain('300 000 euros')
  })

  it('has not been "tidied" into typographic apostrophes', () => {
    // The official text uses the typewriter apostrophe throughout. A
    // find-and-replace across the codebase's French copy would otherwise
    // silently rewrite a regulatory text.
    expect(LEGAL_GUARANTEE_TEXT).not.toContain('’')
  })
})
