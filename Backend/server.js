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
  optionsSuccessStatus: 204,
  exposedHeaders: ['Content-Length', 'Content-Type']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  // Save the original send
  const originalSend = res.send;
  
  res.send = function(body) {
    // Ensure we're not sending an empty response
    if (!body && body !== 0) {
      console.warn('Attempted to send empty response');
      return originalSend.call(this, { status: 'success', data: null });
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Production static file serving with proper error handling
if (process.env.NODE_ENV === 'production') {
  app.use('/assets', express.static(path.join(__dirname, '../frontend/dist/assets'), {
    fallthrough: false // Return 404 for missing assets
  }));
  
  app.use(express.static(path.join(__dirname, '../frontend/dist'), {
    index: false // Don't serve index.html for all requests
  }));
  
  // Handle asset requests with proper error handling
  app.get('/assets/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', req.path), (err) => {
      if (err) {
        res.status(404).json({
          status: 'error',
          message: 'Asset not found'
        });
      }
    });
  });
  
  // Final catch-all route for SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'), (err) => {
      if (err) {
        res.status(500).json({
          status: 'error',
          message: 'Error loading application'
        });
      }
    });
  });
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Ensure we always send a structured response
  const errorResponse = {
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || null;
  }
  
  // Ensure content-type is set
  res.set('Content-Type', 'application/json');
  res.status(err.status || 500).json(errorResponse);
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
    const { gigId, amount, title, buyerId, sellerId, paymentId } = req.body;

    // Get user details
    const buyerRecord = await admin.auth().getUser(buyerId);
    const sellerRecord = await admin.auth().getUser(sellerId);
    
    // Get gig details
    const gigDoc = await db.collection('gigs').doc(gigId).get();
    const gigData = gigDoc.data();

    if (!gigDoc.exists) {
      throw new Error('Gig not found');
    }

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: parseFloat(amount).toFixed(2)
        },
        description: title || gigData.title,
        custom_id: `${gigId}_${paymentId}`
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
    
    if (!order?.result?.id) {
      throw new Error('Invalid PayPal order response');
    }

    // Update payment document with all required fields
    await db.collection('payments').doc(paymentId).update({
      amount: parseFloat(amount),
      buyerEmail: buyerRecord.email,
      buyerId: buyerId,
      buyerName: buyerRecord.displayName || buyerRecord.email,
      category: gigData.category,
      currency: 'USD',
      deliveryTime: gigData.deliveryTime,
      gigId: gigId,
      gigTitle: gigData.title,
      paymentMethod: 'PAYPAL',
      paypalOrderId: order.result.id,
      sellerEmail: sellerRecord.email,
      sellerId: sellerId,
      sellerName: sellerRecord.displayName || sellerRecord.email,
      status: 'PENDING',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send successful response
    res.status(200).json({
      status: 'success',
      success: true,
      orderID: order.result.id,
      paymentId: paymentId
    });

  } catch (error) {
    console.error('Payment creation error:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    
    // Update payment status to FAILED if there's an error
    if (req.body.paymentId) {
      try {
        await db.collection('payments').doc(req.body.paymentId).update({
          status: 'FAILED',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
      }
    }

    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Updated capture-payment endpoint
app.post('/api/capture-payment', validateFirebaseToken, async (req, res) => {
  try {
    const { orderID, paymentId } = req.body;
    
    // Execute PayPal capture
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const capture = await paypalClient.execute(request);

    if (capture.result.status === 'COMPLETED') {
      // Update payment document
      await db.collection('payments').doc(paymentId).update({
        status: 'COMPLETED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        captureDetails: {
          captureId: capture.result.purchase_units[0].payments.captures[0].id,
          captureTime: admin.firestore.FieldValue.serverTimestamp()
        }
      });

      res.json({
        success: true,
        status: 'COMPLETED',
        paymentId: paymentId
      });
    } else {
      throw new Error(`Payment capture failed: ${capture.result.status}`);
    }

  } catch (error) {
    console.error('Payment capture error:', error);
    
    // Update payment status to FAILED
    if (req.body.paymentId) {
      try {
        await db.collection('payments').doc(req.body.paymentId).update({
          status: 'FAILED',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
      }
    }

    res.status(500).json({
      success: false,
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
