const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const MenuCategory = require('./models/MenuCategory');
const MenuItem = require('./models/MenuItem');

dotenv.config();

const restaurantId = '69143980d96f9680158c601e';

const menuData = {
  "Fried": [
    { "item": "फ्रेंच फ्राईस (French Fries)", "price": 120 },
    { "item": "चना रोस्ट (Chana Roast)", "price": 80 },
    { "item": "पनीर चाट (Paneer Chaat)", "price": 150 },
    { "item": "वेग पकोड़ा (Veg Pakoda)", "price": 120 },
    { "item": "मिक्स पकोड़ा (Mix Pakoda)", "price": 130 },
    { "item": "पनीर पकोड़ा (Paneer Pakoda)", "price": 180 }
  ],
  "Sizzler/Noodles": [
    { "item": "देव स्पेशल सिजलर (Dev Special Sizzler)", "price": 400 },
    { "item": "बाबरियन सिजलर (Bavarian Sizzler)", "price": 320 },
    { "item": "वैज सिजलर (Veg Sizzler)", "price": 320 },
    { "item": "देव स्पेशल नूडल्स (Dev Special Noodles)", "price": 200 },
    { "item": "वैज मसाला नूडल्स (Veg Masala Noodles)", "price": 150 },
    { "item": "हक्का नूडल्स (Hakka Noodles)", "price": 130 }
  ],
  "Meggi": [
    { "item": "मसाला मैगी (Masala Maggi)", "price": 100 },
    { "item": "पनीर मैगी (Paneer Maggi)", "price": 150 },
    { "item": "चीज मैगी (Cheese Maggi)", "price": 150 }
  ],
  "Chinese": [
    { "item": "वैज कटलेट (Veg Cutlet)", "price": 100 },
    { "item": "वैज मंचूरियन ड्राई/ग्रेवी (Veg Manchurian Dry/Gravy)", "price": 180 },
    { "item": "मंचूरियन विद हक्का नूडल्स (Manchurian with Hakka Noodles)", "price": 200 },
    { "item": "पनीर मंचूरियन ड्राई/ग्रेवी (Paneer Manchurian Dry/Gravy)", "price": 200 },
    { "item": "वैज लोलिपॉप (Veg Lollipop)", "price": 160 },
    { "item": "क्रिस्पी कॉर्न (Crispy Corn)", "price": 180 },
    { "item": "चाइनीज प्लेटर (Chinese Platter)", "price": 300 },
    { "item": "चिली पोटेटो (Chilli Potato)", "price": 150 },
    { "item": "पनीर 65 (Paneer 65)", "price": 250 }
  ],
  "Tandoori Snaks": [
    { "item": "पनीर टिक्का ड्राई (Paneer Tikka Dry)", "price": 250 },
    { "item": "पनीर अफगानी टिक्का (Paneer Afghani Tikka)", "price": 280 },
    { "item": "पनीर मलाई टिक्का (Paneer Malai Tikka)", "price": 280 },
    { "item": "हरा-भरा कबाब (Hara Bhara Kabab)", "price": 180 }
  ],
  "Salad": [
    { "item": "चीन सलाद (Chinese Salad)", "price": 50 },
    { "item": "पंजाबी सलाद (Punjabi Salad)", "price": 70 },
    { "item": "कुब्बर सलाद (Cucumber Salad)", "price": 80 },
    { "item": "स्पेशल सलाद (Special Salad)", "price": 100 }
  ],
  "Papad": [
    { "item": "मसाला पापड़ फ्राई (Masala Papad Fry)", "price": 30 },
    { "item": "रोस्ट & फ्राई पापड़ (Roast & Fry Papad)", "price": 30 },
    { "item": "बटर मसाला पापड़ (Butter Masala Papad)", "price": 50 },
    { "item": "पापड़ चूरी (Papad Churi)", "price": 30 }
  ],
  "Soup": [
    { "item": "टोमेटो सूप (Tomato Soup)", "price": 100 },
    { "item": "मनचाउ सूप (Manchow Soup)", "price": 120 },
    { "item": "हॉट एंड सौर सूप (Hot & Sour Soup)", "price": 130 }
  ],
  "Panner": [
    { "item": "देव धणी स्पेशल (Dev Dhani Special)", "price": 350 },
    { "item": "पालक पनीर (Palak Paneer)", "price": 160 },
    { "item": "मटर पनीर (Matar Paneer)", "price": 160 },
    { "item": "शाही पनीर (Shahi Paneer)", "price": 180 },
    { "item": "बटर पनीर मसाला (Butter Paneer Masala)", "price": 200 },
    { "item": "कड़ाई पनीर (Kadai Paneer)", "price": 200 },
    { "item": "पनीर हांडी (Paneer Handi)", "price": 200 },
    { "item": "पनीर पंजाबी (Paneer Punjabi)", "price": 220 },
    { "item": "पनीर चटपटा (Paneer Chatpata)", "price": 220 },
    { "item": "पनीर मखमली मसाला (Paneer Makhamali Masala)", "price": 230 },
    { "item": "नवरतन पनीर (Navratan Paneer)", "price": 230 },
    { "item": "बटर पनीर मसाला (Butter Paneer Masala)", "price": 230 },
    { "item": "पनीर परवेज (Paneer Parvez)", "price": 250 },
    { "item": "पनीर अरवाजी (Paneer Arvazi)", "price": 250 },
    { "item": "पनीर अमर (Paneer Amar)", "price": 250 },
    { "item": "पनीर कोल्हापुरी (Paneer Kolhapuri)", "price": 260 },
    { "item": "पनीर टिक्का मसाला (Paneer Tikka Masala)", "price": 280 },
    { "item": "पनीर लबाबदार (Paneer Lababdar)", "price": 300 },
    { "item": "पनीर राजस्थानी (Paneer Rajasthani)", "price": 300 }
  ]
};

