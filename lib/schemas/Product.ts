import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  ean: { type: String, unique: true, index: true },
  sku: String,
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Mobilier', 'Bricolage', 'Textile', 'Bazar', 'GEM', 'Jouet'] 
  },
  rrp: Number,
  salePrice: Number,
  quantity: { type: Number, default: 1 },
  photos: [String],
  status: { 
    type: String, 
    enum: ['sellable', 'unsellable', 'sold'],
    default: 'sellable'
  },
  condition: { type: String, default: "Non testé - Retour client" },
  dimensions: String,
  weight: Number,
  slug: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
