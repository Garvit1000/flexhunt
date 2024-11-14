// hooks/useGigs.js
import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

export const useGigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const db = getFirestore();
        const gigsRef = collection(db, 'gigs');
        const snapshot = await getDocs(gigsRef);
        const gigsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGigs(gigsList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGigs();
  }, []);

  return { gigs, loading, error };
};