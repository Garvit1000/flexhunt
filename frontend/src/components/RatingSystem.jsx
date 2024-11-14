import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const RatingSystem = ({ gigId }) => {
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const { currentUser } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        // Fetch overall rating data
        const ratingRef = doc(db, 'gig-ratings', gigId);
        const ratingDoc = await getDoc(ratingRef);
        
        if (ratingDoc.exists()) {
          const data = ratingDoc.data();
          setAverageRating(data.averageRating || 0);
          setTotalRatings(data.totalRatings || 0);
        }

        // Fetch user's specific rating if logged in
        if (currentUser) {
          const userRatingRef = doc(db, 'gig-ratings', gigId, 'user-ratings', currentUser.uid);
          const userRatingDoc = await getDoc(userRatingRef);
          
          if (userRatingDoc.exists()) {
            setUserRating(userRatingDoc.data().rating);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching ratings:', err);
        setError('Failed to load ratings');
        setLoading(false);
      }
    };

    if (gigId) {
      fetchRatingData();
    }
  }, [gigId, currentUser]);

  const handleRating = async (rating) => {
    if (!currentUser) {
      setError('Please login to rate this gig');
      return;
    }

    if (updating) return;

    try {
      setUpdating(true);
      setError('');

      const ratingRef = doc(db, 'gig-ratings', gigId);
      const userRatingRef = doc(db, 'gig-ratings', gigId, 'user-ratings', currentUser.uid);

      await runTransaction(db, async (transaction) => {
        const ratingDoc = await transaction.get(ratingRef);
        const userRatingDoc = await transaction.get(userRatingRef);

        let newTotalRatings = totalRatings;
        let newAverageRating = averageRating;

        if (userRatingDoc.exists()) {
          // Update existing rating
          const oldRating = userRatingDoc.data().rating;
          const totalPoints = averageRating * totalRatings;
          const newTotalPoints = totalPoints - oldRating + rating;
          newAverageRating = newTotalPoints / totalRatings;
        } else {
          // Add new rating
          newTotalRatings = totalRatings + 1;
          const totalPoints = averageRating * totalRatings;
          const newTotalPoints = totalPoints + rating;
          newAverageRating = newTotalPoints / newTotalRatings;
        }

        // Update the main rating document
        transaction.set(ratingRef, {
          averageRating: newAverageRating,
          totalRatings: newTotalRatings,
          updatedAt: new Date()
        });

        // Update the user's rating
        transaction.set(userRatingRef, {
          rating: rating,
          updatedAt: new Date()
        });

        // Update local state
        setAverageRating(newAverageRating);
        setTotalRatings(newTotalRatings);
        setUserRating(rating);
      });
    } catch (err) {
      console.error('Error updating rating:', err);
      setError('Failed to update rating');
    } finally {
      setUpdating(false);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const ratingValue = index + 1;
      const filled = ratingValue <= (hoverRating || userRating);
      
      return (
        <button
          key={index}
          onClick={() => handleRating(ratingValue)}
          onMouseEnter={() => setHoverRating(ratingValue)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={updating}
          className={`focus:outline-none transition-colors ${
            updating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          <Star
            size={20}
            className={`transform transition-transform hover:scale-110 ${
              filled
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={20} className="text-gray-200" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <div className="flex space-x-1">
          {renderStars()}
        </div>
        <div className="text-sm text-gray-600">
          {averageRating.toFixed(1)} ({totalRatings})
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export { RatingSystem };