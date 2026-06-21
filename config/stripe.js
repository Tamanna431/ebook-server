const Stripe = require('stripe');

// 💡 apiVersion ফিল্ডটি পুরোপুরি বাদ দেওয়া হলো। 
// এর ফলে স্ট্রাইপ আপনার ইনস্টল করা প্যাকেজের ডিফল্ট ও সবচেয়ে মানানসই ভার্সনটি নিজে থেকেই নিয়ে নেবে।
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;