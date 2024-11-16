const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();
const path = require('path');
// Import Firebase configuration
const { admin, db } = require('./config/firebase-config');

const app = express();
const allowedOrigins = [
  'https://flexhunt.onrender.com',
  'https://www.flexhunt.co',
  'https://flexhunt.co',
  'http://localhost:5173'
];

// Enhanced CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,  // Important: Prevent preflight from being passed down
  optionsSuccessStatus: 204  // Some legacy browsers (IE11, various SmartTVs) choke on 204
};


app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));
const initializePayPalClient = () => {
  try {
    const environment = process.env.NODE_ENV === 'production'
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );

    return new paypal.core.PayPalHttpClient(environment);
  } catch (error) {
    console.error('PayPal client initialization error:', error);
    throw new Error('Failed to initialize PayPal client');
  }
};

const paypalClient = initializePayPalClient();

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-Origin Request Blocked',
      allowedOrigins: corsOptions.origin
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Enhanced create payment endpoint
app.post('/api/create-payment', async (req, res) => {
  console.log('Create payment request received:', {
    body: req.body,
    headers: {
      origin: req.headers.origin,
      'content-type': req.headers['content-type']
    }
  });

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
    const decodedToken = await admin.auth().verifyIdToken(token);

    const { gigId, buyerId, amount, paymentId, title } = req.body;

    // Enhanced validation
    if (!gigId || !buyerId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide gigId, buyerId, and amount',
        received: { gigId, buyerId, amount }
      });
    }

    // Create PayPal order with error handling
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
    console.log('PayPal order created:', {
      id: order.result.id,
      status: order.result.status
    });

    // Update payment document with PayPal order ID
    await db.collection('payments').doc(paymentId).update({
      paypalOrderId: order.result.id,
      status: 'PENDING',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      orderID: order.result.id,
      status: order.result.status
    });

  } catch (error) {
    console.error('Payment creation error:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Error creating payment',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced capture payment endpoint
app.post('/api/capture-payment', async (req, res) => {
  console.log('Capture payment request received:', {
    orderID: req.body.orderID
  });

  try {
    const { orderID } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const capture = await paypalClient.execute(request);

    console.log('Payment capture response:', {
      status: capture.result.status,
      id: capture.result.id
    });

    if (capture.result.status === 'COMPLETED') {
      const batch = db.batch();
      
      const paymentQuery = await db.collection('payments')
        .where('paypalOrderId', '==', orderID)
        .limit(1)
        .get();

      if (!paymentQuery.empty) {
        const paymentDoc = paymentQuery.docs[0];
        const payment = paymentDoc.data();

        const escrowReleaseDate = new Date();
        escrowReleaseDate.setDate(escrowReleaseDate.getDate() + 7);

        // Update payment
        batch.update(paymentDoc.ref, {
          status: 'COMPLETED',
          escrowReleaseDate,
          capturedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create order
        const orderRef = db.collection('orders').doc();
        batch.set(orderRef, {
          gigId: payment.gigId,
          buyerId: payment.buyerId,
          sellerId: payment.sellerId,
          amount: payment.amount,
          status: 'IN_PROGRESS',
          paymentId: paymentDoc.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();
      }

      res.json({ 
        status: 'COMPLETED',
        captureId: capture.result.purchase_units[0].payments.captures[0].id
      });
    } else {
      res.status(400).json({ 
        error: 'Payment capture failed',
        status: capture.result.status
      });
    }

  } catch (error) {
    console.error('Error capturing payment:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Error capturing payment',
      message: error.message,
      timestamp: new Date().toISOString()
    });
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
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-Origin Request Blocked',
      allowedOrigins
    });
  }
  
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
