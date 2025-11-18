const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const MenuCategory = require('./models/MenuCategory');
const MenuItem = require('./models/MenuItem');

dotenv.config();

const restaurantId = '69143980d96f9680158c601e';

const menuData = {
  "Taza Veg": [
    { "item": "प्लेन पालक (Plain Palak)", "price": 130 },
    { "item": "आलू जीरा (Aloo Jeera)", "price": 130 },
    { "item": "आलू मटर (Aloo Matar)", "price": 150 },
    { "item": "भिंडी फ्राई (Bhindi Fry)", "price": 150 },
    { "item": "भिंडी मसाला (Bhindi Masala)", "price": 150 },
    { "item": "भिंडी कुरकुरी (Bhindi Kurkuri)", "price": 150 },
    { "item": "चना मसाला (Chana Masala)", "price": 150 },
    { "item": "वैज प्लाटर (Veg Platter)", "price": 150 },
    { "item": "सेव मसाला (Sev Masala)", "price": 150 },
    { "item": "देव मिक्स (Dev Mix)", "price": 180 },
    { "item": "देव जयपुरी (Dev Jaipuri)", "price": 180 },
    { "item": "मैथी मलाई मटर (Methi Malai Matar)", "price": 200 },
    { "item": "भिंडी बटर मसाला (Bhindi Butter Masala)", "price": 200 },
    { "item": "सेव मटर (Sev Matar)", "price": 200 },
    { "item": "गवार मटर (Gawar Matar)", "price": 200 },
    { "item": "नवरतन ग्रेवी (Navratan Gravy)", "price": 200 },
    { "item": "वैज कोल्हापुरी (Veg Kolhapuri)", "price": 200 }
  ],
  "Kofte Ka Kamal": [
    { "item": "वैज कोफ़्ता (Veg Kofta)", "price": 170 },
    { "item": "मलाइ कोफ़्ता (Malai Kofta)", "price": 180 },
    { "item": "काजू कोफ़्ता (Kaju Kofta)", "price": 220 },
    { "item": "देव आलू (Dev Aloo)", "price": 180 },
    { "item": "कशमीरी दम आलू (Kashmiri Dum Aloo)", "price": 200 }
  ],
  "Kaju Ka Kamal": [
    { "item": "काजू पनीर (Kaju Paneer)", "price": 240 },
    { "item": "काजू शिंघामपुरी (Kaju Shinghampuri)", "price": 250 },
    { "item": "काजू करी (Kaju Curry)", "price": 220 },
    { "item": "काजू मसाला (Kaju Masala)", "price": 220 }
  ],
  "Dal Mastani": [
    { "item": "दाल फ्राई (Dal Fry)", "price": 120 },
    { "item": "दाल तड़का (Dal Tadka)", "price": 140 },
    { "item": "दाल मखनी (Dal Makhani)", "price": 160 },
    { "item": "दाल बटर तड़का (Dal Butter Tadka)", "price": 160 },
    { "item": "दाल लहसुनिया (Dal Lahsuniya)", "price": 180 },
    { "item": "दाल अरहर (Dal Arhar)", "price": 180 },
    { "item": "दाल गुजराती (Dal Gujarati)", "price": 150 },
    { "item": "दाल मिक्स दिल्ली (Dal Mix Delhi)", "price": 150 },
    { "item": "दाल जीरा (Dal Jeera)", "price": 130 }
  ],
  "Tandoori Bread": [
    { "item": "तवा रोटी प्लेन (Tawa Roti Plain)", "price": 15 },
    { "item": "तवा रोटी बटर (Tawa Roti Butter)", "price": 20 },
    { "item": "तंदूरी रोटी प्लेन (Tandoori Roti Plain)", "price": 12 },
    { "item": "तंदूरी रोटी बटर (Tandoori Roti Butter)", "price": 15 },
    { "item": "लच्छा पराठा (Lachha Paratha)", "price": 30 },
    { "item": "गर्लिक नान (Garlic Naan)", "price": 60 },
    { "item": "बटर नान (Butter Naan)", "price": 70 },
    { "item": "चीज गार्लिक नान (Cheese Garlic Naan)", "price": 80 },
    { "item": "स्टफ नान (Stuffed Naan)", "price": 70 },
    { "item": "गोभी पराठा (Gobhi Paratha)", "price": 40 },
    { "item": "आलू पराठा (Aloo Paratha)", "price": 40 },
    { "item": "मूली पराठा (Mooli Paratha)", "price": 40 },
    { "item": "पनीर पराठा (Paneer Paratha)", "price": 60 },
    { "item": "कश्मीरी नान (Kashmiri Naan)", "price": 80 },
    { "item": "बास्केट ऑफ रोटीज (Basket of Rotis)", "price": 200 },
    { "item": "मिस्सी रोटी (Missi Roti)", "price": 25 },
    { "item": "पनीर कुल्चा (Paneer Kulcha)", "price": 60 },
    { "item": "बाजरा रोटी (Bajra Roti)", "price": 30 },
    { "item": "बटर कुल्चा (Butter Kulcha)", "price": 40 }
  ],
  "Rice": [
    { "item": "प्लेन राइस (Plain Rice)", "price": 80 },
    { "item": "जीरा राइस (Jeera Rice)", "price": 100 },
    { "item": "मटर पुलाव (Matar Pulao)", "price": 150 },
    { "item": "बटर खिचड़ी (Butter Khichdi)", "price": 100 },
    { "item": "कशमीरी पुलाव (Kashmiri Pulao)", "price": 150 },
    { "item": "पंजाबी खिचड़ी (Punjabi Khichdi)", "price": 180 },
    { "item": "वैज बिरयानी (Veg Biryani)", "price": 150 },
    { "item": "हैदराबादी बिरयानी (Hyderabadi Biryani)", "price": 150 },
    { "item": "मसाला राइस (Masala Rice)", "price": 130 }
  ],
  "Raita": [
    { "item": "प्लेन दही (Plain Dahi)", "price": 80 },
    { "item": "वैज रायता (Veg Raita)", "price": 100 },
    { "item": "बूंदी रायता (Boondi Raita)", "price": 100 },
    { "item": "पाइनएप्पल रायता (Pineapple Raita)", "price": 130 },
    { "item": "फ्रूट रायता (Fruit Raita)", "price": 150 },
    { "item": "छाछ (Chaas)", "price": 50 },
    { "item": "लस्सी (Lassi)", "price": 50 }
  ],
  "Kuch Mittha Ho Jai": [
    { "item": "रस मलाई (Ras Malai)", "price": 40 },
    { "item": "गाजर हलवा (Gajar Halwa)", "price": 40 }
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

