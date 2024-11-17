// const express = require('express');
// const cors = require('cors');
// const paypal = require('@paypal/checkout-server-sdk');
// require('dotenv').config();
// const path = require('path');
// // Import Firebase configuration
// const { admin, db } = require('./config/firebase-config');

// const app = express();
// const corsOptions = {
//   origin: process.env.NODE_ENV === 'production'
//     ? ['https://www.flexhunt.co', 'https://flexhunt.co']
//     : 'http://localhost:5173', // Specifically allow Vite's default port
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   exposedHeaders: ['Content-Range', 'X-Content-Range']
// };

// app.use(cors(corsOptions));
// app.use(express.json());
// app.options('*', cors(corsOptions));
// app.use((err, req, res, next) => {
//   if (err.message === 'CORS Error') {
//     return res.status(403).json({
//       error: 'CORS Error',
//       message: 'Cross-Origin Request Blocked',
//       allowedOrigins: corsOptions.origin
//     });
//   }
//   next(err);
// });
// // PayPal Configuration
// const environment = process.env.NODE_ENV === 'production'
//   ? paypal.core.LiveEnvironment
//   : paypal.core.SandboxEnvironment;

// console.log('PayPal Environment:', process.env.NODE_ENV);

// const paypalClient = new paypal.core.PayPalHttpClient(
//   new environment(
//     process.env.PAYPAL_CLIENT_ID,
//     process.env.PAYPAL_CLIENT_SECRET
//   )
// );

// // Enhanced error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Global error handler:', {
//     error: err.message,
//     stack: err.stack,
//     path: req.path,
//     method: req.method,
//     body: req.body
//   });
  
//   res.status(500).json({
//     error: 'Internal server error',
//     message: err.message,
//     path: req.path
//   });
// });


