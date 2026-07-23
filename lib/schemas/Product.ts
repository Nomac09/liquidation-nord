import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  ean: {
    type: String,
    required: true,
    unique: true,
    index: true
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
  condition: {
    type: String,
    default: "Non testé - Retour client"
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
