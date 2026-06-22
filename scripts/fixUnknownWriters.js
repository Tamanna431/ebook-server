require('dotenv').config();
const mongoose = require('mongoose');
const Ebook = require('../models/Ebook');
const User = require('../models/User');

const fixUnknownWriters = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Writer role এর user খুঁজুন
    const writer = await User.findOne({ role: 'writer' });
    
    if (!writer) {
      console.error('❌ No writer found in database');
      console.log('💡 Please create a writer account first');
      process.exit(1);
    }

    console.log('👤 Using writer:', writer.email);
    console.log('📝 Writer ID:', writer._id);

    // সব ebook খুঁজুন যেগুলোতে writer নেই বা null
    const ebooksToUpdate = await Ebook.find({
      $or: [
        { writer: null },
        { writer: { $exists: false } }
      ]
    });

    console.log(`\n📚 Found ${ebooksToUpdate.length} ebooks without writer\n`);

    if (ebooksToUpdate.length === 0) {
      console.log('✅ All ebooks already have writers!');
      process.exit(0);
    }

    // সব ebook এ writer যোগ করুন
    for (const ebook of ebooksToUpdate) {
      console.log(`📖 Updating: "${ebook.title}"`);
      ebook.writer = writer._id;
      await ebook.save();
      console.log(`   ✅ Fixed: ${ebook.title}\n`);
    }

    console.log('✅ All ebooks fixed successfully!');
    console.log(`\n💡 Total fixed: ${ebooksToUpdate.length} ebooks`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

fixUnknownWriters();