async function addMenuData() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Convert restaurantId to ObjectId
    const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);

    // Get existing categories count for display order
    const existingCategories = await MenuCategory.find({ restaurantId: restaurantObjectId });
    let displayOrder = existingCategories.length;

    const categoryMap = {};

    // Create categories first
    console.log('\nCreating categories...');
    for (const [categoryName, items] of Object.entries(menuData)) {
      // Check if category already exists
      let category = await MenuCategory.findOne({ 
        name: categoryName, 
        restaurantId: restaurantObjectId 
      });

      if (!category) {
        category = await MenuCategory.create({
          name: categoryName,
          description: `${categoryName} items`,
          restaurantId: restaurantObjectId,
          displayOrder: displayOrder++,
          status: 'active'
        });
        console.log(`✓ Created category: ${categoryName}`);
      } else {
        console.log(`→ Category already exists: ${categoryName}`);
      }

      categoryMap[categoryName] = category._id;
    }

    // Create menu items
    console.log('\nCreating menu items...');
    let totalItems = 0;
    let createdItems = 0;
    let skippedItems = 0;

    for (const [categoryName, items] of Object.entries(menuData)) {
      const categoryId = categoryMap[categoryName];
      
      console.log(`\nProcessing category: ${categoryName} (${items.length} items)`);
      
      for (const menuItem of items) {
        totalItems++;
        
        // Check if item already exists
        const existingItem = await MenuItem.findOne({
          name: menuItem.item,
          restaurantId: restaurantObjectId,
          categoryId: categoryId
        });

        if (existingItem) {
          console.log(`  → Skipped (exists): ${menuItem.item}`);
          skippedItems++;
          continue;
        }

        // Get max display order for this category
        const maxOrder = await MenuItem.findOne({ 
          categoryId: categoryId,
          restaurantId: restaurantObjectId 
        }).sort('-displayOrder').select('displayOrder');
        
        const itemDisplayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

        await MenuItem.create({
          name: menuItem.item,
          description: '',
          price: menuItem.price,
          categoryId: categoryId,
          category: categoryName, // Legacy field
          restaurantId: restaurantObjectId,
          isVeg: true,
          isAvailable: true,
          preparationTime: 15,
          spiceLevel: 1,
          displayOrder: itemDisplayOrder,
          status: 'active'
        });

        console.log(`  ✓ Created: ${menuItem.item} - ₹${menuItem.price}`);
        createdItems++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Summary:');
    console.log(`  Total items processed: ${totalItems}`);
    console.log(`  Items created: ${createdItems}`);
    console.log(`  Items skipped (already exist): ${skippedItems}`);
    console.log(`  Categories: ${Object.keys(menuData).length}`);
    console.log('='.repeat(50));
    console.log('\n✓ Menu data added successfully!');

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error adding menu data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
addMenuData();

