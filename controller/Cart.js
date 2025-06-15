const { Cart } = require('../model/Cart');  

exports.addToCart = async (req, res) => {
  try {
    const { id } = req.user;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "ProductId is required." });
    }
  
    let cart = await Cart.findOne({ user: id });

    if (!cart) {
      cart = await Cart.create({ user: id, products: [] });
    }
  
    // Check if product already in the cart
    const existingProduct = cart.products.find(
      (item) => item.productId.toString() === productId
    );

    if (existingProduct) {
      existingProduct.qty += 1;
    } else {
      cart.products.push({ productId, qty: 1 });
    }
  
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err?.message || 'Server Error' });
  }
};

exports.fetchCart = async (req, res) => {
  try {
    const { id } = req.user;
    const cart = await Cart.findOne({ user: id }).populate('products.productId');
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err?.message || 'Server Error' });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { qty } = req.body;

    if (qty <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }
  
    const { id: userId } = req.user;
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
  
    const product = cart.products.id(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found in the cart" });
    }
  
    product.qty = qty;
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err?.message || 'Server Error' });
  }
};

exports.deleteFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
  
    cart.products = cart.products.filter((item) => item._id.toString() !== id);
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err?.message || 'Server Error' });
  }
};


