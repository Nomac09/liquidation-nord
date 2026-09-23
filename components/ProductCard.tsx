export interface CatalogProduct {
  _id: string
  name: string
  internalRef?: string
  category: string
  rrp: number
  salePrice: number
  comparePrice?: number
  comparePriceSource?: string
  comparePriceCheckedAt?: string
  discountPercent?: number
  photos: string[]
  condition?: string
  slug: string
  status?: 'sellable' | 'sold' | 'unsellable'
  specLine?: string
  weight?: number
}
