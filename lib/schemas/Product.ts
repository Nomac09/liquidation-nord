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
