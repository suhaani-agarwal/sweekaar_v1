'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Daily task type definition
type DailyTask = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

// Therapist type definition
type Therapist = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  available: boolean;
};

// Meeting type definition
type Meeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  link: string;
};

// Component for the daily task card
function DailyTaskCard({ tasks, onToggleTask }: { tasks: DailyTask[], onToggleTask: (id: string) => void }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-black">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">🧩</span>
        <h3 className="text-xl font-bold">Daily Task Centre</h3>
      </div>
      <p className="text-gray-600 mb-4">Help your child build routine and independence with these daily tasks:</p>
      <Link href='/dashboard/tasks'><button className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center border-2 rounded-2xl p-4">
        <span>Start Daily Tasks</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button></Link>
    </div>
  );
}

// Component for the community section card
function CommunityCard() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-black">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">💬</span>
        <h3 className="text-xl font-bold">Community Section</h3>
      </div>
      <p className="text-gray-600 mb-4">Connect with other parents and share experiences:</p>
      <div className="space-y-3">
        {/* <Link href="/community/support-groups" className="block p-3 bg-blue-50 rounded hover:bg-blue-100 transition flex justify-between items-center"> */}
          <div className='block p-3 bg-blue-50 rounded hover:bg-blue-100 transition flex justify-between items-center'>
            <p className="font-medium text-blue-700 ">Parent Support Groups</p>
            <p className="text-sm text-blue-600">Join 2,500+ parents</p>
          </div>
          <div className='block p-3 bg-blue-50 rounded hover:bg-blue-100 transition flex justify-between items-center'>
            <p className="font-medium text-blue-700">Live Chat Spaces</p>
            <p className="text-sm text-blue-600">42 parents online now</p>
          </div>
        <Link href="/dashboard/community" className="block p-3 bg-blue-50 rounded hover:bg-blue-100 transition flex justify-between items-center border-2 border-blue-700">
          <div className="font-medium text-blue-700 flex items-center justify-center">View your support Community!</div>
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Component for the AI exercises card
function AIExercisesCard() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-black">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">💪</span>
        <h3 className="text-xl font-bold">AI Muscle Exercises</h3>
      </div>
      <p className="text-gray-600 mb-4">AI-powered physical exercises designed for your child's specific needs:</p>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Today's Recommended Exercise</h4>
        <p className="text-blue-700 mb-3">Fine Motor Control: Hand-Eye Coordination</p>
        <p className="text-sm text-blue-600 mb-4">This 10-minute session helps improve dexterity and focus.</p>
        <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Start Exercise
        </button>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Link href="/exercises/all" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
          View all exercises
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
        <Link href="/exercises/create" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
          Custom plan
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Component for the Chrome extension card
function ChromeExtensionCard() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-black">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">🧩</span>
        <h3 className="text-xl font-bold">Chrome Extension</h3>
      </div>
      <p className="text-gray-600 mb-4">Our Chrome extension helps your child with communication and daily browsing:</p>
      <div className="flex items-center bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex-shrink-0 mr-4 bg-blue-100 p-3 rounded-lg">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        </div>
        <div>
          <h4 className="font-medium text-gray-800">Sweekaar Communication Helper</h4>
          <p className="text-sm text-gray-600">Makes websites more accessible for neurodivergent children</p>
        </div>
      </div>
      <div className="flex space-x-3">
        <a 
          href="https://chrome.google.com/webstore" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-center text-sm"
        >
          Install Extension
        </a>
        <Link 
          href="/extension/guide"
          className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition text-center text-sm"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}

