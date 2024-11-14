import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Star, Edit, Trash2, AlertCircle } from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from './AuthContext';
import { getFirestore, doc, deleteDoc, getDoc ,collection,query,where,getDocs} from 'firebase/firestore';
import { RatingSystem } from './RatingSystem';
import EditGigForm from './EditGigForm';
// Integrated Rating System Component
const ReadOnlyRatingSystem = ({ gigId }) => {
    const [averageRating, setAverageRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRatingData = async () => {
            try {
                const db = getFirestore();
                const ratingRef = doc(db, 'gig-ratings', gigId);
                const ratingDoc = await getDoc(ratingRef);

                if (ratingDoc.exists()) {
                    const data = ratingDoc.data();
                    setAverageRating(data.averageRating || 0);
                    setTotalRatings(data.totalRatings || 0);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching ratings:', err);
                setLoading(false);
            }
        };

        if (gigId) {
            fetchRatingData();
        }
    }, [gigId]);

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <Star
                key={index}
                size={16}
                className={`${index < Math.floor(rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
            />
        ));
    };

    if (loading) {
        return <div className="flex space-x-2">Loading ratings...</div>;
    }

    return (
        <div className="flex items-center space-x-2">
            <div className="flex">{renderStars(averageRating)}</div>
            <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({totalRatings})
            </span>
        </div>
    );
};

const GigCard = ({
    id,
    image,
    title,
    provider,
    providerEmail,
    providerId,
    description,
    deliveryTime,
    startingPrice,
    skills = [],
    category = '',
    createdAt,
    onDelete,
    showActions = true
}) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [providerData, setProviderData] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    // Fetch provider data
    useEffect(() => {
        const fetchProviderData = async () => {
            if (providerId) {
                try {
                    const db = getFirestore();
                    const userDoc = await getDoc(doc(db, 'users', providerId));
                    if (userDoc.exists()) {
                        setProviderData(userDoc.data());
                    }
                } catch (err) {
                    console.error('Error fetching provider data:', err);
                }
            }
        };

        fetchProviderData();
    }, [providerId]);

    const providerDisplayName =
        providerData?.displayName ||
        provider ||
        providerData?.email ||
        providerEmail ||
        'Anonymous';

    const avatarLetter = providerDisplayName.charAt(0).toUpperCase();
    const isOwner = currentUser && currentUser.uid === providerId;

    const handleCardClick = (e) => {
        // Don't navigate if clicking on buttons or dialog
        if (
            e.target.closest('button') ||
            e.target.closest('[role="dialog"]') ||
            e.target.closest('.actions-container')
        ) {
            return;
        }
        navigate(`/gig/${id}`);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setIsEditDialogOpen(true);
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            setError('');

            const db = getFirestore();
            
            // Delete the gig document
            await deleteDoc(doc(db, 'gigs', id));
            
            // Delete associated ratings
            await deleteDoc(doc(db, 'gig-ratings', id));
            
            // Delete associated messages
            const messagesRef = collection(db, 'messages');
            const q = query(messagesRef, where('gigId', '==', id));
            const querySnapshot = await getDocs(q);
            
            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            if (onDelete) {
                onDelete(id);
            }

            setIsDialogOpen(false);
        } catch (err) {
            setError('Failed to delete gig. Please try again.');
            console.error('Error deleting gig:', err);
        } finally {
            setIsDeleting(false);
        }
    };


    return (
        <>
        <Card 
            className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={handleCardClick}
        >
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="relative">
                <div className="relative aspect-video overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {category && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-800 shadow-sm">
                            {category}
                        </span>
                    )}
                </div>

                {showActions && isOwner && (
                    <div className="actions-container absolute top-4 right-4 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white hover:bg-gray-100"
                            onClick={handleEdit}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            className="bg-white hover:bg-red-50 text-red-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDialogOpen(true);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                    {avatarLetter}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                {providerDisplayName}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Clock size={14} className="text-gray-400" />
                            <span>{deliveryTime}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {description}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 3).map((skill, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                            >
                                {skill}
                            </span>
                        ))}
                        {skills.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{skills.length - 3}
                            </span>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <RatingSystem gigId={id} />
                            <div className="text-right">
                                <span className="text-xs font-medium text-gray-500 block">Starting at</span>
                                <span className="text-2xl font-bold text-gray-900">
                                    ${typeof startingPrice === 'number' ? startingPrice.toFixed(2) : startingPrice}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your gig
                        and remove all associated data including ratings and messages.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDialogOpen(false);
                        }}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Gig'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <EditGigForm 
    gigId={id}
    isOpen={isEditDialogOpen}
    onClose={() => setIsEditDialogOpen(false)}
    
/>
    </>
);
};

export { GigCard, ReadOnlyRatingSystem };