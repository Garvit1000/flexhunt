import React, { useState, useEffect } from 'react';
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

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  // Always use the same domain as the current request
  return window.location.origin;
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

const handleBuyNow = async () => {
  if (!currentUser) {
    setError('Please log in to purchase this gig');
    return;
  }

  let paymentDocRef = null;

  try {
    setProcessingPayment(true);
    setError('');

    const token = await currentUser.getIdToken();
    const API_BASE_URL = getApiBaseUrl();
    
    // Create payment in Firebase
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

    // Initialize PayPal buttons
    const paypalButtons = window.paypal.Buttons({
      orderID: data.orderID,
      onApprove: async (paypalData) => {
        try {
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
          toast({
            variant: "destructive",
            title: "Payment Failed",
            description: err.message || 'Failed to complete payment',
          });
        }
      },
      onError: (err) => {
        console.error('PayPal button error:', err);
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: "PayPal encountered an error. Please try again.",
        });
      }
    });

    const container = document.getElementById('paypal-button-container');
    if (!container) {
      throw new Error('PayPal button container not found');
    }
    
    container.innerHTML = '';
    await paypalButtons.render('#paypal-button-container');

  } catch (err) {
    console.error('Payment processing error:', err);
    setError(err.message || 'Failed to process payment');
    
    // Update failed payment document
    if (paymentDocRef) {
      try {
        await updateDoc(paymentDocRef, {
          status: 'FAILED',
          error: err.message,
          errorDetails: {
            timestamp: new Date().toISOString(),
            message: err.message
          }
        });
      } catch (updateErr) {
        console.error('Failed to update payment status:', updateErr);
      }
    }

    toast({
      variant: "destructive",
      title: "Payment Error",
      description: err.message || 'Failed to process payment',
    });
  } finally {
    setProcessingPayment(false);
  }
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
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : 'Buy Now'}
                </Button>
              </div>
              <div id="paypal-button-container"></div>
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
