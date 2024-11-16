const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();
const path = require('path');
// Import Firebase configuration
const { admin, db } = require('./config/firebase-config');

const app = express();
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://www.flexhunt.co', 'https://flexhunt.co']
    : 'http://localhost:5173', // Specifically allow Vite's default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));
app.use((err, req, res, next) => {
  if (err.message === 'CORS Error') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-Origin Request Blocked',
      allowedOrigins: corsOptions.origin
    });
  }
  next(err);
});
// PayPal Configuration
const environment = process.env.NODE_ENV === 'production'
  ? paypal.core.LiveEnvironment
  : paypal.core.SandboxEnvironment;

console.log('PayPal Environment:', process.env.NODE_ENV);

const paypalClient = new paypal.core.PayPalHttpClient(
  new environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    path: req.path
  });
});


// Routes
app.post('/api/create-payment', async (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production'
    ? 'https://www.flexhunt.co'
    : 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  try {
    // Validate auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization token'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(token);

    const { gigId, buyerId, amount, paymentId, title } = req.body;

    // Validate required fields
    if (!gigId || !buyerId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide gigId, buyerId, and amount',
        received: { gigId, buyerId, amount }
      });
    }

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toString()
        },
        description: title ? `Payment for: ${title}` : `Payment for gig ${gigId}`,
        custom_id: `${gigId}_${buyerId}_${Date.now()}`
      }]
    });

    const order = await paypalClient.execute(request);
    console.log('PayPal order created successfully:', order.result);

    res.json({
      orderID: order.result.id,
      status: order.result.status
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      error: 'Error creating payment',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


app.post('/api/capture-payment', async (req, res) => {
  try {
    const { orderID } = req.body;

    // Capture the PayPal order
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const capture = await paypalClient.execute(request);

    if (capture.result.status === 'COMPLETED') {
      // Update payment status in Firestore
      const paymentQuery = await db.collection('payments')
        .where('paypalOrderId', '==', orderID)
        .limit(1)
        .get();

      if (!paymentQuery.empty) {
        const paymentDoc = paymentQuery.docs[0];
        const payment = paymentDoc.data();

        // Set escrow release date to 7 days from now
        const escrowReleaseDate = new Date();
        escrowReleaseDate.setDate(escrowReleaseDate.getDate() + 7);

        await paymentDoc.ref.update({
          status: 'COMPLETED',
          escrowReleaseDate,
          capturedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create order record
        await db.collection('orders').add({
          gigId: payment.gigId,
          buyerId: payment.buyerId,
          sellerId: payment.sellerId,
          amount: payment.amount,
          status: 'IN_PROGRESS',
          paymentId: paymentDoc.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      res.json({ status: 'COMPLETED' });
    } else {
      res.status(400).json({ error: 'Payment capture failed' });
    }

  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({ error: 'Error capturing payment' });
  }
});

// Release funds from escrow
app.post('/api/release-escrow', async (req, res) => {
  try {
    const { paymentId } = req.body;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentDoc.data();
    const now = new Date();
    const escrowReleaseDate = payment.escrowReleaseDate.toDate();

    if (now < escrowReleaseDate) {
      return res.status(400).json({ error: 'Escrow period not completed' });
    }

    await paymentDoc.ref.update({
      status: 'RELEASED',
      releasedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update order status
    const orderQuery = await db.collection('orders')
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();

    if (!orderQuery.empty) {
      await orderQuery.docs[0].ref.update({
        status: 'COMPLETED',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ status: 'SUCCESS' });

  } catch (error) {
    console.error('Error releasing escrow:', error);
    res.status(500).json({ error: 'Error releasing escrow' });
  }
});

// Dispute handling
app.post('/api/dispute-payment', async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await paymentDoc.ref.update({
      isDisputed: true,
      disputeReason: reason,
      disputedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create dispute record
    await db.collection('disputes').add({
      paymentId,
      reason,
      status: 'OPEN',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      buyerId: paymentDoc.data().buyerId,
      sellerId: paymentDoc.data().sellerId
    });

    res.json({ status: 'DISPUTE_CREATED' });

  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ error: 'Error creating dispute' });
  }
});
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
      res.sendFile(path.join(__dirname,  '../frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log('CORS configured for:', 
    Array.isArray(corsOptions.origin) 
      ? corsOptions.origin.join(', ') 
      : corsOptions.origin
  );
});