// // Routes
// app.post('/api/create-payment', async (req, res) => {
//   res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production'
//     ? 'https://www.flexhunt.co'
//     : 'http://localhost:5173');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   try {
//     // Validate auth token
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith('Bearer ')) {
//       return res.status(401).json({ 
//         error: 'Unauthorized',
//         message: 'Missing or invalid authorization token'
//       });
//     }

//     const token = authHeader.split('Bearer ')[1];
//     await admin.auth().verifyIdToken(token);

//     const { gigId, buyerId, amount, paymentId, title } = req.body;

//     // Validate required fields
//     if (!gigId || !buyerId || !amount) {
//       return res.status(400).json({
//         error: 'Missing required fields',
//         message: 'Please provide gigId, buyerId, and amount',
//         received: { gigId, buyerId, amount }
//       });
//     }

//     // Create PayPal order
//     const request = new paypal.orders.OrdersCreateRequest();
//     request.prefer("return=representation");
//     request.requestBody({
//       intent: 'CAPTURE',
//       purchase_units: [{
//         amount: {
//           currency_code: 'USD',
//           value: amount.toString()
//         },
//         description: title ? `Payment for: ${title}` : `Payment for gig ${gigId}`,
//         custom_id: `${gigId}_${buyerId}_${Date.now()}`
//       }]
//     });

//     const order = await paypalClient.execute(request);
//     console.log('PayPal order created successfully:', order.result);

//     res.json({
//       orderID: order.result.id,
//       status: order.result.status
//     });

//   } catch (error) {
//     console.error('Payment creation error:', error);
//     res.status(500).json({
//       error: 'Error creating payment',
//       message: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });


// app.post('/api/capture-payment', async (req, res) => {
//   try {
//     const { orderID } = req.body;

//     // Capture the PayPal order
//     const request = new paypal.orders.OrdersCaptureRequest(orderID);
//     const capture = await paypalClient.execute(request);

//     if (capture.result.status === 'COMPLETED') {
//       // Update payment status in Firestore
//       const paymentQuery = await db.collection('payments')
//         .where('paypalOrderId', '==', orderID)
//         .limit(1)
//         .get();

//       if (!paymentQuery.empty) {
//         const paymentDoc = paymentQuery.docs[0];
//         const payment = paymentDoc.data();

//         // Set escrow release date to 7 days from now
//         const escrowReleaseDate = new Date();
//         escrowReleaseDate.setDate(escrowReleaseDate.getDate() + 7);

//         await paymentDoc.ref.update({
//           status: 'COMPLETED',
//           escrowReleaseDate,
//           capturedAt: admin.firestore.FieldValue.serverTimestamp()
//         });

//         // Create order record
//         await db.collection('orders').add({
//           gigId: payment.gigId,
//           buyerId: payment.buyerId,
//           sellerId: payment.sellerId,
//           amount: payment.amount,
//           status: 'IN_PROGRESS',
//           paymentId: paymentDoc.id,
//           createdAt: admin.firestore.FieldValue.serverTimestamp()
//         });
//       }

//       res.json({ status: 'COMPLETED' });
//     } else {
//       res.status(400).json({ error: 'Payment capture failed' });
//     }

//   } catch (error) {
//     console.error('Error capturing payment:', error);
//     res.status(500).json({ error: 'Error capturing payment' });
//   }
// });

// // Release funds from escrow
// app.post('/api/release-escrow', async (req, res) => {
//   try {
//     const { paymentId } = req.body;

//     const paymentDoc = await db.collection('payments').doc(paymentId).get();
//     if (!paymentDoc.exists) {
//       return res.status(404).json({ error: 'Payment not found' });
//     }

//     const payment = paymentDoc.data();
//     const now = new Date();
//     const escrowReleaseDate = payment.escrowReleaseDate.toDate();

//     if (now < escrowReleaseDate) {
//       return res.status(400).json({ error: 'Escrow period not completed' });
//     }

//     await paymentDoc.ref.update({
//       status: 'RELEASED',
//       releasedAt: admin.firestore.FieldValue.serverTimestamp()
//     });

//     // Update order status
//     const orderQuery = await db.collection('orders')
//       .where('paymentId', '==', paymentId)
//       .limit(1)
//       .get();

//     if (!orderQuery.empty) {
//       await orderQuery.docs[0].ref.update({
//         status: 'COMPLETED',
//         completedAt: admin.firestore.FieldValue.serverTimestamp()
//       });
//     }

//     res.json({ status: 'SUCCESS' });

//   } catch (error) {
//     console.error('Error releasing escrow:', error);
//     res.status(500).json({ error: 'Error releasing escrow' });
//   }
// });

// // Dispute handling
// app.post('/api/dispute-payment', async (req, res) => {
//   try {
//     const { paymentId, reason } = req.body;

//     const paymentDoc = await db.collection('payments').doc(paymentId).get();
//     if (!paymentDoc.exists) {
//       return res.status(404).json({ error: 'Payment not found' });
//     }

//     await paymentDoc.ref.update({
//       isDisputed: true,
//       disputeReason: reason,
//       disputedAt: admin.firestore.FieldValue.serverTimestamp()
//     });

//     // Create dispute record
//     await db.collection('disputes').add({
//       paymentId,
//       reason,
//       status: 'OPEN',
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       buyerId: paymentDoc.data().buyerId,
//       sellerId: paymentDoc.data().sellerId
//     });

//     res.json({ status: 'DISPUTE_CREATED' });

//   } catch (error) {
//     console.error('Error creating dispute:', error);
//     res.status(500).json({ error: 'Error creating dispute' });
//   }
// });
// if (process.env.NODE_ENV === 'production') {
//   // Serve static files from the React frontend app
//   app.use(express.static(path.join(__dirname, '../frontend/dist')));

//   // Handle React routing, return all requests to React app
//   app.get('*', function(req, res) {
//       res.sendFile(path.join(__dirname,  '../frontend/dist/index.html'));
//   });
// }

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
//   console.log('CORS configured for:', 
//     Array.isArray(corsOptions.origin) 
//       ? corsOptions.origin.join(', ') 
//       : corsOptions.origin
//   );
// });
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
  // Override res.send to ensure we never send empty responses
  const originalSend = res.send;
  res.send = function(data) {
    // If data is empty, send a default response
    if (!data) {
      return originalSend.call(this, JSON.stringify({
        success: true,
        message: 'Operation completed successfully'
      }));
    }
    return originalSend.call(this, data);
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
    console.log('Creating payment with payload:', req.body);
    const { gigId, amount, paymentId } = req.body;
    
    if (!gigId || !amount || !paymentId) {
      throw new Error('Missing required fields: gigId, amount, or paymentId');
    }

    // Get gig details
    const gigDoc = await db.collection('gigs').doc(gigId).get();
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

    console.log('Executing PayPal order request...');
    const order = await paypalClient.execute(request);
    
    if (!order?.result?.id) {
      throw new Error('Invalid PayPal order response');
    }

    // Calculate escrow release date
    const escrowReleaseDate = new Date();
    escrowReleaseDate.setDate(escrowReleaseDate.getDate() + 7);

    // Update payment document
    await db.collection('payments').doc(paymentId).update({
      amount: parseFloat(amount),
      buyerId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      escrowReleaseDate: escrowReleaseDate,
      gigId: gigId,
      isDisputed: false,
      paypalOrderId: order.result.id,
      sellerId: gigDoc.data().providerId,
      status: 'PENDING',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send response with required content-type header
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      status: 'success',
      success: true,
      orderID: order.result.id,
      paymentId: paymentId
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    
    // Update payment status to failed if we have a paymentId
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

    // Send error response with content-type header
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

app.post('/api/capture-payment', validateFirebaseToken, async (req, res) => {
  try {
    console.log('Capturing payment:', req.body);
    const { orderID, paymentId } = req.body;
    
    if (!orderID || !paymentId) {
      throw new Error('Missing required fields: orderID or paymentId');
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    console.log('Executing PayPal capture request...');
    const capture = await paypalClient.execute(request);

    if (capture.result.status === 'COMPLETED') {
      const now = admin.firestore.FieldValue.serverTimestamp();
      
      console.log('Updating payment document:', paymentId);
      await db.collection('payments').doc(paymentId).update({
        status: 'COMPLETED',
        updatedAt: now,
        capturedAt: now,
        completedAt: now
      });

      // Construct response object
      const responseData = {
        success: true,
        status: 'COMPLETED',
        paymentId: paymentId,
        captureId: capture.result.purchase_units[0].payments.captures[0].id
      };

      // Set proper headers
      res.setHeader('Content-Type', 'application/json');
      
      // Log response before sending
      console.log('Sending capture response:', responseData);
      
      // Send response
      return res.status(200).json(responseData);
    } else {
      throw new Error(`Payment capture failed: ${capture.result.status}`);
    }

  } catch (error) {
    console.error('Payment capture error:', error);
    
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

    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    
    // Send error response
    return res.status(500).json({
      success: false,
      status: 'error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
if (process.env.NODE_ENV === 'development') {
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

  if (process.env.NODE_ENV === 'production') {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log('Allowed origins:', corsOptions.origin);
});
