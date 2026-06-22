require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Ebook = require('./models/Ebook');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing ebooks
    await Ebook.deleteMany({});
    console.log('🗑️ Cleared existing ebooks');

    // ✅ সব writer users নিন
    const writers = await User.find({ role: { $in: ['writer', 'admin'] } });

    if (writers.length === 0) {
      console.log('❌ No writers found. Please register a writer first.');
      process.exit(1);
    }

    console.log(`✍️ Found ${writers.length} writers:`);
    writers.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.name} (${w.email})`);
    });

    // Sample ebooks data
    const ebooksData = [
      {
        title: 'The Digital Revolution',
        description: 'Explore the fascinating world of digital transformation and how technology is reshaping our future.',
        price: 25,
        genre: 'Sci-Fi',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop',
        soldCount: 15,
        isAvailable: true,
      },
      {
        title: 'Mystery of the Lost Kingdom',
        description: 'A thrilling adventure through ancient ruins and hidden treasures.',
        price: 18,
        genre: 'Mystery',
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
        soldCount: 23,
        isAvailable: true,
      },
      {
        title: 'Love in Paris',
        description: 'A heartwarming romance novel set in the city of lights.',
        price: 15,
        genre: 'Romance',
        coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=600&fit=crop',
        soldCount: 31,
        isAvailable: true,
      },
      {
        title: "The Dragon's Legacy",
        description: 'An epic fantasy tale of dragons, magic, and destiny.',
        price: 22,
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1577493340887-b7bfff550145?w=400&h=600&fit=crop',
        soldCount: 28,
        isAvailable: true,
      },
      {
        title: 'Haunted Nights',
        description: 'A spine-chilling horror story that will keep you awake at night.',
        price: 20,
        genre: 'Horror',
        coverImage: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop',
        soldCount: 19,
        isAvailable: true,
      },
      {
        title: 'Success Mindset',
        description: 'Transform your life with proven strategies for success.',
        price: 30,
        genre: 'Self-Help',
        coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=600&fit=crop',
        soldCount: 42,
        isAvailable: true,
      },
      {
        title: 'The Last Frontier',
        description: 'A gripping sci-fi adventure set in deep space.',
        price: 27,
        genre: 'Sci-Fi',
        coverImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop',
        soldCount: 35,
        isAvailable: true,
      },
      {
        title: 'Whispers in the Dark',
        description: 'A psychological thriller that blurs the line between reality and illusion.',
        price: 16,
        genre: 'Mystery',
        coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
        soldCount: 11,
        isAvailable: true,
      },
      {
        title: 'Hearts Entwined',
        description: 'A beautiful story of two souls finding each other against all odds.',
        price: 14,
        genre: 'Romance',
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop',
        soldCount: 26,
        isAvailable: true,
      },
    ];

    // ✅ প্রতিটি ebook কে different writer assign করুন
    const ebooks = ebooksData.map((ebook, index) => {
      // Writers এর মধ্যে cycle করুন
      const writerIndex = index % writers.length;
      return {
        ...ebook,
        writer: writers[writerIndex]._id,
        status: 'published',
      };
    });

    await Ebook.insertMany(ebooks);
    console.log(`✅ Successfully seeded ${ebooks.length} ebooks!`);
    
    // ✅ প্রতিটি writer কতটি ebook পেয়েছে দেখান
    writers.forEach(writer => {
      const count = ebooks.filter(e => e.writer.toString() === writer._id.toString()).length;
      console.log(`  📚 ${writer.name}: ${count} ebooks`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();