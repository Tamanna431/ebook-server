const { betterAuth } = require('better-auth');
const { mongooseAdapter } = require('better-auth/adapters/mongoose');
const mongoose = require('mongoose');

const auth = betterAuth({
  database: mongooseAdapter(mongoose.connection),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/callback/google`,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
      },
      avatar: {
        type: 'string',
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

module.exports = auth;