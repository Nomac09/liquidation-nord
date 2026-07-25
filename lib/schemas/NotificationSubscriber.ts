import mongoose from 'mongoose'

const NotificationSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // Empty = every category. Values match Product.category / CATEGORIES
  // exactly (the display string, not a slug — same convention used
  // everywhere else in the catalog).
  categories: {
    type: [String],
    default: [],
  },
  // Set only if they were signed in at signup — the subscription itself
  // never requires an account, so this is informational, not a foreign
  // key anything else depends on.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  unsubscribeToken: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.NotificationSubscriber ||
  mongoose.model('NotificationSubscriber', NotificationSubscriberSchema)
