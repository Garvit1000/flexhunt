import React, { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { useAuth } from '../components/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Orders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const db = getFirestore();
    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(orderList);
      setLoading(false);
    }, (err) => {
      setError('Error loading orders');
      setLoading(false);
      console.error(err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-500 hover:bg-yellow-600",
      inProgress: "bg-blue-500 hover:bg-blue-600",
      completed: "bg-green-500 hover:bg-green-600",
      cancelled: "bg-red-500 hover:bg-red-600"
    };

    return (
      <Badge className={`${statusColors[status]} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Gig</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{order.gigTitle}</TableCell>
                  <TableCell>${order.amount}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.lastUpdated ? 
                      new Date(order.lastUpdated).toLocaleString() : 
                      new Date(order.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No orders found
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog 
        open={!!selectedOrder} 
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Order ID:</span> {selectedOrder.id}</p>
                    <p><span className="text-gray-500">Last Updated:</span> {
                      selectedOrder.lastUpdated ? 
                        new Date(selectedOrder.lastUpdated).toLocaleString() : 
                        'Not updated yet'
                    }</p>
                    <p><span className="text-gray-500">Status:</span> {getStatusBadge(selectedOrder.status)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Gig Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Title:</span> {selectedOrder.gigTitle}</p>
                    <p><span className="text-gray-500">Price:</span> ${selectedOrder.amount}</p>
                    <p><span className="text-gray-500">Seller:</span> {selectedOrder.sellerName}</p>
                    <p><span className="text-gray-500">Delivery:</span> {selectedOrder.deliveryTime}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;