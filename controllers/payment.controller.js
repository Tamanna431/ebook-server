const stripe = require('../config/stripe');
const Ebook = require('../models/Ebook');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Create Stripe Checkout Session for ebook purchase
// @route   POST /api/payments/create-checkout
// @access  Private
const createCheckoutSession = async (req, res) => {
  try {
    const { ebookId } = req.body;

    if (!ebookId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide ebook ID',
      });
    }

    // Find ebook
    const ebook = await Ebook.findById(ebookId).populate('writer');
    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    // Check if already purchased
    const existingTransaction = await Transaction.findOne({
      user: req.user._id,
      ebook: ebookId,
      type: 'purchase',
      status: 'completed',
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'You already own this ebook',
      });
    }

    // Check availability
    if (!ebook.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This ebook is not available for purchase',
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: ebook.title,
              description: ebook.description.substring(0, 200),
              images: [ebook.coverImage],
              metadata: {
                ebookId: ebook._id.toString(),
                writerId: ebook.writer._id.toString(),
              },
            },
            unit_amount: Math.round(ebook.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId: req.user._id.toString(),
        ebookId: ebook._id.toString(),
        writerId: ebook.writer._id.toString(),
      },
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed',
      error: error.message,
    });
  }
};

// @desc    Stripe Webhook - Handle payment success
// @route   POST /api/payments/webhook
// @access  Public (Stripe calls this)
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('💳 Processing checkout.session.completed:', session.id);

    try {
      const { userId, ebookId, writerId } = session.metadata;

      // ✅ Validation - metadata check
      if (!userId || !ebookId) {
        console.warn('⚠️ Missing metadata in session:', session.metadata);
        console.warn('This might be a test event from Stripe CLI');
        return res.status(200).json({ received: true, skipped: true });
      }

      // Create transaction record
      const transaction = await Transaction.create({
        user: userId,
        ebook: ebookId,
        type: 'purchase',
        amount: session.amount_total / 100,
        status: 'completed',
        paymentMethod: 'stripe',
        transactionId: session.id,
        metadata: {
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent,
        },
      });

      // Update ebook sold count
      await Ebook.findByIdAndUpdate(ebookId, {
        $inc: { soldCount: 1 },
      });

      // Add to user's purchased ebooks
      await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedEbooks: ebookId },
      });

      console.log('✅ Payment successful:', transaction._id);
    } catch (error) {
      console.error('❌ Error processing webhook:', error.message);
    }
  }

  res.status(200).json({ received: true });
};
// @desc    Get checkout session details
// @route   GET /api/payments/session/:sessionId
// @access  Private
const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).json({
      success: true,
      data: {
        id: session.id,
        status: session.payment_status,
        amount_total: session.amount_total / 100,
        customer_email: session.customer_email,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve session',
    });
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getSessionDetails,
};