import React, { useState, useEffect, useRef  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, MessageCircle, Star, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../hooks/use-toast';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  increment,
  writeBatch
} from 'firebase/firestore';

const GigDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paypalScriptLoaded, setPaypalScriptLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  const paymentTimeoutRef = useRef(null);
  const processingRef = useRef(false);
  
const PAYMENT_TIMEOUT = 30000;
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  // Always use the same domain as the current request
  return 'https://flexhunt.onrender.com';
};

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const db = getFirestore();
        const gigDoc = await getDoc(doc(db, 'gigs', id));

        if (gigDoc.exists()) {
          const gigData = { id: gigDoc.id, ...gigDoc.data() };
          setGig(gigData);
        } else {
          setError('Gig not found');
        }
      } catch (err) {
        console.error('Error fetching gig:', err);
        setError('Error loading gig details');
      } finally {
        setLoading(false);
      }
    };

    fetchGig();
  }, [id]);

  const messageSchema = z.object({
    message: z.string()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message is too long')
      .trim()
  });

  useEffect(() => {
    if (!currentUser || !gig) return;

    const db = getFirestore();
    const q = query(
      collection(db, 'messages'),
      where('gigId', '==', id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [id, currentUser, gig]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentUser || sendingMessage) return;

    try {
      setSendingMessage(true);

      const validatedData = messageSchema.parse({
        message: newMessage
      });

      const db = getFirestore();
      await addDoc(collection(db, 'messages'), {
        gigId: id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        receiverId: gig.providerId,
        message: validatedData.message,
        timestamp: new Date().toISOString(),
        read: false
      });

      setNewMessage('');
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid Message",
          description: err.errors[0].message,
        });
      } else {
        console.error('Error sending message:', err);
        toast({
          variant: "destructive",
          title: "Message Failed",
          description: "Failed to send message. Please try again.",
        });
      }
    } finally {
      setSendingMessage(false);
    }
  };
    useEffect(() => {
    const loadPayPalScript = () => {
      // Remove any existing PayPal script to avoid duplicates
      const existingScript = document.getElementById('paypal-sdk');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      script.src = 'https://www.paypal.com/sdk/js?client-id=Ael-tHA9_mkr9yKohQV7M3O_LUq7ZfHAAA002cENIRptQc15oNItGBYhkXV0JHFoiTIeRz6F6apyUec2';
      script.async = true;
        // Add loading timeout
      const timeoutId = setTimeout(() => {
        if (!paypalScriptLoaded) {
          setPaypalError('PayPal is taking too long to load. Please refresh the page.');
          script.remove();
        }
      }, 10000);

       script.onload = () => {
        clearTimeout(timeoutId);
        setPaypalScriptLoaded(true);
        setPaypalError('');
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        setPaypalError('Failed to load PayPal SDK');
        setPaypalScriptLoaded(false);
      };

      document.body.appendChild(script);
    };

    loadPayPalScript();

    // Cleanup
    return () => {
      const script = document.getElementById('paypal-sdk');
      if (script) {
        script.remove();
      }
    };
  }, []);

  // Reset processing state if component unmounts during processing
  useEffect(() => {
    return () => {
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }
      if (processingRef.current) {
        const db = getFirestore();
        const paymentRef = doc(db, 'payments', processingRef.current);
        updateDoc(paymentRef, {
          status: 'CANCELLED',
          error: 'Payment process interrupted',
          updatedAt: serverTimestamp()
        }).catch(console.error);
      }
    };
  }, []);

  const resetPaymentState = () => {
    setProcessingPayment(false);
    processingRef.current = false;
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
  };


   const handleBuyNow = async () => {
    if (!currentUser) {
      setError('Please log in to purchase this gig');
      return;
    }

    if (!paypalScriptLoaded) {
      setError('PayPal is still loading. Please try again in a moment.');
      return;
    }

    if (processingRef.current) {
      return;
    }

    let paymentDocRef = null;
    let paypalButtons = null;

    try {
      setProcessingPayment(true);
      processingRef.current = true;
      setError('');

      // Create payment document first
      const db = getFirestore();
      paymentDocRef = await addDoc(collection(db, 'payments'), {
        gigId: id,
        buyerId: currentUser.uid,
        sellerId: gig.providerId,
        amount: gig.startingPrice,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        title: gig.title
      });

      processingRef.current = paymentDocRef.id;

      // Get fresh token
      const token = await currentUser.getIdToken(true);
      const API_BASE_URL = getApiBaseUrl();

      // Create PayPal order
      const response = await fetch(`${API_BASE_URL}/api/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gigId: id,
          paymentId: paymentDocRef.id,
          amount: gig.startingPrice,
          title: gig.title,
          buyerId: currentUser.uid,
          sellerId: gig.providerId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || !data.orderID) {
        throw new Error('Invalid response from server');
      }

      if (!window.paypal) {
        throw new Error('PayPal SDK not loaded');
      }

      const container = document.getElementById('paypal-button-container');
      if (!container) {
        throw new Error('PayPal button container not found');
      }
      container.innerHTML = '';

      // Set timeout only for PayPal button interaction
      paymentTimeoutRef.current = setTimeout(() => {
        if (processingRef.current) {
          if (paypalButtons) {
            paypalButtons.close();
          }
          updateDoc(paymentDocRef, {
            status: 'TIMEOUT',
            error: 'Payment process timed out',
            updatedAt: serverTimestamp()
          }).catch(console.error);
          
          setError('Payment process timed out. Please try again.');
          resetPaymentState();
        }
      }, PAYMENT_TIMEOUT);

      // Initialize PayPal buttons
      paypalButtons = window.paypal.Buttons({
        orderID: data.orderID,
        onApprove: async (paypalData) => {
          try {
            // Clear timeout as soon as user approves
            if (paymentTimeoutRef.current) {
              clearTimeout(paymentTimeoutRef.current);
            }

            const captureResponse = await fetch(`${API_BASE_URL}/api/capture-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                orderID: paypalData.orderID,
                paymentId: paymentDocRef.id
              })
            });

            if (!captureResponse.ok) {
              throw new Error(`Capture failed: ${captureResponse.status}`);
            }

            const captureData = await captureResponse.json();
            
            if (captureData.status === 'COMPLETED') {
              resetPaymentState();
              toast({
                title: "Payment Successful",
                description: "Your payment has been processed successfully.",
              });
              navigate('/orders');
            } else {
              throw new Error(`Unexpected capture status: ${captureData.status}`);
            }
          } catch (err) {
            console.error('Payment capture error:', err);
            resetPaymentState();
            
            // Update payment document with error
            if (paymentDocRef) {
              updateDoc(paymentDocRef, {
                status: 'FAILED',
                error: err.message,
                updatedAt: serverTimestamp()
              }).catch(console.error);
            }

            toast({
              variant: "destructive",
              title: "Payment Failed",
              description: err.message || 'Failed to complete payment',
            });
          }
        },
        onCancel: () => {
          if (paymentTimeoutRef.current) {
            clearTimeout(paymentTimeoutRef.current);
          }
          
          // Update payment document as cancelled
          if (paymentDocRef) {
            updateDoc(paymentDocRef, {
              status: 'CANCELLED',
              updatedAt: serverTimestamp()
            }).catch(console.error);
          }

          resetPaymentState();
          toast({
            title: "Payment Cancelled",
            description: "You've cancelled the payment process.",
          });
        },
        onError: (err) => {
          console.error('PayPal button error:', err);
          
          if (paymentTimeoutRef.current) {
            clearTimeout(paymentTimeoutRef.current);
          }

          // Update payment document with error
          if (paymentDocRef) {
            updateDoc(paymentDocRef, {
              status: 'FAILED',
              error: err.message || 'PayPal error occurred',
              updatedAt: serverTimestamp()
            }).catch(console.error);
          }

          resetPaymentState();
          toast({
            variant: "destructive",
            title: "Payment Error",
            description: "PayPal encountered an error. Please try again.",
          });
        }
      });

      await paypalButtons.render('#paypal-button-container');

    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Failed to process payment');
      
      if (paymentDocRef) {
        try {
          await updateDoc(paymentDocRef, {
            status: 'FAILED',
            error: err.message,
            errorDetails: {
              timestamp: new Date().toISOString(),
              message: err.message
            },
            updatedAt: serverTimestamp()
          });
        } catch (updateErr) {
          console.error('Failed to update payment status:', updateErr);
        }
      }

      resetPaymentState();
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.message || 'Failed to process payment',
      });
    }
  };

  const renderPayPalSection = () => {
    if (paypalError) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {paypalError}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (!paypalScriptLoaded) {
      return (
        <div className="text-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading PayPal...</p>
        </div>
      );
    }

    return <div id="paypal-button-container" className="mt-4"></div>;
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return (
    <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
  if (!gig) return null;

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{gig.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  {gig.rating || 'New'}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {gig.deliveryTime}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <img
                src={gig.image}
                alt={gig.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{gig.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {gig.skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-gray-500" />
            <span className="text-2xl font-bold">{gig.startingPrice}</span>
          </div>
          <Button
            onClick={handleBuyNow}
            className="w-32"
            disabled={processingPayment || !paypalScriptLoaded}
          >
            {processingPayment ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Buy Now'
            )}
          </Button>
        </div>
        {renderPayPalSection()}
        <div className="text-sm text-gray-500 mt-4">
          ✓ {gig.deliveryTime} delivery
          <br />
          ✓ Direct communication
          <br />
          ✓ Money-back guarantee
        </div>
      </CardContent>
    </Card>

          {/* Chat Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Message Seller</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChatOpen(!chatOpen)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {chatOpen ? 'Close Chat' : 'Open Chat'}
                </Button>
              </div>
            </CardHeader>
            {chatOpen && (
              <>
                <CardContent>
                  <div className="h-64 overflow-y-auto space-y-4 mb-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.senderId === currentUser?.uid
                            ? 'bg-blue-100 ml-auto'
                            : 'bg-gray-100'
                        } max-w-[80%]`}
                      >
                        <div className="text-sm font-semibold mb-1">
                          {msg.senderName}
                        </div>
                        <div className="text-sm">{msg.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(msg.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <form onSubmit={handleSendMessage} className="w-full">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={sendingMessage}
                      />
                      <Button
                        type="submit"
                        disabled={sendingMessage}
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </form>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GigDetails;
