const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Ebook = require('../models/Ebook');
const Transaction = require('../models/Transaction');

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout
// @access  Private
// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout
// @access  Private
const createCheckoutSession = async (req, res) => {
  try {
    const { ebookId } = req.body;
    const userId = req.user._id;

    console.log('🛒 Creating checkout session for ebook:', ebookId);
    console.log('👤 User:', userId);

    // ✅ Ebook find করুন with writer populate
    const ebook = await Ebook.findById(ebookId).populate('writer', 'name email');
    
    // ✅ Null check
    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    // ✅ Writer check - যদি writer না থাকে
    if (!ebook.writer) {
      console.error('❌ Ebook has no writer:', ebook._id);
      return res.status(400).json({
        success: false,
        message: 'This ebook has no writer assigned. Please contact support.',
      });
    }

    // ✅ Check if user is the writer (writer নিজের বই কিনতে পারবে না)
    if (ebook.writer._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot purchase your own ebook',
      });
    }

    // Check if user already purchased
    const existingPurchase = await Transaction.findOne({
      user: userId,
      ebook: ebookId,
      status: 'completed',
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: 'You already purchased this ebook',
      });
    }

    // ✅ Check if ebook is available
    if (!ebook.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This ebook is not available for purchase',
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: ebook.title,
              description: ebook.description?.substring(0, 100) || 'Digital Ebook',
              images: ebook.coverImage ? [ebook.coverImage] : [],
            },
            unit_amount: Math.round(ebook.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/ebooks/${ebookId}?canceled=true`,
      metadata: {
        ebookId: ebookId.toString(),
        userId: userId.toString(),
        writerId: ebook.writer._id.toString(),  // ✅ এখন নিরাপদ
      },
      customer_email: req.user.email,
    });

    console.log('✅ Checkout session created:', session.id);

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Create checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message,
    });
  }
};
// @desc    Verify payment and complete transaction (NO WEBHOOK NEEDED)
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;

    console.log('🔍 Verifying payment session:', sessionId);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID required',
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('📋 Session status:', session.payment_status);
    console.log('📋 Session metadata:', session.metadata);

    // Check if payment is actually completed
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
      });
    }

    // Check if user matches (security)
    if (session.metadata.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check if transaction already exists (idempotent)
    const existingTransaction = await Transaction.findOne({
      transactionId: sessionId,
    });

    if (existingTransaction) {
      console.log('✅ Transaction already exists:', existingTransaction._id);
      return res.status(200).json({
        success: true,
        message: 'Transaction already recorded',
        data: existingTransaction,
      });
    }

    const { ebookId, writerId } = session.metadata;
    const amount = session.amount_total / 100;

    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      ebook: ebookId,
      writer: writerId,
      type: 'purchase',
      amount: amount,
      status: 'completed',
      paymentMethod: 'stripe',
      transactionId: sessionId,
      metadata: {
        stripeSessionId: sessionId,
        paymentIntentId: session.payment_intent,
        customerEmail: session.customer_email,
      },
    });

    // Update ebook sold count
    await Ebook.findByIdAndUpdate(ebookId, {
      $inc: { soldCount: 1 },
    });

    // Update writer earnings
    const Writer = require('../models/Writer');
    await Writer.findOneAndUpdate(
      { user: writerId },
      { $inc: { totalEarnings: amount } }
    );

    console.log('✅ Transaction created successfully:', transaction._id);
    console.log('✅ Ebook sold count updated');
    console.log('✅ Writer earnings updated');

    res.status(200).json({
      success: true,
      message: 'Payment verified and transaction completed',
      data: transaction,
    });
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

// @desc    Check if user has purchased an ebook
// @route   GET /api/payments/check/:ebookId
// @access  Private
const checkPurchase = async (req, res) => {
  try {
    const { ebookId } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({
      user: userId,
      ebook: ebookId,
      status: 'completed',
    });

    res.status(200).json({
      success: true,
      purchased: !!transaction,
      transaction: transaction || null,
    });
  } catch (error) {
    console.error('❌ Check purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check purchase',
      error: error.message,
    });
  }
};
// @desc    Get writer's sales history
// @route   GET /api/payments/writer-sales
// @access  Private (Writer)
const getWriterSales = async (req, res) => {
  try {
    const writerId = req.user._id;

    console.log('📊 Fetching sales for writer:', writerId);

    // Find all completed transactions where writer is current user
    const sales = await Transaction.find({
      writer: writerId,
      status: 'completed',
    })
      .populate('user', 'name email')  // Buyer info
      .populate('ebook', 'title price coverImage')  // Ebook info
      .sort({ createdAt: -1 });

    // Calculate total earnings
    const totalEarnings = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalSales = sales.length;

    console.log('✅ Sales fetched:', sales.length, 'transactions');
    console.log('💰 Total earnings:', totalEarnings);

    res.status(200).json({
      success: true,
      data: sales,
      stats: {
        totalEarnings,
        totalSales,
      },
    });
  } catch (error) {
    console.error('❌ Get writer sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales history',
      error: error.message,
    });
  }
};
module.exports = {
  createCheckoutSession,
  verifyPayment,
  checkPurchase,
  getWriterSales,
};