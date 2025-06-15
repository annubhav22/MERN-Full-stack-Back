const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({ 
  title: { type: String, required: true },
  price: { type: Number, required: true },
  discountPercentage: { type: Number, default: 0 },
  discountPrice: { type: Number },
  category: { type: String },
  brand: { type: String },
  deleted: { type: Boolean, default: false }
});

// Pre-save or post-updates can handle discountPrice, 
// or you can manually compute it in controller. 
// We'll omit that here.

const Product = mongoose.model('Product', ProductSchema);

module.exports = { Product };
