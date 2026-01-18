// lib/schemas/Order.ts
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  subtotal: Number,
  shippingMethod: { type: String, enum: ['pickup', 'relay', 'home'] },
  shippingCost: Number,
  shippingDetails: Object,
  total: Number,
  stripeSessionId: String,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  deliveryStatus: { type: String, enum: ['pending', 'label_created', 'shipped', 'delivered'], default: 'pending' },
  trackingNumber: String,
  customerEmail: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);