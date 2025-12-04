const MenuItem = require('../models/MenuItem');
const MenuItemPrice = require('../models/MenuItemPrice');
const Space = require('../models/Space');

// Helper function to get item with all space prices
const getItemWithPrices = async (itemId) => {
  const item = await MenuItem.findById(itemId).populate('categoryId');

  if (!item) return null;

  const prices = await MenuItemPrice.find({
    menuItemId: itemId,
    status: 'active'
  }).populate('spaceId', 'name');

  // Use basePrice if available, otherwise fall back to price (for existing items)
  const effectivePrice = item.basePrice !== undefined ? item.basePrice : (item.price !== undefined ? item.price : 0);

  return {
    ...item.toObject(),
    price: effectivePrice, // For backward compatibility
    basePrice: effectivePrice, // For new functionality
    spacePrices: prices.map(p => ({
      spaceId: p.spaceId._id,
      spaceName: p.spaceId.name,
      price: p.price
    }))
  };
};

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

// Create new menu item with space-specific prices
exports.createItem = async (req, res) => {
  const session = await MenuItem.startSession();
  session.startTransaction();

  try {
    const { 
      name, 
      description, 
      price, // Legacy field
      basePrice, // New field
      cost, 
      category, // Category name (string)
      categoryId, // Direct categoryId (optional)
      restaurantId,
      image,
      isVeg,
      preparationTime,
      spacePrices // Array of { spaceId, price }
    } = req.body;

    // Find category by name to get categoryId if categoryId not provided
    let finalCategoryId = categoryId;
    if (!finalCategoryId && category) {
      const MenuCategory = require('../models/MenuCategory');
      const categoryDoc = await MenuCategory.findOne({
        name: category, // Exact match including spaces
        restaurantId,
        status: 'active'
      });
      if (categoryDoc) {
        finalCategoryId = categoryDoc._id;
      }
    }

    // Handle backward compatibility: use basePrice if provided, otherwise use price
    const finalBasePrice = basePrice !== undefined ? basePrice : (price !== undefined ? price : 0);
    
    // Validate image URL if provided
    if (image && !validateImageUrl(image)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: 'Invalid image URL. Please provide a valid image URL or upload an image file.' 
      });
    }

    // Validate spacePrices if provided
    if (spacePrices && Array.isArray(spacePrices)) {
      for (const spacePrice of spacePrices) {
        if (!spacePrice.spaceId || typeof spacePrice.price !== 'number' || spacePrice.price < 0) {
          await session.abortTransaction();
          return res.status(400).json({
            error: 'Invalid space price data. Each space price must have spaceId and valid price.'
          });
        }
      }
    }
    
    // Find max display order within category and add 1
    const maxOrder = await MenuItem.findOne({ 
      categoryId: finalCategoryId,
      restaurantId 
    })
    .sort('-displayOrder')
    .select('displayOrder')
    .session(session);
    
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
    
    // Create menu item
    const item = await MenuItem.create([{
      name,
      description,
      price: finalBasePrice, // Keep for backward compatibility
      basePrice: finalBasePrice,
      cost,
      category: category?.trim(), // Keep category name for backward compatibility
      categoryId: finalCategoryId,
      restaurantId,
      image,
      isVeg,
      preparationTime,
      displayOrder
    }], { session });

    const createdItem = item[0];

    // Create space-specific prices if provided
    if (spacePrices && Array.isArray(spacePrices) && spacePrices.length > 0) {
      const priceDocuments = spacePrices.map(spacePrice => ({
        menuItemId: createdItem._id,
        spaceId: spacePrice.spaceId,
        price: spacePrice.price,
        restaurantId
      }));

      await MenuItemPrice.insertMany(priceDocuments, { session });
    }
    
    // Populate category details
    await createdItem.populate('categoryId');

    await session.commitTransaction();

    // Get the item with prices for response
    const itemWithPrices = await getItemWithPrices(createdItem._id);
    
    res.status(201).json(itemWithPrices);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
};

