const fs = require('fs');
const mongoose = require('mongoose');
const { Product } = require('./model/Product');
const connectDB = require('./connectDB');

require('dotenv').config();

async function seedProducts() {
  try {
    await connectDB();

    const rawData = fs.readFileSync('./data.json');
    const data = JSON.parse(rawData);

    const formattedProducts = data.products.map((p) => ({
      title: p.title,
      description: p.description,
      price: p.price,
      discountPercentage: Math.max(p.discountPercentage, 1),
      rating: p.rating,
      stock: p.stock,
      brand: p.brand || 'Unknown Brand',
      category: p.category,
      thumbnail: p.thumbnail,
      images: p.images || [],
      colors: [], // Default if not in data
      sizes: [], // Default if not in data
      highlights: [], // Optional
      discountPrice: (p.price - (p.price * p.discountPercentage / 100)).toFixed(2),
    }));

    await Product.deleteMany({});
    await Product.insertMany(formattedProducts);

    console.log('✅ Products seeded successfully');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedProducts();
