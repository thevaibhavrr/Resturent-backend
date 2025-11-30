const MenuItem = require('../models/MenuItem');

// Helper function to validate image URL
const validateImageUrl = (url) => {
  if (!url || url.trim() === '') {
    return true; // Empty URL is allowed
  }
  
  const trimmedUrl = url.trim();
  
  // Check if it's a local upload path (starts with /uploads/)
  if (trimmedUrl.startsWith('/uploads/')) {
    return true;
  }
  
  // Allow data URIs for images
  if (trimmedUrl.startsWith('data:image/')) {
    return true;
  }
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(trimmedUrl);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Check if it's likely an image URL
    // Option 1: Has image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const hasImageExtension = imageExtensions.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
    
    // Option 2: Common image hosting/CDN patterns (more flexible)
    // Allow URLs from common image hosting services or CDNs
    const commonImageHosts = [
      'imgur.com', 'cloudinary.com', 'unsplash.com', 'pexels.com',
      'pixabay.com', 'images.unsplash.com', 'res.cloudinary.com',
      'i.imgur.com', 'cdn.', 'images.', 'static.', 'assets.'
    ];
    const isCommonImageHost = commonImageHosts.some(host => 
      urlObj.hostname.includes(host)
    );
    
    // Option 3: Has image-related query parameters or path segments
    const imageParams = ['image', 'img', 'photo', 'picture', 'file'];
    const hasImageParam = imageParams.some(param => 
      urlObj.searchParams.has(param) || urlObj.pathname.toLowerCase().includes(param)
    );
    
    // Accept if any of the conditions are met
    // If none are met but it's a valid HTTP/HTTPS URL, still accept it (be flexible)
    // The frontend preview will show if it's actually an image
    if (hasImageExtension || isCommonImageHost || hasImageParam) {
      return true;
    }
    
    // For any other valid HTTP/HTTPS URL, accept it
    // This allows flexibility for custom CDNs or image services
    return true;
  } catch (e) {
    return false; // Invalid URL format
  }
};

// Create new menu item
exports.createItem = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price,
      cost, 
      categoryId, 
      restaurantId,
      image,
      isVeg,
      preparationTime 
    } = req.body;
    
    // Validate image URL if provided
    if (image && !validateImageUrl(image)) {
      return res.status(400).json({ 
        error: 'Invalid image URL. Please provide a valid image URL or upload an image file.' 
      });
    }
    
    // Find max display order within category and add 1
    const maxOrder = await MenuItem.findOne({ 
      categoryId,
      restaurantId 
    })
    .sort('-displayOrder')
    .select('displayOrder');
    
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
    
    const item = await MenuItem.create({ 
      name,
      description,
      cost: cost,
      price,
      categoryId,
      restaurantId,
      image,
      isVeg,
      preparationTime,
      displayOrder
    });
    
    // Populate category details
    await item.populate('categoryId');
    
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all items for a restaurant
exports.getItems = async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.query;
    
    const query = { 
      restaurantId,
      status: 'active'
    };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    const items = await MenuItem.find(query)
      .populate('categoryId')
      .sort('displayOrder');
      
    res.json(items);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update menu item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, ...updateData } = req.body;
    
    // Validate image URL if provided
    if (image && !validateImageUrl(image)) {
      return res.status(400).json({ 
        error: 'Invalid image URL. Please provide a valid image URL or upload an image file.' 
      });
    }
    
    // Include image in update data if it's valid
    if (image !== undefined) {
      updateData.image = image;
    }
    
    const item = await MenuItem.findByIdAndUpdate(
      id, 
      updateData,
      { new: true }
    ).populate('categoryId');
    
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete item (soft delete by setting status to inactive)
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update display order
exports.updateOrder = async (req, res) => {
  try {
    const { orders } = req.body;
    
    // Update each item's display order
    await Promise.all(
      orders.map(({ id, displayOrder }) => 
        MenuItem.findByIdAndUpdate(id, { displayOrder })
      )
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};