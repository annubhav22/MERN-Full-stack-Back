const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentMethods = {
  values: ['card', 'cash'],
  message: 'enum validator failed for payment methods'
};

const orderSchema = new Schema({ 
  items: { type: [Schema.Types.Mixed], required: true },
  totalAmount: { type: Number, required: true },
  totalItems: { type: Number, required: true },
  user: { type: Schema.Types.ObjectId, ref:'User', required: true },
  paymentMethod: { type: String, required: true, enum: paymentMethods },
  paymentStatus: { type: String, default:'pending' },
  status: { type: String, default:'pending' },
  selectedAddress: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

orderSchema.virtual('id').get(function () {
  return this._id.toString();
});

orderSchema.set('toJSON', { 
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

exports.Order = mongoose.model('Order', orderSchema);
