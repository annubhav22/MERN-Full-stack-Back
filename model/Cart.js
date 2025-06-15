const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({ 
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  products: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      qty: { 
        type: Number, 
        default: 1 
      }
    }
  ]
}, { timestamps: true });

const Cart = mongoose.model('Cart', CartSchema);

module.exports = { Cart };