// Get all items for a restaurant with space prices
exports.getItems = async (req, res) => {
  try {
    const { restaurantId, categoryId, spaceId } = req.query;
    
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
      
    // Get space prices for all items
    const itemIds = items.map(item => item._id);
    const prices = await MenuItemPrice.find({
      menuItemId: { $in: itemIds },
      status: 'active',
      ...(spaceId && { spaceId }) // Filter by specific space if requested
    }).populate('spaceId', 'name');

    // Attach prices to items
    const itemsWithPrices = items.map(item => {
      const itemPrices = prices.filter(p => p.menuItemId.toString() === item._id.toString());
      // Use basePrice if available, otherwise fall back to price (for existing items)
      const effectivePrice = item.basePrice !== undefined ? item.basePrice : (item.price !== undefined ? item.price : 0);

      return {
        ...item.toObject(),
        price: effectivePrice, // For backward compatibility
        basePrice: effectivePrice, // For new functionality
        spacePrices: itemPrices.map(p => ({
          spaceId: p.spaceId._id,
          spaceName: p.spaceId.name,
          price: p.price
        }))
      };
    });

    res.json(itemsWithPrices);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update menu item with space-specific prices
exports.updateItem = async (req, res) => {
  const session = await MenuItem.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { image, spacePrices, category, ...updateData } = req.body;
    
    // Validate image URL if provided
    if (image && !validateImageUrl(image)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: 'Invalid image URL. Please provide a valid image URL or upload an image file.' 
      });
    }
    
    // Include image in update data if it's valid
    if (image !== undefined) {
      updateData.image = image;
    }
    
    // Handle category lookup if category name provided
    if (category && !updateData.categoryId) {
      const MenuCategory = require('../models/MenuCategory');
      const categoryDoc = await MenuCategory.findOne({
        name: category, // Exact match
        restaurantId: updateData.restaurantId,
        status: 'active'
      });
      if (categoryDoc) {
        updateData.categoryId = categoryDoc._id;
        updateData.category = category; // Keep category name for backward compatibility
      }
    }

    // Handle backward compatibility for price/basePrice fields
    if (updateData.basePrice !== undefined) {
      updateData.price = updateData.basePrice; // Keep both for compatibility
    } else if (updateData.price !== undefined) {
      updateData.basePrice = updateData.price; // Copy price to basePrice if only price provided
    }

    // Update the menu item
    const item = await MenuItem.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, session }
    ).populate('categoryId');
    
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Handle space-specific prices if provided
    if (spacePrices !== undefined) {
      // Validate spacePrices
      if (Array.isArray(spacePrices)) {
        for (const spacePrice of spacePrices) {
          if (!spacePrice.spaceId || typeof spacePrice.price !== 'number' || spacePrice.price < 0) {
            await session.abortTransaction();
            return res.status(400).json({
              error: 'Invalid space price data. Each space price must have spaceId and valid price.'
            });
          }
        }
      }

      // Remove existing space prices for this item
      await MenuItemPrice.deleteMany({ menuItemId: id }, { session });

      // Create new space prices if provided
      if (Array.isArray(spacePrices) && spacePrices.length > 0) {
        const priceDocuments = spacePrices.map(spacePrice => ({
          menuItemId: id,
          spaceId: spacePrice.spaceId,
          price: spacePrice.price,
          restaurantId: item.restaurantId
        }));

        await MenuItemPrice.insertMany(priceDocuments, { session });
      }
    }

    await session.commitTransaction();

    // Get the updated item with prices for response
    const itemWithPrices = await getItemWithPrices(id);

    res.json(itemWithPrices);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
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

// Get space-specific prices for a menu item
exports.getItemPrices = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { spaceId } = req.query;

    const query = {
      menuItemId: itemId,
      status: 'active'
    };

    if (spaceId) {
      query.spaceId = spaceId;
    }

    const prices = await MenuItemPrice.find(query).populate('spaceId', 'name');

    const formattedPrices = prices.map(price => ({
      spaceId: price.spaceId._id,
      spaceName: price.spaceId.name,
      price: price.price
    }));

    res.json(formattedPrices);
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