import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  ean: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Customer-facing reference (e.g. "SQ-A3F91") — never the raw EAN, which
  // is traceable back to the original manufacturer listing. ean stays in
  // the DB for internal inventory tracking only; it must never be sent to
  // a client component or rendered.
  internalRef: {
    type: String,
    unique: true,
    sparse: true
  },
  // Decorative 13-digit code for the on-page barcode graphic — derived
  // independently from ean so the printed barcode can't be reverse-mapped
  // to the real one.
  pseudoBarcode: {
    type: String,
    default: ''
  },
  sku: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    default: 'Bazar'
    // Removed enum restriction - now accepts any category
  },
  // The supplier manifest's "RRP" column, kept as it was imported. It is
  // a recommended retail price from a liquidation sheet: no stated
  // source, no observation date, and not necessarily a price anybody ever
  // charged. Which is why it is no longer shown struck through beside the
  // sale price — see comparePrice below — but it is not deleted either,
  // since it is the only record of what the sheet said.
  rrp: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0
  },

  // A price actually observed at another retailer, on a day we can name.
  //
  // The three fields travel together on purpose: a comparison with no
  // source and no date is indistinguishable from a claim about our own
  // former price, which art. L112-1-1 reserves for a real reduction
  // measured against our own lowest price of the last 30 days. Displaying
  // it requires all three, and a date no older than 90 days.
  comparePrice: {
    type: Number,
    min: 0
  },
  comparePriceSource: {
    type: String,
    enum: ['vidaXL.fr']
  },
  comparePriceCheckedAt: {
    type: Date
  },
  // The discount actually applied, 20 to 60. Stored rather than derived,
  // because roundToPsych means the arithmetic between comparePrice and
  // salePrice no longer lands on a round number, and the badge must state
  // what was applied rather than what can be reverse-engineered.
  discountPercent: {
    type: Number,
    min: 20,
    max: 60
  },
  // What the unit cost us, TTC. Internal only, never sent to a client
  // component. Optional: much of the stock predates any cost record.
  unitCost: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  photos: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  specs: [{
    type: String
  }],
  nameEn: {
    type: String,
    default: ''
  },
  lot: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['sellable', 'unsellable', 'sold'],
    default: 'sellable'
  },
  // Set only by the payment webhook's atomic sold-transition, never by
  // client code. Used for order records now, and a "recently sold" rail
  // later.
  soldAt: {
    type: Date
  },
  // True only once a specific unit has been physically inspected before
  // listing. Drives the "Comme neuf" badge — never set true by import
  // scripts, only by an actual inspection step.
  inspected: {
    type: Boolean,
    default: false
  },
  // Optional per-item note for something specific worth flagging
  // (e.g. a scuff), shown alongside the condition badge when present.
  conditionNote: {
    type: String,
    default: ''
  },
  condition: {
    type: String,
    default: ""
  },
  dimensions: {
    type: String,
    default: ''
  },
  weight: {
    type: Number,
    default: 0
  },
  // Handling/shipping size bucket assigned by scripts/classify-size.ts.
  // Not set by anything else; absent until that script has run with
  // --apply, and absent again for anything it could only mark "à
  // vérifier" rather than resolve.
  sizeClass: {
    type: String,
    enum: ['S', 'M', 'L', 'XL']
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update timestamp on save
ProductSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
