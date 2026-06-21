const mongoose = require('mongoose');

const ebookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the ebook'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    genre: {
      type: String,
      required: [true, 'Please select a genre'],
      enum: {
        values: ['Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Horror', 'Biography', 'Self-Help', 'Other'],
        message: 'Please select a valid genre',
      },
    },
    coverImage: {
      type: String,
      default: 'https://via.placeholder.com/300x450?text=No+Cover',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Writer is required'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Ebook = mongoose.model('Ebook', ebookSchema);

module.exports = Ebook;