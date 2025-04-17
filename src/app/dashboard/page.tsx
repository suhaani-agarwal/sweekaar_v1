// app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Clear session cookie and redirect to login
        await fetch('/api/auth/session', { method: 'DELETE' });
        router.push('/login');
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setError('No user data found');
          // Clear session and redirect to login
          await fetch('/api/auth/session', { method: 'DELETE' });
          await signOut(auth);
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Error loading user data');
        // Clear session and redirect to login
        await fetch('/api/auth/session', { method: 'DELETE' });
        await signOut(auth);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      // Clear the session cookie
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Error during logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No user data available</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white mt-10 rounded shadow text-black">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold">Welcome, {userData.parentName} 👋</h2>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold text-lg mb-2">Child Information</h3>
          <p><strong>Name:</strong> {userData.childName}</p>
          <p><strong>Age:</strong> {userData.age}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-semibold text-lg mb-2">Parent Information</h3>
          <p><strong>Name:</strong> {userData.parentName}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Contact:</strong> {userData.parentNumber}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-semibold text-lg mb-2">Other Details</h3>
          <p><strong>Location:</strong> {userData.location}</p>
          <p><strong>Issue Faced:</strong> {userData.problem}</p>
        </div>
      </div>
    </div>
  );
}