import mongoose from 'mongoose'

const AddressSchema = new mongoose.Schema(
  {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: 'France' },
  },
  { _id: false }
)

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // Absent for accounts created via Google — those sign in through OAuth
  // only and never have a local password.
  passwordHash: {
    type: String,
  },
  name: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  address: {
    type: AddressSchema,
    default: () => ({}),
  },
  image: {
    type: String,
    default: '',
  },
  // Set the moment an email is confirmed — via the verification link, or
  // immediately on Google sign-in, since Google has already done that
  // proof for us. Null/unset means unverified.
  emailVerified: {
    type: Date,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpires: {
    type: Date,
  },
  // Throttles the "resend" button independently of token expiry.
  verificationSentAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
