const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Contract = require('../models/Contract.cjs');
const Notification = require('../models/Notification.cjs');

const createPaymentIntent = async ({ amount, currency = 'usd', description, metadata }) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    throw new Error('Failed to create payment intent');
  }
};

const createCheckoutSession = async ({ amount, currency = 'usd', description, metadata, successUrl, cancelUrl }) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return session;
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    throw new Error('Failed to create checkout session');
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    case 'checkout.session.completed':
      await handleCheckoutSuccess(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const contractId = paymentIntent.metadata.contractId;
    const contract = await Contract.findById(contractId)
      .populate('freelancerId', 'name')
      .populate('jobId', 'title');

    if (contract) {
      contract.paymentStatus = 'paid';
      await contract.save();

      // Create notification for freelancer
      const notification = new Notification({
        userId: contract.freelancerId._id,
        type: 'payment',
        title: 'Payment Received',
        message: `Payment of $${contract.amount} received for "${contract.jobId.title}"`,
        data: {
          contractId: contract._id,
          amount: contract.amount
        },
        actionUrl: `/contract/${contract.jobId._id}`
      });

      await notification.save();
    }
  } catch (error) {
    console.error('Handle payment success error:', error);
  }
};

const handlePaymentFailure = async (paymentIntent) => {
  try {
    const contractId = paymentIntent.metadata.contractId;
    const contract = await Contract.findById(contractId)
      .populate('clientId', 'name')
      .populate('jobId', 'title');

    if (contract) {
      contract.paymentStatus = 'failed';
      await contract.save();

      // Create notification for client
      const notification = new Notification({
        userId: contract.clientId._id,
        type: 'payment',
        title: 'Payment Failed',
        message: `Payment failed for "${contract.jobId.title}". Please try again.`,
        data: {
          contractId: contract._id,
          amount: contract.amount
        },
        actionUrl: `/contract/${contract.jobId._id}`
      });

      await notification.save();
    }
  } catch (error) {
    console.error('Handle payment failure error:', error);
  }
};

const handleCheckoutSuccess = async (session) => {
  try {
    const contractId = session.metadata.contractId;
    const contract = await Contract.findById(contractId);

    if (contract) {
      contract.paymentStatus = 'paid';
      contract.stripeSessionId = session.id;
      await contract.save();
    }
  } catch (error) {
    console.error('Handle checkout success error:', error);
  }
};

module.exports = {
  createPaymentIntent,
  createCheckoutSession,
  handleWebhook
};