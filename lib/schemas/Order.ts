// lib/schemas/Order.ts
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    // Weight at the time of sale, and the return-cost sentence derived
    // from it. Pinned for the same reason as deliveryPromise below:
    // L221-5 requires the return cost to be stated before the order, and
    // L221-23 means the buyer only owes the figure they were actually
    // given. Recomputing it from a later weight correction would quietly
    // change what they owe.
    weight: Number,
    returnNote: String
  }],
  subtotal: Number,
  shippingMethod: { type: String, enum: ['pickup', 'relay', 'home'] },
  shippingCost: Number,
  shippingDetails: Object,
  // The delivery promise as it was made, pinned at checkout rather than
  // recomputed at display time. The numbers in COMPANY.delivery will
  // change; what this buyer was told before paying must not.
  deliveryPromise: String,
  deliveryLatestDate: Date,
  total: Number,

  // The accountant's view, never shown to a customer.
  //
  // One line per taxable element, the delivery fee included as a line of
  // its own, plus the order-level figures below. Stored rather than
  // derived because a TVA return is filed against what was charged on the
  // day, and lib/vat.ts's rounding direction is allowed to change; a
  // recomputed history is not a history. `vatAmount` is the rounded
  // figure and `amountHT` is the remainder, so the three always
  // reconcile exactly.
  vatLines: [{
    label: String,
    kind: { type: String, enum: ['item', 'shipping'] },
    amountTTC: Number,
    vatAmount: Number,
    amountHT: Number
  }],
  amountTTC: Number,
  vatAmount: Number,
  amountHT: Number,
  vatRate: Number,

  stripeSessionId: { type: String, unique: true, sparse: true, index: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  // 'ready_for_pickup' only applies to shippingMethod: 'pickup'; the
  // 'label_created' / 'shipped' pair is for 'relay' and 'home' instead.
  deliveryStatus: { type: String, enum: ['pending', 'ready_for_pickup', 'label_created', 'shipped', 'delivered'], default: 'pending' },
  trackingNumber: String,
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  // The account this order belongs to, if the customer was signed in at
  // checkout — absent for guest orders.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // productIds where the atomic sold-transition failed at webhook time —
  // this customer was charged but the item had already been sold to
  // someone whose payment completed first. Needs a manual refund; should
  // never be non-empty in normal operation, but must not fail silently if
  // it happens.
  soldConflicts: [{ type: String }],
  // The CGV version the buyer accepted, pinned at checkout rather than
  // read from lib/company.ts at display time. Without this, a later
  // revision of the CGV would silently rewrite the terms of every past
  // order, which is exactly what the record is meant to prevent.
  cgvVersionDate: String,
  // When the buyer ticked the CGV box. Proof of acceptance: before this,
  // no past order recorded that the terms had been accepted at all, let
  // alone which version.
  cgvAcceptedAt: Date,
  // Claim marker for the confirmation email, so a redelivered Stripe
  // event cannot send it twice. Set before the send and unset again if
  // the send fails, which leaves the next redelivery free to retry.
  confirmationEmailSentAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);