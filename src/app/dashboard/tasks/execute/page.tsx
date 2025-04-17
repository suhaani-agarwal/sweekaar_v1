
// // app/tasks/execute/page.tsx
// 'use client';
// import { useState, useEffect, useRef } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { tasks } from '@/lib/tasks';
// import { GoogleGenerativeAI } from "@google/generative-ai";

// export default function TaskExecution() {
//   const searchParams = useSearchParams();
//   const taskId = searchParams.get('task');
//   const repetitionMode = searchParams.get('mode') as 'fixed' | 'ai';
//   const customInterval = Number(searchParams.get('interval')) || 15;
  
//   const [currentStepIndex, setCurrentStepIndex] = useState(0);
//   const [isStepComplete, setIsStepComplete] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(customInterval);
//   const [detectionStatus, setDetectionStatus] = useState('waiting');
//   const [cameraActive, setCameraActive] = useState(false);
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);
//   const [cameraError, setCameraError] = useState<string | null>(null);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [debugMode, setDebugMode] = useState(false); // For testing
  
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const speechSynthRef = useRef<SpeechSynthesis | null>(null);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);


//   // Find the selected task
//   const task = tasks.find(t => t.id === taskId);
//   const currentStep = task?.steps[currentStepIndex];
//   const isLastStep = currentStepIndex === (task?.steps.length ?? 0) - 1;

//   useEffect(() => {
//     speechSynthRef.current = window.speechSynthesis;
    
//     const initCamera = async () => {
//       try {
//         // First check if we already have a stream
//         if (streamRef.current) {
//           streamRef.current.getTracks().forEach(track => track.stop());
//         }
    
//         const stream = await navigator.mediaDevices.getUserMedia({ 
//           video: {
//             facingMode: 'user',
//             width: { ideal: 640 },
//             height: { ideal: 480 }
//           }
//         });
        
//         if (!videoRef.current) {
//           console.error('Video ref not available');
//           setCameraError('Video element not found');
//           return;
//         }
    
//         const video = videoRef.current;
//         video.srcObject = stream;
//         streamRef.current = stream;
    
//         // Add event listeners for better error handling
//         video.onloadedmetadata = () => {
//           console.log('Video metadata loaded');
//           video.play()
//             .then(() => {
//               console.log('Video playback started');
//               setCameraActive(true);
//               setCameraError(null);
//             })
//             .catch(err => {
//               console.error('Video play failed:', err);
//               setCameraError('Camera feed could not start');
//               setCameraActive(false);
//             });
//         };
    
//         video.onerror = () => {
//           console.error('Video element error:', video.error);
//           setCameraError('Video error occurred');
//           setCameraActive(false);
//         };
    
//         // Add timeout in case onloadedmetadata doesn't fire
//         const timeout = setTimeout(() => {
//           if (!cameraActive && !cameraError) {
//             console.warn('Camera loading timeout');
//             setCameraError('Camera loading timed out');
//           }
//         }, 5000);
    
//         return () => clearTimeout(timeout);
//       } catch (err) {
//         console.error('Camera access error:', err);
//         let errorMessage = 'Could not access camera';
        
//         if (err instanceof DOMException) {
//           if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
//             errorMessage = 'No camera device found';
//           } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
//             errorMessage = 'Camera permission denied';
//           } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
//             errorMessage = 'Camera is already in use';
//           }
//         }
        
//         setCameraError(errorMessage);
//         setCameraActive(false);
//       }
//     };
    
//     initCamera();
    
//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//       }
//       if (speechSynthRef.current) {
//         speechSynthRef.current.cancel();
//       }
//       clearAllIntervals();
//     };
//   }, []);
  

//   const clearAllIntervals = () => {
//     if (intervalRef.current) clearInterval(intervalRef.current);
//     if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//   };

//   // Speak the current instruction
//   const speakInstruction = () => {
//     if (!speechSynthRef.current || !currentStep) {
//       console.warn('Speech synthesis not available or no current step');
//       return;
//     }
    
//     speechSynthRef.current.cancel();
//     const utterance = new SpeechSynthesisUtterance(currentStep.audioPrompt);
//     utterance.rate = 0.9;
//     utterance.pitch = 1.1;
    
//     utterance.onstart = () => setIsPlaying(true);
//     utterance.onend = () => {
//       setIsPlaying(false);
//       startDetection();
//     };
    
//     speechSynthRef.current.speak(utterance);
//   };

//   const captureImage = (): string | null => {
//   if (!videoRef.current || !canvasRef.current) {
//     console.error('Video or canvas ref not available');
//     return null;
//   }
  
//   const video = videoRef.current;
//   const canvas = canvasRef.current;
//   const context = canvas.getContext('2d');
  
//   if (!context) {
//     console.error('Could not get canvas context');
//     return null;
//   }
  
//   // Ensure video is ready
//   if (video.videoWidth === 0 || video.videoHeight === 0) {
//     console.error('Video dimensions not available');
//     return null;
//   }
  
//   canvas.width = video.videoWidth;
//   canvas.height = video.videoHeight;
//   context.drawImage(video, 0, 0, canvas.width, canvas.height);
//   console.log('Captured image:'); // For debugging
//   return canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality for smaller size
// };

//   // Analyze image with Gemini AI
//   const analyzeImageWithAI = async (imageData: string): Promise<boolean> => {
//     if (!currentStep) return false;
    
//     setIsAnalyzing(true);
//     setDetectionStatus('analyzing image...');
//     console.log('Analyzing image with AI...');
    
//     try {
//       const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
//       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
//       const base64Data = imageData.split(',')[1];
//       const imagePart = {
//         inlineData: {
//           data: base64Data,
//           mimeType: "image/jpeg"
//         }
//       };
      
//       const prompt = `Analyze this image and answer strictly with only 'yes' or 'no'. 
//       Is the person in the image ${currentStep.instruction}? 
//       Consider these criteria: ${currentStep.successCriteria}
//       Only respond with 'yes' or 'no'.`;
      
//       const result = await model.generateContent([prompt, imagePart]);
//       const response = await result.response;
//       const text = response.text().trim().toLowerCase();
      
//       console.log('AI Response:', text); // For debugging
      
//       return text === 'yes';
//     } catch (error) {
//       console.error('Error analyzing image:', error);
//       setDetectionStatus('analysis failed - trying again');
//       return false;
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   // Start detection process
//   const startDetection = () => {
//     if (!cameraActive) {
//       setDetectionStatus('camera not ready');
//       return;
//     }
    
//     setDetectionStatus('starting detection...');
    
//     // Clear any existing intervals
//     if (detectionIntervalRef.current) {
//       clearInterval(detectionIntervalRef.current);
//     }
    
//     // Initial immediate check
//     const performDetection = async () => {
//       const imageData = captureImage();
//       if (!imageData) {
//         setDetectionStatus('failed to capture image');
//         return;
//       }
      
//       setCapturedImage(imageData);
//       const isDetected = await analyzeImageWithAI(imageData);
      
//       if (isDetected) {
//         setDetectionStatus('task detected!');
//         setIsStepComplete(true);
//         clearInterval(detectionIntervalRef.current!);
        
//         setTimeout(() => {
//           moveToNextStep();
//         }, 2000);
//       } else {
//         setDetectionStatus('not detected - trying again');
//       }
//     };
    
//     // Run first check immediately
//     performDetection();
    
//     // Then set up interval for subsequent checks
//     detectionIntervalRef.current = setInterval(performDetection, 4000);
//   };

//   const moveToNextStep = () => {
//     if (!task) return;

//     // Clear detection interval when moving to next step
//     if (detectionIntervalRef.current) {
//       clearInterval(detectionIntervalRef.current);
//     }

//     if (isLastStep) {
//       console.log('Task completed!');
//     } else {
//       setCurrentStepIndex(currentStepIndex + 1);
//       setIsStepComplete(false);
//       setDetectionStatus('waiting');
//       setTimeLeft(repetitionMode === 'fixed' ? customInterval : 
//         task.steps[currentStepIndex + 1]?.defaultRepetition || 15);
//     }
//   };

//   // Handle step changes
//   useEffect(() => {
//     if (!currentStep) return;
    
//     // Start the process for each step
//     speakInstruction();
    
//     // For fixed interval mode, set up repetition
//     if (repetitionMode === 'fixed') {
//       intervalRef.current = setInterval(() => {
//         setTimeLeft(prev => {
//           if (prev <= 1) {
//             speakInstruction();
//             return customInterval;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     }

//     return () => {
//       clearAllIntervals();
//     };
//   }, [currentStepIndex, repetitionMode, customInterval, currentStep]);

//   if (!task) {
//     return (
//       <div className="max-w-3xl mx-auto p-6 text-center text-black">
//         <h2 className="text-2xl font-bold mb-4">Task Not Found</h2>
//         <p>Please select a valid task from the task selection page.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto p-6 text-black relative">
//       <div className="fixed top-4 right-4 z-30 bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white w-64 h-48">
//   {cameraError ? (
//     <div className="w-full h-full bg-red-100 flex flex-col items-center justify-center p-2">
//       <span className="text-red-600 text-sm mb-1">⚠️ Camera Error</span>
//       <p className="text-red-500 text-xs text-center">{cameraError}</p>
//     </div>
//   ) : cameraActive ? (
//     <div className="relative w-full h-full">
//       <video
//   ref={videoRef}
//   autoPlay
//   playsInline
//   muted
//   className="video-fix absolute top-0 left-0 w-full h-full object-cover"
// />
//       {isAnalyzing && (
//         <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
//           <div className="text-white text-sm font-medium animate-pulse">
//             Analyzing...
//           </div>
//         </div>
//       )}
//     </div>
//   ) : (
//     <div className="w-full h-full bg-gray-800 flex items-center justify-center">
//       <span className="text-white text-sm">Loading Camera...</span>
//     </div>
//   )}
// </div>

// {/* Add debug view (optional) */}
// {debugMode && capturedImage && (
//   <div className="fixed bottom-4 right-4 z-20 bg-white p-2 rounded shadow-lg">
//     <h3 className="text-sm font-bold mb-1">Last Captured Image:</h3>
//     <img 
//       src={capturedImage} 
//       alt="Last captured frame" 
//       className="w-32 h-32 object-contain border"
//     />
//     <button 
//       onClick={() => setDebugMode(false)}
//       className="mt-2 text-xs bg-gray-200 px-2 py-1 rounded"
//     >
//       Hide Debug
//     </button>
//   </div>
// )}

// {/* Add debug toggle button (optional) */}
// <button 
//   onClick={() => setDebugMode(!debugMode)}
//   className="fixed bottom-4 left-4 z-20 bg-gray-200 px-3 py-1 rounded text-sm"
// >
//   {debugMode ? 'Hide Debug' : 'Show Debug'}
// </button>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">{task.title}</h1>
//         <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
//           Step {currentStepIndex + 1} of {task.steps.length}
//         </span>
//       </div>

//       {currentStep && (
//         <>
//           <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//             <div className="flex items-start mb-6">
//               <div className="bg-blue-100 text-blue-800 w-16 h-16 rounded-full flex items-center justify-center text-3xl mr-4">
//                 {currentStepIndex + 1}
//               </div>
//               <div>
//                 <h2 className="text-xl font-semibold mb-2">{currentStep.instruction}</h2>
//                 <p className="text-gray-600">
//                   <span className="font-medium">Success when:</span> {currentStep.successCriteria}
//                 </p>
//               </div>
//             </div>

//             <div className="space-y-4">
//               <div className="bg-gray-100 p-4 rounded-lg">
//                 <div className="flex justify-between mb-2">
//                   <span className="font-medium">Status:</span>
//                   <span className={`font-medium ${
//                     detectionStatus.includes('detected') ? 'text-green-600' : 
//                     detectionStatus.includes('waiting') ? 'text-blue-600' : 'text-yellow-600'
//                   }`}>
//                     {detectionStatus}
//                   </span>
//                 </div>
                
//                 {repetitionMode === 'fixed' && (
//                   <div className="flex justify-between items-center">
//                     <span className="font-medium">Next prompt in:</span>
//                     <span className="text-blue-600 font-bold">{timeLeft}s</span>
//                   </div>
//                 )}
//               </div>

//               <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
//                 <h3 className="font-medium mb-2">Visual Prompt:</h3>
//                 <p className="text-blue-800 italic">"{currentStep.visualPrompt}"</p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-md p-6">
//             <h2 className="text-lg font-semibold mb-4">Task Progress</h2>
//             <div className="space-y-2">
//               {task.steps.map((step, index) => (
//                 <div
//                   key={step.id}
//                   className={`p-3 rounded-lg border flex items-center ${
//                     index < currentStepIndex
//                       ? 'bg-green-50 border-green-200'
//                       : index === currentStepIndex
//                       ? 'bg-blue-50 border-blue-300'
//                       : 'bg-gray-50 border-gray-200'
//                   }`}
//                 >
//                   <div
//                     className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-3 ${
//                       index < currentStepIndex
//                         ? 'bg-green-100 text-green-800'
//                         : index === currentStepIndex
//                         ? 'bg-blue-100 text-blue-800'
//                         : 'bg-gray-100 text-gray-500'
//                     }`}
//                   >
//                     {index < currentStepIndex ? (
//                       <span className="text-sm">✓</span>
//                     ) : (
//                       index + 1
//                     )}
//                   </div>
//                   <div>
//                     <p
//                       className={`${
//                         index < currentStepIndex ? 'line-through text-gray-500' : ''
//                       }`}
//                     >
//                       {step.instruction}
//                     </p>
//                     {index === currentStepIndex && (
//                       <p className="text-xs text-gray-500 mt-1">
//                         {step.successCriteria}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </>
//       )}

//       {isLastStep && isStepComplete && (
//         <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
//           <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 Task Completed! 🎉</h2>
//           <p className="text-green-700 mb-4">
//             Great job completing all steps of {task.title}!
//           </p>
//           <button
//             onClick={() => window.location.reload()}
//             className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
//           >
//             Start Again
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// app/tasks/execute/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { tasks } from '@/lib/tasks';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function TaskExecution() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('task');
  const repetitionMode = searchParams.get('mode') as 'fixed' | 'ai';
  const customInterval = Number(searchParams.get('interval')) || 15;
  const [speechQueue, setSpeechQueue] = useState<SpeechSynthesisUtterance[]>([]);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(customInterval);
  const [detectionStatus, setDetectionStatus] = useState('waiting');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);

  // Find the selected task
  const task = tasks.find(t => t.id === taskId);
  const currentStep = task?.steps[currentStepIndex];
  const isLastStep = currentStepIndex === (task?.steps.length ?? 0) - 1;

  // Updated camera initialization code
const initCamera = async () => {
  try {
    // Clear any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Ensure video element exists
    if (!videoRef.current) {
      // Wait briefly for the component to mount
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!videoRef.current) {
        throw new Error('Video element not available');
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });

    const video = videoRef.current;
    if (!video) {
      throw new Error('Video element disappeared');
    }

    // Store the stream reference
    streamRef.current = stream;
    video.srcObject = stream;

    // Wait for metadata to load
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        resolve();
      };

      const onError = () => {
        video.removeEventListener('error', onError);
        reject(new Error('Video metadata loading failed'));
      };

      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
    });

    // Attempt to play the video with retries
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      try {
        await video.play();
        setCameraActive(true);
        setCameraError(null);
        return; // Success!
      } catch (err) {
        const lastError = err;
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempts));
        }
      }
    }

    throw lastError || new Error('Failed to play video after multiple attempts');

  } catch (err) {
    console.error('Camera initialization error:', err);
    let errorMessage = 'Could not access camera';
    
    if (err instanceof DOMException) {
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera device found';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use';
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    setCameraError(errorMessage);
    setCameraActive(false);
    
    // Clean up if we got a stream but failed to play
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }
};

  // Update the useEffect that initializes speech synthesis
// useEffect(() => {
//   // Initialize speech synthesis
//   if ('speechSynthesis' in window) {
//     speechSynthRef.current = window.speechSynthesis;
    
//     // Some browsers need voices to be loaded first
//     const loadVoices = () => {
//       const voices = speechSynthRef.current?.getVoices();
//       console.log('Available voices:', voices);
//     };
    
//     speechSynthRef.current.onvoiceschanged = loadVoices;
//     loadVoices();
//   } else {
//     console.warn('Speech Synthesis API not supported');
//     setDetectionStatus('Voice instructions not supported');
//   }

//   initCamera();

//   return () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//     }
//     if (speechSynthRef.current) {
//       speechSynthRef.current.cancel();
//     }
//     clearAllIntervals();
//   };
// }, []);
const initSpeech = () => {
  if ('speechSynthesis' in window) {
    speechSynthRef.current = window.speechSynthesis;
    
    // Chrome needs this to load voices properly
    const loadVoices = () => {
      const voices = speechSynthRef.current?.getVoices();
      if (voices && voices.length > 0) {
        console.log('Voices loaded:', voices);
      }
    };
    
    speechSynthRef.current.onvoiceschanged = loadVoices;
    loadVoices();
  }
};

useEffect(() => {

  initSpeech();
  initCamera();

  return () => {
    // Cleanup camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Cleanup speech more gently
    if (speechSynthRef.current && speechSynthRef.current.speaking) {
      // Don't cancel if speech is nearly done
      speechSynthRef.current.cancel();
    }
    
    clearAllIntervals();
  };
}, []);

  const clearAllIntervals = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Add this effect to detect initial user interaction
useEffect(() => {
  const handleFirstInteraction = () => {
    setUserInteracted(true);
    window.removeEventListener('click', handleFirstInteraction);
  };

  window.addEventListener('click', handleFirstInteraction);
  return () => window.removeEventListener('click', handleFirstInteraction);
}, []);

const processSpeechQueue = () => {
  if (speechSynthRef.current && !speechSynthRef.current.speaking && speechQueue.length > 0) {
    const nextUtterance = speechQueue[0];
    speechSynthRef.current.speak(nextUtterance);
    setSpeechQueue(prev => prev.slice(1));
  }
};

  // const speakInstruction = () => {
  //   if (!userInteracted) {
  //     console.warn('Speech synthesis requires user interaction first');
  //     setDetectionStatus('Click anywhere to enable voice');
  //     return;
  //   }
  
  //   try {
  //     if (!('speechSynthesis' in window)) {
  //       throw new Error('Speech synthesis not supported');
  //     }
  
  //     // Initialize if not already done
  //     if (!speechSynthRef.current) {
  //       speechSynthRef.current = window.speechSynthesis;
  //     }
  
  //     if (!currentStep) {
  //       throw new Error('No current step available');
  //     }
  
  //     // Don't cancel existing speech if we're already speaking
  //     if (!isPlaying) {
  //       speechSynthRef.current.cancel();
  //     }
  
  //     const utterance = new SpeechSynthesisUtterance(currentStep.audioPrompt);
  //     utterance.rate = 0.9;
  //     utterance.pitch = 1.1;
      
  //     // Use let for utterance to avoid closure issues
  //     let utteranceCompleted = false;
  
  //     utterance.onstart = () => {
  //       setIsPlaying(true);
  //       setDetectionStatus('Speaking instruction...');
  //     };
      
  //     utterance.onend = () => {
  //       utteranceCompleted = true;
  //       setIsPlaying(false);
  //       if (detectionStatus === 'waiting') {
  //         startDetection();
  //       }
  //     };
      
  //     utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
  //       // Don't treat canceled errors as actual errors
  //       if (event.error !== 'canceled') {
  //         console.error('Speech error:', event.error);
  //         setIsPlaying(false);
          
  //         switch(event.error) {
  //           case 'not-allowed':
  //             setDetectionStatus('Enable microphone permission');
  //             break;
  //           case 'interrupted':
  //             setDetectionStatus('Speech interrupted');
  //             break;
  //           default:
  //             setDetectionStatus('Voice error - trying again');
  //         }
  //       }
  //     };
  
  //     // Only speak if not currently playing
  //     if (!isPlaying) {
  //       speechSynthRef.current.speak(utterance);
  //     }
  
  //   } catch (error) {
  //     console.error('Speak error:', error);
  //     setIsPlaying(false);
  //     setDetectionStatus('Cannot speak instruction');
  //   }
  // };
  const speakInstruction = () => {
    if (!userInteracted || !currentStep) return;
  
    const utterance = new SpeechSynthesisUtterance(currentStep.audioPrompt);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
  
    utterance.onend = () => {
      setIsPlaying(false);
      processSpeechQueue();
      if (detectionStatus === 'waiting') {
        startDetection();
      }
    };
  
    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        console.error('Speech error:', event.error);
      }
      setIsPlaying(false);
      processSpeechQueue();
    };
  
    if (isPlaying) {
      // Add to queue if already speaking
      setSpeechQueue(prev => [...prev, utterance]);
    } else {
      setIsPlaying(true);
      speechSynthRef.current?.cancel();
      speechSynthRef.current?.speak(utterance);
    }
  };
  
  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Could not get canvas context');
      return null;
    }
    
    // Ensure video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video dimensions not available');
      return null;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Analyze image with Gemini AI
  const analyzeImageWithAI = async (imageData: string): Promise<boolean> => {
    if (!currentStep) return false;
    
    setIsAnalyzing(true);
    setDetectionStatus('analyzing image...');
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const base64Data = imageData.split(',')[1];
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };
      
      const prompt = `Analyze this image and answer strictly with only 'yes' or 'no'. 
      Is the person in the image ${currentStep.instruction}? 
      Consider these criteria: ${currentStep.successCriteria}
      Only respond with 'yes' or 'no'.`;
      
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text().trim().toLowerCase();
      
      return text === 'yes';
    } catch (error) {
      console.error('Error analyzing image:', error);
      setDetectionStatus('analysis failed - trying again');
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start detection process
  const startDetection = () => {
    if (!cameraActive) {
      setDetectionStatus('camera not ready');
      return;
    }
    
    setDetectionStatus('starting detection...');
    
    // Clear any existing intervals
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    // Initial immediate check
    const performDetection = async () => {
      const imageData = captureImage();
      if (!imageData) {
        setDetectionStatus('failed to capture image');
        return;
      }
      
      setCapturedImage(imageData);
      const isDetected = await analyzeImageWithAI(imageData);
      
      if (isDetected) {
        setDetectionStatus('task detected!');
        setIsStepComplete(true);
        clearInterval(detectionIntervalRef.current!);
        
        setTimeout(() => {
          moveToNextStep();
        }, 2000);
      } else {
        setDetectionStatus('not detected - trying again');
      }
    };
    
    // Run first check immediately
    performDetection();
    
    // Then set up interval for subsequent checks
    detectionIntervalRef.current = setInterval(performDetection, 4000);
  };

  const moveToNextStep = () => {
    if (!task) return;

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    if (isLastStep) {
      console.log('Task completed!');
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsStepComplete(false);
      setDetectionStatus('waiting');
      setTimeLeft(repetitionMode === 'fixed' ? customInterval : 
        task.steps[currentStepIndex + 1]?.defaultRepetition || 15);
    }
  };

  // Handle step changes
  useEffect(() => {
    if (!currentStep) return;
    
    speakInstruction();

    clearAllIntervals();
    
    // Set up the repetition based on mode
  if (repetitionMode === 'fixed') {
    // For fixed interval mode, set up the countdown and speaking
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          speakInstruction();
          return customInterval;
        }
        return prev - 1;
      });
    }, 1000);
  } else if (repetitionMode === 'ai') {
    // For AI mode, use the step's default repetition time
    const interval = currentStep.defaultRepetition || 15;
    setTimeLeft(interval);
    
    intervalRef.current = setInterval(() => {
      speakInstruction();
    }, interval * 1000);
  }

  return () => {
    clearAllIntervals();
  };
}, [currentStepIndex, repetitionMode, customInterval, currentStep]);

  if (!task) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-black">
        <h2 className="text-2xl font-bold mb-4">Task Not Found</h2>
        <p>Please select a valid task from the task selection page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 text-black relative">
      {!userInteracted && (
  <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg max-w-md text-center">
      <h3 className="text-lg font-bold mb-4">Enable Voice Instructions</h3>
      <p className="mb-4">Click the button below to enable voice guidance</p>
      <button
        onClick={() => setUserInteracted(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Enable Voice
      </button>
    </div>
  </div>
)}

      {/* Camera Preview */}
      <div className="fixed top-4 right-4 z-30 bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white w-64 h-48">
        {cameraError ? (
          <div className="w-full h-full bg-red-100 flex flex-col items-center justify-center p-2">
            <span className="text-red-600 text-sm mb-1">⚠️ Camera Error</span>
            <p className="text-red-500 text-xs text-center">{cameraError}</p>
            <button 
              onClick={initCamera}
              className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
            >
              Retry Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <div className="text-white text-sm font-medium animate-pulse">
                  Analyzing...
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Debug View */}
      {debugMode && capturedImage && (
        <div className="fixed bottom-4 right-4 z-20 bg-white p-2 rounded shadow-lg">
          <h3 className="text-sm font-bold mb-1">Last Captured Image:</h3>
          <img 
            src={capturedImage} 
            alt="Last captured frame" 
            className="w-32 h-32 object-contain border"
          />
          <button 
            onClick={() => setDebugMode(false)}
            className="mt-2 text-xs bg-gray-200 px-2 py-1 rounded"
          >
            Hide Debug
          </button>
        </div>
      )}

      {/* Debug Toggle */}
      <button 
        onClick={() => setDebugMode(!debugMode)}
        className="fixed bottom-4 left-4 z-20 bg-gray-200 px-3 py-1 rounded text-sm"
      >
        {debugMode ? 'Hide Debug' : 'Show Debug'}
      </button>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Content */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          Step {currentStepIndex + 1} of {task.steps.length}
        </span>
      </div>

      {currentStep && (
        <>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-start mb-6">
              <div className="bg-blue-100 text-blue-800 w-16 h-16 rounded-full flex items-center justify-center text-3xl mr-4">
                {currentStepIndex + 1}
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">{currentStep.instruction}</h2>
                <p className="text-gray-600">
                  <span className="font-medium">Success when:</span> {currentStep.successCriteria}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Status:</span>
                  <span className={`font-medium ${
                    detectionStatus.includes('detected') ? 'text-green-600' : 
                    detectionStatus.includes('waiting') ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {detectionStatus}
                  </span>
                </div>
                
                {repetitionMode === 'fixed' && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Next prompt in:</span>
                    <span className="text-blue-600 font-bold">{timeLeft}s</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Visual Prompt:</h3>
                <p className="text-blue-800 italic">"{currentStep.visualPrompt}"</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Task Progress</h2>
            <div className="space-y-2">
              {task.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border flex items-center ${
                    index < currentStepIndex
                      ? 'bg-green-50 border-green-200'
                      : index === currentStepIndex
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-3 ${
                      index < currentStepIndex
                        ? 'bg-green-100 text-green-800'
                        : index === currentStepIndex
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <span className="text-sm">✓</span>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div>
                    <p
                      className={`${
                        index < currentStepIndex ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {step.instruction}
                    </p>
                    {index === currentStepIndex && (
                      <p className="text-xs text-gray-500 mt-1">
                        {step.successCriteria}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {isLastStep && isStepComplete && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 Task Completed! 🎉</h2>
          <p className="text-green-700 mb-4">
            Great job completing all steps of {task.title}!
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Start Again
          </button>
        </div>
      )}
    </div>
  );
}