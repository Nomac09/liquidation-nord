// The visual <Sticker> clearance-chip component that used to live here is
// retired along with the rest of the ticket/perforation identity — see
// components/PriceMark.tsx for its replacement. Kept as just a currency
// formatter since ~10 files still import `formatPrice` from this path;
// not renamed/moved only to avoid an unrelated mass of import-path churn.
export function formatPrice(n: number) {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}