// Component for the therapist connection card
function TherapistCard({ therapists }: { therapists: Therapist[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-black">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">🧠</span>
        <h3 className="text-xl font-bold">Connect With Therapists</h3>
      </div>
      <p className="text-gray-600 mb-4">Find and book sessions with qualified therapists:</p>
      <div className="space-y-3">
        {therapists.map(therapist => (
          <div key={therapist.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0">
            <div>
              <p className="font-medium text-gray-800">{therapist.name}</p>
              <p className="text-sm text-gray-600">{therapist.specialty}</p>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`w-4 h-4 ${i < therapist.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
            </div>
            <button 
              disabled={!therapist.available}
              className={`px-4 py-2 rounded text-sm font-medium ${
                therapist.available 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {therapist.available ? 'Book Now' : 'Unavailable'}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Link href="/therapists" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
          View all therapists
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Component for scheduled meetings card
function MeetingsCard({ meetings }: { meetings: Meeting[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-black">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">📅</span>
        <h3 className="text-xl font-bold">Scheduled Meets</h3>
      </div>
      <p className="text-gray-600 mb-4">Your upcoming sessions and meetups:</p>
      {meetings.length > 0 ? (
        <div className="space-y-3">
          {meetings.map(meeting => (
            <div key={meeting.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-800">{meeting.title}</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">Upcoming</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {meeting.date}
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {meeting.time}
              </div>
              <div className="mt-3 flex">
                <a 
                  href={meeting.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-center text-sm mr-2"
                >
                  Join Meeting
                </a>
                <button className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="text-gray-600">No upcoming meetings</p>
          <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm">
            Schedule a Meeting
          </button>
        </div>
      )}
    </div>
  );
}

// Component for parent guidance card
function GuidanceCard({ condition }: { condition: string }) {
  // Determine guidance resources based on child's condition
  const getConditionSpecificGuidance = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'autism':
        return [
          { title: "Autism Communication Strategies", description: "How to improve daily communication", link: "/guides/autism/communication" },
          { title: "Sensory Processing Tips", description: "Managing sensory overload", link: "/guides/autism/sensory" },
          { title: "Social Skills Development", description: "Activities to build social confidence", link: "/guides/autism/social" }
        ];
      case 'cerebral palsy':
      case 'cp':
        return [
          { title: "Physical Therapy at Home", description: "Simple exercises for motor skills", link: "/guides/cp/physical-therapy" },
          { title: "Assistive Technology Guide", description: "Tools to improve independence", link: "/guides/cp/assistive-tech" },
          { title: "Nutrition for CP", description: "Diet and feeding strategies", link: "/guides/cp/nutrition" }
        ];
      case 'adhd':
        return [
          { title: "ADHD Focus Techniques", description: "Strategies to improve concentration", link: "/guides/adhd/focus" },
          { title: "Routine Building for ADHD", description: "Creating effective daily structures", link: "/guides/adhd/routine" },
          { title: "Managing Hyperactivity", description: "Channeling energy positively", link: "/guides/adhd/hyperactivity" }
        ];
      default:
        return [
          { title: "General Neurodiversity Support", description: "Core strategies for all parents", link: "/guides/general/support" },
          { title: "Building Confidence & Independence", description: "Helping your child thrive", link: "/guides/general/confidence" },
          { title: "Communication Techniques", description: "Effective parent-child communication", link: "/guides/general/communication" }
        ];
    }
  };

  const guidanceResources = getConditionSpecificGuidance(condition);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">🧭</span>
        <h3 className="text-xl font-bold">Guidance for Parents</h3>
      </div>
      <p className="text-gray-600 mb-4">Resources tailored for parents of children with {condition || 'neurodiversity'}:</p>
      <div className="space-y-3">
        {guidanceResources.map((resource, index) => (
          <Link key={index} href={resource.link} className="block p-3 bg-blue-50 rounded hover:bg-blue-100 transition">
            <p className="font-medium text-blue-700">{resource.title}</p>
            <p className="text-sm text-blue-600">{resource.description}</p>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <Link href="/guides/all" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
          All resources
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
        <Link href="/guides/recommended" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
          Get personalized recommendations
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Component for screening tests card
function ScreeningTestsCard({ condition }: { condition: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-black">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">🧪</span>
        <h3 className="text-xl font-bold">Screening Tests</h3>
      </div>
      <p className="text-gray-600 mb-4">Take professional screening tests to track your child's development:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href="/tests/autism" className={`p-4 rounded-lg text-center ${condition.toLowerCase() === 'autism' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} hover:opacity-90 transition`}>
          <div className="font-medium mb-1">Autism Screening Test</div>
          <div className="text-sm">10-15 minutes</div>
        </Link>
        <Link href="/tests/cp" className={`p-4 rounded-lg text-center ${condition.toLowerCase() === 'cerebral palsy' || condition.toLowerCase() === 'cp' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} hover:opacity-90 transition`}>
          <div className="font-medium mb-1">Cerebral Palsy Assessment</div>
          <div className="text-sm">15-20 minutes</div>
        </Link>
        <Link href="/tests/adhd" className={`p-4 rounded-lg text-center ${condition.toLowerCase() === 'adhd' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} hover:opacity-90 transition`}>
          <div className="font-medium mb-1">ADHD Evaluation</div>
          <div className="text-sm">10-15 minutes</div>
        </Link>
        <Link href="/tests/development" className="p-4 rounded-lg text-center bg-gray-100 text-gray-800 hover:opacity-90 transition">
          <div className="font-medium mb-1">General Development</div>
          <div className="text-sm">5-10 minutes</div>
        </Link>
      </div>
      <div className="mt-4">
        <Link href="/tests/history" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
          View previous test results
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Main dashboard component
export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Daily tasks state
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    { id: '1', title: 'Brush teeth', description: 'Morning and evening routine', completed: false },
    { id: '2', title: 'Get dressed', description: 'Practice putting on socks and shirts', completed: false },
    { id: '3', title: 'Practice communication', description: 'Use picture cards for 15 minutes', completed: false },
    { id: '4', title: 'Physical exercise', description: 'Do 10 minutes of recommended exercises', completed: false },
    { id: '5', title: 'Reading time', description: 'Read together for 15 minutes', completed: false },
  ]);
  
  // Mock therapist data
  const therapists: Therapist[] = [
    { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Behavioral Therapy', rating: 5, available: true },
    { id: '2', name: 'Dr. Michael Chen', specialty: 'Occupational Therapy', rating: 4, available: true },
    { id: '3', name: 'Dr. Aisha Patel', specialty: 'Speech Therapy', rating: 5, available: false },
  ];
  
  // Mock meeting data
  const meetings: Meeting[] = [
    { 
      id: '1', 
      title: 'Speech Therapy Session', 
      date: 'April 19, 2025', 
      time: '10:00 AM - 11:00 AM',
      link: 'https://meet.zoom.us/j/123456789',
    },
    { 
      id: '2', 
      title: 'Parent Support Group', 
      date: 'April 21, 2025', 
      time: '7:00 PM - 8:30 PM',
      link: 'https://meet.zoom.us/j/987654321',
    },
  ];

  // Toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    setDailyTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

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

  // Extract condition from problem field or default to empty string
  const childCondition = userData.problem?.toLowerCase().includes('autism') 
    ? 'Autism' 
    : userData.problem?.toLowerCase().includes('cerebral palsy') || userData.problem?.toLowerCase().includes('cp')
    ? 'Cerebral Palsy'
    : userData.problem?.toLowerCase().includes('adhd')
    ? 'ADHD'
    : 'Neurodiversity';

  return (
    <div className="bg-gray-50 min-h-screen pb-12 text-black">
      {/* Header Section */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Sweekaar</h1>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Parent Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowProfileModal(true)}
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Profile
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-600 rounded-lg p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Welcome, {userData.parentName} !</h2>
              <p className="mt-2 text-blue-100">
                Supporting {userData.childName}'s journey with {childCondition}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button className="px-4 py-2 bg-white text-blue-600 rounded hover:bg-blue-50 transition font-medium">
                View Child Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Daily Tasks Section */}
          <DailyTaskCard tasks={dailyTasks} onToggleTask={toggleTaskCompletion} />
          
          {/* Community Section */}
          <CommunityCard />
          
          {/* AI Exercises Section */}
          <AIExercisesCard />
          
          {/* Chrome Extension Section */}
          <ChromeExtensionCard />
          
          {/* Therapist Connection Section */}
          <TherapistCard therapists={therapists} />
          
          {/* Scheduled Meetings Section */}
          <MeetingsCard meetings={meetings} />
          
          {/* Parent Guidance Section */}
          <GuidanceCard condition={childCondition} />
          
          {/* Screening Tests Section */}
          <ScreeningTestsCard condition={childCondition} />
        </div>

        {/* Child & Parent Info Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <span className="text-blue-600 mr-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </span>
              Child Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Name</p>
                <p className="font-medium">{userData.childName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Age</p>
                <p className="font-medium">{userData.age} years</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Condition</p>
                <p className="font-medium">{childCondition}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Location</p>
                <p className="font-medium">{userData.location}</p>
              </div>
            </div>
            <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
              Update child information
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <span className="text-blue-600 mr-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </span>
              Parent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Name</p>
                <p className="font-medium">{userData.parentName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Email</p>
                <p className="font-medium">{userData.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Contact</p>
                <p className="font-medium">{userData.parentNumber}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Member Since</p>
                <p className="font-medium">April 2025</p>
              </div>
            </div>
            <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
              Edit profile
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal - simple implementation */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="parentName">
                  Parent Name
                </label>
                <input 
                  id="parentName" 
                  type="text" 
                  defaultValue={userData.parentName}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                  Email
                </label>
                <input 
                  id="email" 
                  type="email" 
                  defaultValue={userData.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="phone">
                  Phone Number
                </label>
                <input 
                  id="phone" 
                  type="text" 
                  defaultValue={userData.parentNumber}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    // Here you would implement the update logic with Firebase
                    alert('Profile updated! (This is a demo)');
                    setShowProfileModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}