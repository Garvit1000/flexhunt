import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building, CircleDollarSign, AlertCircle, Loader2, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { initializeApp } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc
} from 'firebase/firestore';
import CryptoJS from 'crypto-js';

const SellerRegistration = () => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  // Initialize Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCFL6wEkojPogfUeTnV7tO8sOHm2YVRN0M",
    authDomain: "freelance-ffb69.firebaseapp.com",
    projectId: "freelance-ffb69",
    storageBucket: "freelance-ffb69.appspot.com",
    messagingSenderId: "7882012228",
    appId: "1:7882012228:web:bd9b87fbccbc0ec6f2ae11",
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const ENCRYPTION_KEY = 'your-secure-encryption-key';

  // Fetch existing payment information on component mount
  useEffect(() => {
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
    try {
      // Check bank accounts
      const bankQuery = await getDocs(collection(db, 'bankAccounts'));
      const paypalQuery = await getDocs(collection(db, 'paypalAccounts'));

      let info = null;

      if (!bankQuery.empty) {
        const bankDoc = bankQuery.docs[0];
        info = {
          id: bankDoc.id,
          ...bankDoc.data(),
          type: 'bank'
        };
      } else if (!paypalQuery.empty) {
        const paypalDoc = paypalQuery.docs[0];
        info = {
          id: paypalDoc.id,
          ...paypalDoc.data(),
          type: 'paypal'
        };
      }

      setPaymentInfo(info);
    } catch (error) {
      console.error('Error fetching payment info:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment information",
        variant: "destructive"
      });
    }
  };

  // Validation patterns
  const patterns = {
    accountNumber: /^[0-9]{8,17}$/,
    routingNumber: /^[0-9]{9}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  };
  const navigateToOrders = () => {
    navigate('/seller-orders');
  };

  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  };

  const saveToFirebase = async (data) => {
    try {
      if (data.method === 'bank') {
        const encryptedData = {
          method: 'bank',
          timestamp: new Date().toISOString(),
          bankName: data.bankName,
          encryptedDetails: encryptData({
            accountNumber: data.accountNumber,
            routingNumber: data.routingNumber
          })
        };
        await addDoc(collection(db, 'bankAccounts'), encryptedData);
      } else {
        await addDoc(collection(db, 'paypalAccounts'), {
          method: 'paypal',
          timestamp: new Date().toISOString(),
          email: data.paypalEmail
        });
      }
      await fetchPaymentInfo();
      return { success: true };
    } catch (error) {
      console.error('Firebase save error:', error);
      throw new Error('Failed to save payment information');
    }
  };

  const handleDelete = async () => {
    if (!paymentInfo) return;

    setIsDeleting(true);
    try {
      const collectionName = paymentInfo.type === 'bank' ? 'bankAccounts' : 'paypalAccounts';
      await deleteDoc(doc(db, collectionName, paymentInfo.id));

      setPaymentInfo(null);
      setShowSuccess(false);
      toast({
        title: "Success",
        description: "Payment information has been removed",
        variant: "success"
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to remove payment information",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData.entries());
      data.method = selectedPaymentMethod;

      if (selectedPaymentMethod === 'bank') {
        if (!patterns.accountNumber.test(data.accountNumber)) {
          throw new Error('Invalid account number');
        }
        if (!patterns.routingNumber.test(data.routingNumber)) {
          throw new Error('Invalid routing number');
        }
      } else if (selectedPaymentMethod === 'paypal') {
        if (!patterns.email.test(data.paypalEmail)) {
          throw new Error('Invalid email address');
        }
      }

      await saveToFirebase(data);

      toast({
        title: "Success!",
        description: "Your payment information has been securely saved.",
        variant: "success"
      });

      setShowSuccess(true);
      event.target.reset();

    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderExistingPaymentInfo = () => {
    if (!paymentInfo) return null;

    return (
      <Alert className="mb-6 bg-blue-50">
        <AlertTitle className="text-blue-600">Current Payment Information</AlertTitle>
        <AlertDescription className="text-blue-600">
          {paymentInfo.type === 'bank' ? (
            <>Bank Account: {paymentInfo.bankName}</>
          ) : (
            <>PayPal Email: {paymentInfo.email}</>
          )}
        </AlertDescription>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="mt-2"
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Removing...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Payment Details
            </>
          )}
        </Button>
      </Alert>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Become a Seller</CardTitle>
        </CardHeader>
        <CardContent>
          {renderExistingPaymentInfo()}

          {showSuccess ? (
            <div className="space-y-6">
              <Alert className="mb-6 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Successfully Submitted!</AlertTitle>
                <AlertDescription className="text-green-600">
                  Your payment information has been securely saved. You can now start selling on our platform.
                </AlertDescription>
              </Alert>
              <Button
                onClick={navigateToOrders}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Seller Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

          ) : (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your bank account details are encrypted before storage. Email addresses are stored securely in our database.
              </AlertDescription>
            </Alert>
          )}

          {!paymentInfo && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center">
                      <Building className="mr-2 h-4 w-4" />
                      Bank Account
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex items-center">
                      <CircleDollarSign className="mr-2 h-4 w-4" />
                      PayPal
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {selectedPaymentMethod === 'bank' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      className="mt-1"
                      placeholder="Enter bank name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      className="mt-1"
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      name="routingNumber"
                      className="mt-1"
                      placeholder="Enter routing number"
                      required
                    />
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'paypal' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="paypalEmail">PayPal Email</Label>
                    <Input
                      id="paypalEmail"
                      name="paypalEmail"
                      className="mt-1"
                      type="email"
                      placeholder="Enter PayPal email"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Save Payment Information'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerRegistration;