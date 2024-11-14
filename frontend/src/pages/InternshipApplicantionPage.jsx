import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, X, Loader2, Search, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InternshipApplicationPage() {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState({});
  const { currentUser, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCoverLetter, setSelectedCoverLetter] = useState('');
  const [coverLetterDialogOpen, setCoverLetterDialogOpen] = useState(false);
  const getUserRole = () => {
    const userEmail = currentUser?.email;
    return userEmail ? localStorage.getItem(`role_${userEmail}`) : null;
  };

  useEffect(() => {
    if (currentUser && getUserRole() === 'recruiter') {
      fetchApplications();
    }
  }, [currentUser]);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, searchTerm, statusFilter, sortBy]);

  const filterAndSortApplications = () => {
    let filtered = [...applications];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        Object.values(app).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.submittedAt?.seconds - a.submittedAt?.seconds;
        case 'oldest':
          return a.submittedAt?.seconds - b.submittedAt?.seconds;
        case 'nameAZ':
          return a.name.localeCompare(b.name);
        case 'nameZA':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  };

  const fetchApplications = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'internshipApplications'));
      const apps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'pending'
      }));
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching internship applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setUpdateLoading(prev => ({ ...prev, [applicationId]: true }));
    try {
      const applicationRef = doc(db, 'internshipApplications', applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus } 
            : app
        )
      );
    } catch (error) {
      console.error('Error updating internship application:', error);
    } finally {
      setUpdateLoading(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success">{status}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusCount = (status) => {
    return applications.filter(app => 
      status === 'all' ? true : app.status === status
    ).length;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (getUserRole() !== 'recruiter') {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page. This page is only accessible to recruiters.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-8xl mx-auto space-y-6">
       <Dialog open={coverLetterDialogOpen} onOpenChange={setCoverLetterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader className="bg-white">
            <DialogTitle>Cover Letter</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap bg-white p-4">{selectedCoverLetter}</div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Internship Applications</CardTitle>
              <CardDescription>
                Manage and review internship applications
              </CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={fetchApplications}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{getStatusCount('all')}</div>
                <p className="text-muted-foreground">Total Applications</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{getStatusCount('pending')}</div>
                <p className="text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{getStatusCount('accepted')}</div>
                <p className="text-muted-foreground">Accepted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{getStatusCount('rejected')}</div>
                <p className="text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="nameAZ">Name A-Z</SelectItem>
                <SelectItem value="nameZA">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-2">No applications found</div>
              <div className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filter settings"
                  : "Applications will appear here once submitted"}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Education
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium">{app.name}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                          <div className="text-sm text-gray-500">{app.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm">{app.university}</div>
                          <div className="text-sm text-gray-500">{app.major}</div>
                          <div className="text-sm text-gray-500">GPA: {app.gpa}</div>
                          <div className="text-sm text-gray-500">Class of {app.graduationYear}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm">{app.position}</div>
                          <div className="text-sm text-gray-500">{app.companyName}</div>
                          <div className="text-sm text-gray-500">{app.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <a
                            href={app.resumeURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Resume
                          </a>
                          <Button
                    variant="ghost"
                    className="text-sm"
                    onClick={() => {
                      setSelectedCoverLetter(app.coverLetter);
                      setCoverLetterDialogOpen(true);
                    }}
                  >
                    View Cover Letter
                  </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getStatusBadge(app.status)}
                          <div className="text-xs text-gray-500">
                            {formatDate(app.submittedAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 hover:bg-green-100 text-green-600"
                            onClick={() => handleStatusUpdate(app.id, 'accepted')}
                            disabled={updateLoading[app.id] || app.status === 'accepted'}
                          >
                            {updateLoading[app.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-red-50 hover:bg-red-100 text-red-600"
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            disabled={updateLoading[app.id] || app.status === 'rejected'}
                          >
                          {updateLoading[app.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredApplications.length > 0 && (
        <div className="flex justify-between items-center mt-4 py-2">
          <div className="text-sm text-gray-500">
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('newest');
              }}
              className="text-sm"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}