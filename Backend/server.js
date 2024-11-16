const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');
const { admin, db } = require('./config/firebase-config');
require('dotenv').config();
const path = require('path');

// Constants
const ESCROW_HOLD_DAYS = 7;
const DISPUTE_WINDOW_DAYS = 14;
const PORT = process.env.PORT || 5000;

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'https://flexhunt.onrender.com',
    'https://www.flexhunt.co',
    'https://flexhunt.co',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const calculateEscrowReleaseDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + ESCROW_HOLD_DAYS);
  return date;
};



// PayPal Client Initialization
const initializePayPalClient = () => {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials are not configured');
    }
    
    const environment = process.env.NODE_ENV === 'production'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    
    return new paypal.core.PayPalHttpClient(environment);
  } catch (error) {
    console.error('PayPal client initialization error:', error);
    throw new Error('Failed to initialize PayPal client');
  }
};

// Auth Middleware with improved error handling
const validateFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        error: 'Unauthorized',
        message: 'Missing or invalid authorization token'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      status: 'error',
      error: 'Authentication failed',
      message: error.message
    });
  }
};

// Initialize PayPal Client
const paypalClient = initializePayPalClient();

// Routes
app.post('/api/create-payment', validateFirebaseToken, async (req, res) => {
  try {
    const { gigId, amount, title, buyerId, sellerId } = req.body;

    // Input validation
    if (!gigId || !amount || !buyerId || !sellerId) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields',
        required: ['gigId', 'amount', 'buyerId', 'sellerId']
      });
    }

    // Create payment record
    const paymentRef = await db.collection('payments').add({
      gigId,
      amount: parseFloat(amount),
      buyerId,
      sellerId,
      status: 'PENDING',
      title: title || `Payment for gig ${gigId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      currency: 'USD',
      escrowReleaseDate: calculateEscrowReleaseDate(),
      isDisputed: false,
      platform: 'PAYPAL'
    });

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
        description: title,
        custom_id: `${gigId}_${paymentRef.id}`
      }],
      application_context: {
        brand_name: 'FlexHunt',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL || 'https://www.flexhunt.co'}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://www.flexhunt.co'}/payment/cancel`
      }
    });

    const order = await paypalClient.execute(request);
    
    if (!order || !order.result) {
      throw new Error('Failed to create PayPal order');
    }

    // Update payment record with PayPal order ID
    await paymentRef.update({ 
      paypalOrderId: order.result.id 
    });

    // Send response
    return res.status(200).json({
      status: 'success',
      orderID: order.result.id,
      paymentId: paymentRef.id
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    
    return res.status(500).json({
      status: 'error',
      error: 'Failed to create payment',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/capture-payment', validateFirebaseToken, async (req, res) => {
  try {
    const { orderID } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const capture = await paypalClient.execute(request);

    if (capture.result.status === 'COMPLETED') {
      const batch = db.batch();
      
      const paymentQuery = await db.collection('payments')
        .where('paypalOrderId', '==', orderID)
        .limit(1)
        .get();

      if (paymentQuery.empty) {
        throw new Error('Payment record not found');
      }

      const paymentDoc = paymentQuery.docs[0];
      const payment = paymentDoc.data();

      // Update payment status
      batch.update(paymentDoc.ref, {
        status: 'IN_ESCROW',
        capturedAt: admin.firestore.FieldValue.serverTimestamp(),
        escrowReleaseDate: calculateEscrowReleaseDate(),
        paypalCaptureId: capture.result.purchase_units[0].payments.captures[0].id
      });

      // Create order record
      const orderRef = db.collection('orders').doc();
      batch.set(orderRef, {
        gigId: payment.gigId,
        paymentId: paymentDoc.id,
        buyerId: payment.buyerId,
        sellerId: payment.sellerId,
        amount: payment.amount,
        status: 'IN_PROGRESS',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        title: payment.title
      });

      await batch.commit();

      res.json({
        success: true,
        status: 'COMPLETED',
        paymentId: paymentDoc.id,
        orderId: orderRef.id
      });
    } else {
      throw new Error(`Payment capture failed: ${capture.result.status}`);
    }

  } catch (error) {
    console.error('Payment capture error:', error);
    res.status(500).json({
      error: 'Failed to capture payment',
      message: error.message
    });
  }
});

app.post('/api/release-escrow', validateFirebaseToken, async (req, res) => {
  try {
    const { paymentId } = req.body;
    const paymentRef = db.collection('payments').doc(paymentId);
    
    const payment = await paymentRef.get();
    if (!payment.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = payment.data();
    
    // Validation checks
    if (paymentData.status !== 'IN_ESCROW') {
      return res.status(400).json({ error: 'Payment is not in escrow' });
    }

    const now = new Date();
    const escrowReleaseDate = paymentData.escrowReleaseDate.toDate();
    
    if (now < escrowReleaseDate) {
      return res.status(400).json({
        error: 'Escrow period not completed',
        releaseDate: escrowReleaseDate
      });
    }

    if (paymentData.isDisputed) {
      return res.status(400).json({ error: 'Payment is under dispute' });
    }

    // Release funds
    const batch = db.batch();

    batch.update(paymentRef, {
      status: 'COMPLETED',
      releasedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const orderQuery = await db.collection('orders')
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();

    if (!orderQuery.empty) {
      batch.update(orderQuery.docs[0].ref, {
        status: 'COMPLETED',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    res.json({
      success: true,
      status: 'RELEASED',
      paymentId
    });

  } catch (error) {
    console.error('Escrow release error:', error);
    res.status(500).json({
      error: 'Failed to release escrow',
      message: error.message
    });
  }
});

app.post('/api/create-dispute', validateFirebaseToken, async (req, res) => {
  try {
    const { paymentId, reason, evidence } = req.body;
    const userId = req.user.uid;

    const paymentRef = db.collection('payments').doc(paymentId);
    const payment = await paymentRef.get();

    if (!payment.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = payment.data();

    // Verify dispute eligibility
    const now = new Date();
    const disputeWindowEnd = new Date(paymentData.capturedAt.toDate());
    disputeWindowEnd.setDate(disputeWindowEnd.getDate() + DISPUTE_WINDOW_DAYS);

    if (now > disputeWindowEnd) {
      return res.status(400).json({ error: 'Dispute window has expired' });
    }

    if (userId !== paymentData.buyerId && userId !== paymentData.sellerId) {
      return res.status(403).json({ error: 'Unauthorized to create dispute' });
    }

    const batch = db.batch();

    // Create dispute record
    const disputeRef = db.collection('disputes').doc();
    batch.set(disputeRef, {
      paymentId,
      createdBy: userId,
      reason,
      evidence: evidence || [],
      status: 'OPEN',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      buyerId: paymentData.buyerId,
      sellerId: paymentData.sellerId,
      amount: paymentData.amount
    });

    // Update payment status
    batch.update(paymentRef, {
      isDisputed: true,
      disputeId: disputeRef.id,
      status: 'DISPUTED'
    });

    await batch.commit();

    res.json({
      success: true,
      disputeId: disputeRef.id,
      status: 'DISPUTE_CREATED'
    });

  } catch (error) {
    console.error('Dispute creation error:', error);
    res.status(500).json({
      error: 'Failed to create dispute',
      message: error.message
    });
  }
});



// Production settings
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Handle static asset requests
  app.get('/assets/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', req.path));
  });
  
  // Handle all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Don't send error details in production
  const errorResponse = {
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log('Allowed origins:', corsOptions.origin);
});
