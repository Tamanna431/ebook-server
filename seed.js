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

    // Get all writer users
    const writers = await User.find({ role: { $in: ['writer', 'admin'] } });

    let writerId;
    if (writers.length > 0) {
      writerId = writers[0]._id;
      console.log('✍️ Using writer:', writers[0].name);
    } else {
      // If no writer exists, use any user
      const anyUser = await User.findOne();
      if (!anyUser) {
        console.log('❌ No users found. Please register a user first.');
        process.exit(1);
      }
      writerId = anyUser._id;
      console.log('👤 Using user as writer:', anyUser.name);
    }

    // Sample ebooks data
    const ebooks = [
      {
        title: 'The Digital Revolution',
        description: 'Explore the fascinating world of digital transformation and how technology is reshaping our future. This comprehensive guide covers AI, blockchain, and cloud computing.',
        price: 25,
        genre: 'Sci-Fi',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 15,
        isAvailable: true,
      },
      {
        title: 'Mystery of the Lost Kingdom',
        description: 'A thrilling adventure through ancient ruins and hidden treasures. Join Detective Sarah as she uncovers secrets that have been buried for centuries.',
        price: 18,
        genre: 'Mystery',
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 23,
        isAvailable: true,
      },
      {
        title: 'Love in Paris',
        description: 'A heartwarming romance novel set in the city of lights. Follow Emma and Jacques as they navigate love, career, and dreams in beautiful Paris.',
        price: 15,
        genre: 'Romance',
        coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 31,
        isAvailable: true,
      },
      {
        title: "The Dragon's Legacy",
        description: 'An epic fantasy tale of dragons, magic, and destiny. Young Alex discovers he is the last dragon rider and must save the kingdom from darkness.',
        price: 22,
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1577493340887-b7bfff550145?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 28,
        isAvailable: true,
      },
      {
        title: 'Haunted Nights',
        description: 'A spine-chilling horror story that will keep you awake at night. The old mansion holds secrets that should never be uncovered.',
        price: 20,
        genre: 'Horror',
        coverImage: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 19,
        isAvailable: true,
      },
      {
        title: 'Success Mindset',
        description: 'Transform your life with proven strategies for success. Learn from industry leaders and develop the mindset of champions.',
        price: 30,
        genre: 'Self-Help',
        coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 42,
        isAvailable: true,
      },
      {
        title: 'The Last Frontier',
        description: 'A gripping sci-fi adventure set in deep space. Captain Maya must lead her crew through uncharted galaxies to find a new home for humanity.',
        price: 27,
        genre: 'Sci-Fi',
        coverImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 35,
        isAvailable: true,
      },
      {
        title: 'Whispers in the Dark',
        description: 'A psychological thriller that blurs the line between reality and illusion. Nothing is what it seems in this twisted tale of deception.',
        price: 16,
        genre: 'Mystery',
        coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 11,
        isAvailable: true,
      },
      {
        title: 'Hearts Entwined',
        description: 'A beautiful story of two souls finding each other against all odds. Set in the countryside of Italy during summer.',
        price: 14,
        genre: 'Romance',
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop',
        writer: writerId,
        status: 'published',
        soldCount: 26,
        isAvailable: true,
      },
    ];

    await Ebook.insertMany(ebooks);
    console.log(`✅ Successfully seeded ${ebooks.length} ebooks!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();