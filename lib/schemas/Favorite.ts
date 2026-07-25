import mongoose from 'mongoose'

const FavoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true })

export default mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema)
