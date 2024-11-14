import React, { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc 
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  DollarSign, 
  PackageCheck, 
  UserCheck, 
  ChevronRight,
  FilterX
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '../hooks/use-toast';

const DashboardStats = ({ orders }) => {
  const getTotalEarnings = () => {
    return orders.reduce((sum, order) => sum + order.amount, 0);
  };

  const getCompletedOrders = () => {
    return orders.filter(order => order.status === 'completed').length;
  };

  const getActiveCustomers = () => {
    const uniqueCustomers = new Set(orders.map(order => order.buyerId));
    return uniqueCustomers.size;
  };
  

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-green-50">
        <CardContent className="flex items-center p-6">
          <div className="rounded-full bg-green-500 p-3 mr-4">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-600">Total Earnings</p>
            <h3 className="text-2xl font-bold text-green-700">${getTotalEarnings()}</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50">
        <CardContent className="flex items-center p-6">
          <div className="rounded-full bg-blue-500 p-3 mr-4">
            <PackageCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Completed Orders</p>
            <h3 className="text-2xl font-bold text-blue-700">{getCompletedOrders()}</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-purple-50">
        <CardContent className="flex items-center p-6">
          <div className="rounded-full bg-purple-500 p-3 mr-4">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-600">Active Customers</p>
            <h3 className="text-2xl font-bold text-purple-700">{getActiveCustomers()}</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SellerOrders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    const db = getFirestore();
    const ordersRef = collection(db, 'orders');
    
    // Create base query
    let q = query(
      ordersRef,
      where('sellerId', '==', currentUser.uid),
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const db = getFirestore();
      const orderRef = doc(db, 'orders', orderId);
      
      await updateDoc(orderRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      });

      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (err) {
      console.error('Error updating order:', err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-500",
      inProgress: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500"
    };

    return (
      <Badge className={`${statusStyles[status]} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

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
    <div className="max-w-7xl mx-auto my-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your orders and track performance</p>
        </div>
      </div>

      <DashboardStats orders={orders} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <div className="z-10">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-32 bg-white border border-gray-200">
                <SelectValue>All Orders</SelectValue>
              </SelectTrigger>
              <SelectContent 
                className="w-32 bg-white shadow-lg border border-gray-200" 
                position="popper"
                sideOffset={5}
              >
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Gig</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Update Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{order.buyerName}</TableCell>
                    <TableCell>{order.gigTitle}</TableCell>
                    <TableCell>${order.amount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="z-10">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusUpdate(order.id, value)}
                          disabled={order.status === 'cancelled'}
                        >
                          <SelectTrigger 
                            className="w-32 bg-white border border-gray-200"
                          >
                            <SelectValue>{order.status}</SelectValue>
                          </SelectTrigger>
                          <SelectContent 
                            className="w-32 bg-white shadow-lg border border-gray-200"
                            position="popper"
                            sideOffset={5}
                          >
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inProgress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {statusFilter === 'all' ? 'No orders found' : `No ${statusFilter} orders found`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrders;