import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  const createPaymentOrder = async () => {
    if (!currentUser || !gig) {
      throw new Error('Missing user or gig data');
    }

    try {
      const token = await currentUser.getIdToken();
      
      const payload = {
        gigId: id,
        buyerId: currentUser.uid,
        amount: parseFloat(gig.startingPrice),
        currency: 'USD',
        description: `Payment for ${gig.title}`
      };

      console.log('Sending payment creation request with payload:', payload);

      const response = await fetch('https://www.flexhunt.co/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Payment creation failed: ${response.status} ${response.statusText}`);
      }

      let responseText;
      try {
        responseText = await response.text();
        console.log('Raw server response:', responseText);
      } catch (err) {
        console.error('Error reading response:', err);
        throw new Error('Failed to read server response');
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (err) {
        console.error('JSON parse error:', err, 'Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format: expected object');
      }

      if (!data.orderID) {
        throw new Error('Invalid response format: missing orderID');
      }

      return data.orderID;

    } catch (err) {
      console.error('Payment creation error:', err);
      throw new Error(err.message || 'Failed to create payment');
    }
  };

  const handleBuyNow = async () => {
    if (!currentUser) {
      setError('Please log in to purchase this gig');
      return;
    }

    if (!paypalLoaded) {
      setError('Payment system is still initializing');
      return;
    }

    try {
      const container = document.getElementById('paypal-button-container');
      if (!container) {
        throw new Error('PayPal container not found');
      }
      container.innerHTML = '';

      await window.paypal.Buttons({
        createOrder: async () => {
          try {
            setError('');
            console.log('Starting PayPal order creation...');
            const orderId = await createPaymentOrder();
            console.log('PayPal order created successfully:', orderId);
            return orderId;
          } catch (err) {
            console.error('PayPal order creation failed:', err);
            setError(err.message);
            throw err;
          }
        },

        onApprove: async (data) => {
          try {
            console.log('Payment approved, proceeding with capture:', data);
            const token = await currentUser.getIdToken();
            
            const response = await fetch('https://www.flexhunt.co/api/capture-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              credentials: 'include',
              body: JSON.stringify({ 
                orderID: data.orderID,
                gigId: id
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Capture error response:', errorText);
              throw new Error(`Payment capture failed: ${response.status} ${response.statusText}`);
            }

            const captureResult = await response.json();
            console.log('Capture result:', captureResult);
            
            const db = getFirestore();
            const batch = writeBatch(db);

            const paymentsRef = collection(db, 'payments');
            const q = query(paymentsRef, where('paypalOrderId', '==', data.orderID));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const paymentDoc = querySnapshot.docs[0];
              const paymentRef = doc(db, 'payments', paymentDoc.id);
              
              batch.update(paymentRef, {
                status: captureResult.status || 'COMPLETED',
                updatedAt: serverTimestamp(),
                completedAt: serverTimestamp(),
                captureId: captureResult.captureId
              });

              if (captureResult.status === 'COMPLETED') {
                const orderRef = doc(collection(db, 'orders'));
                batch.set(orderRef, {
                  gigId: id,
                  gigTitle: gig.title,
                  buyerId: currentUser.uid,
                  buyerEmail: currentUser.email,
                  buyerName: currentUser.displayName || 'Anonymous',
                  sellerId: gig.providerId,
                  sellerEmail: gig.providerEmail || '',
                  sellerName: gig.provider || 'Unknown Provider',
                  paymentId: paymentDoc.id,
                  status: 'PENDING',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  amount: Number(gig.startingPrice),
                  deliveryTime: gig.deliveryTime || '7 days',
                  category: gig.category || 'uncategorized'
                });
              }

              await batch.commit();
              console.log('Payment records updated successfully');
              navigate('/orders');
            }
          } catch (err) {
            console.error('Payment capture error:', err);
            setError(err.message || 'Failed to complete payment');
          }
        },

        onError: (err) => {
          console.error('PayPal error:', err);
          setError('Payment failed. Please try again.');
        }
      }).render('#paypal-button-container');
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Error processing payment');
    }
  };

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const db = getFirestore();
        const gigDoc = await getDoc(doc(db, 'gigs', id));
        
        if (gigDoc.exists()) {
          const gigData = { id: gigDoc.id, ...gigDoc.data() };
          console.log('Fetched gig data:', gigData);
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

  useEffect(() => {
    const loadPaypalScript = () => {
      if (window.paypal) {
        setPaypalLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=Ael-tHA9_mkr9yKohQV7M3O_LUq7ZfHAAA002cENIRptQc15oNItGBYhkXV0JHFoiTIeRz6F6apyUec2';
      script.async = true;
      
      script.onload = () => {
        setPaypalLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        setError('Failed to initialize payment system');
      };

      document.body.appendChild(script);
    };

    loadPaypalScript();

    return () => {
      const paypalScript = document.querySelector('script[src*="paypal"]');
      if (paypalScript) {
        paypalScript.remove();
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentUser || sendingMessage) return;

    try {
      setSendingMessage(true);

      const db = getFirestore();
      await addDoc(collection(db, 'messages'), {
        gigId: id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        receiverId: gig.providerId,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false
      });

      setNewMessage('');
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully."
      });
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        variant: "destructive",
        title: "Message Failed",
        description: "Failed to send message. Please try again."
      });
    } finally {
      setSendingMessage(false);
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
                    {gig.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {gig.projectLinks?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Project Links</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {gig.projectLinks.map((link, index) => (
                        <li key={index}>
                          <a 
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
              disabled={!paypalLoaded}
            >
              Buy Now
            </Button>
          </div>
          <div id="paypal-button-container"></div>
          <div className="text-sm text-gray-500">
            ✓ {gig.deliveryTime} delivery
            <br />
            ✓ Direct communication
            <br />
            ✓ Money-back guarantee
          </div>
        </CardContent>
      </Card>
           {/* Enhanced Chat Card */}
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
