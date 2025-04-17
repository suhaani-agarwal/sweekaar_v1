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
//   const [detectionStatus, setDetectionStatus] = useState('Initializing...');
//   const [cameraActive, setCameraActive] = useState(false);
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);
//   const [cameraError, setCameraError] = useState<string | null>(null);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [debugMode, setDebugMode] = useState(false);
//   const [userInteracted, setUserInteracted] = useState(false);
//   const [analysisAttempts, setAnalysisAttempts] = useState(0);
//   const [captureEnabled, setCaptureEnabled] = useState(true);

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const speechSynthRef = useRef<SpeechSynthesis | null>(null);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);

//   // Find the selected task
//   const task = tasks.find(t => t.id === taskId);
//   const currentStep = task?.steps[currentStepIndex];
//   const isLastStep = currentStepIndex === (task?.steps.length ?? 0) - 1;

//   // Initialize camera with retries
//   const initCamera = async (attempt = 1) => {
//     try {
//       console.log(`Initializing camera (attempt ${attempt})...`);
//       setDetectionStatus('Initializing camera...');
      
//       // Clean up any existing stream
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//         streamRef.current = null;
//       }

//       if (!videoRef.current) {
//         throw new Error('Video element not available');
//       }

//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         video: {
//           facingMode: 'user',
//           width: { ideal: 640 },
//           height: { ideal: 480 }
//         }
//       });

//       streamRef.current = stream;
//       videoRef.current.srcObject = stream;

//       // Wait for video to be ready
//       await new Promise<void>((resolve, reject) => {
//         const timer = setTimeout(() => {
//           reject(new Error('Camera timeout'));
//         }, 5000);

//         videoRef.current!.onloadedmetadata = () => {
//           clearTimeout(timer);
//           resolve();
//         };

//         videoRef.current!.onerror = () => {
//           clearTimeout(timer);
//           reject(new Error('Video error'));
//         };
//       });

//       // Play the video
//       await videoRef.current.play();
      
//       setCameraActive(true);
//       setCameraError(null);
//       setDetectionStatus('Camera ready');
//       console.log('Camera successfully initialized');
      
//       // Start continuous capture
//       startContinuousCapture();
      
//     } catch (err) {
//       console.error(`Camera init error (attempt ${attempt}):`, err);
      
//       if (attempt < 3) {
//         // Retry after delay
//         await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
//         return initCamera(attempt + 1);
//       }
      
//       let errorMessage = 'Camera error';
//       if (err instanceof DOMException) {
//         if (err.name === 'NotFoundError') errorMessage = 'No camera found';
//         else if (err.name === 'NotAllowedError') errorMessage = 'Permission denied';
//         else if (err.name === 'NotReadableError') errorMessage = 'Camera in use';
//       }
      
//       setCameraError(errorMessage);
//       setCameraActive(false);
//       setDetectionStatus(errorMessage);
      
//       // Clean up if we got a stream but failed to play
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//         streamRef.current = null;
//       }
//     }
//   };

//   // Initialize speech synthesis
//   const initSpeech = () => {
//     if ('speechSynthesis' in window) {
//       speechSynthRef.current = window.speechSynthesis;
//       console.log('Speech synthesis initialized');
//     }
//   };

//   useEffect(() => {
//     initSpeech();
//     initCamera();

//     return () => {
//       // Cleanup on unmount
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//       }
//       if (speechSynthRef.current?.speaking) {
//         speechSynthRef.current.cancel();
//       }
//       clearAllIntervals();
//     };
//   }, []);

//   const clearAllIntervals = () => {
//     if (intervalRef.current) clearInterval(intervalRef.current);
//     if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//   };

//   const stopCaptureInterval = () => {
//     if (captureIntervalRef.current) {
//       clearInterval(captureIntervalRef.current);
//       captureIntervalRef.current = null;
//       console.log('Stopped image capture interval');
//     }
//   };

//   // Start capturing images every 3 seconds
//   const startContinuousCapture = () => {
//     stopCaptureInterval(); // Clear any existing interval
    
//     console.log('Starting continuous image capture every 3 seconds');
//     setDetectionStatus('Starting image capture...');
//     setCaptureEnabled(true);
    
//     // Initial immediate capture
//     captureAndAnalyze();
    
//     // Set up interval for continuous capture
//     captureIntervalRef.current = setInterval(() => {
//       if (captureEnabled) {
//         captureAndAnalyze();
//       }
//     }, 3000);
//   };

//   // Capture image and analyze it
//   const captureAndAnalyze = async () => {
//     if (!cameraActive || !currentStep || isAnalyzing) {
//       console.log('Skipping capture - camera not active/no step/currently analyzing');
//       return;
//     }

//     console.log(`Capturing image (Attempt ${analysisAttempts + 1})`);
//     setDetectionStatus(`Capturing image (${analysisAttempts + 1})`);
    
//     try {
//       const imageData = captureImage();
//       if (!imageData) {
//         throw new Error('Failed to capture image');
//       }

//       setCapturedImage(imageData);
//       console.log('Image captured, sending for analysis...');
//       setDetectionStatus('Analyzing image...');
      
//       const isDetected = await analyzeImageWithAI(imageData);
//       setAnalysisAttempts(prev => prev + 1);
      
//       if (isDetected) {
//         console.log('Task detected in image!');
//         setDetectionStatus('Task completed!');
//         setIsStepComplete(true);
//         setCaptureEnabled(false);
//         stopCaptureInterval();
        
//         // Move to next step after delay
//         timeoutRef.current = setTimeout(() => {
//           moveToNextStep();
//         }, 2000);
//       } else {
//         console.log('Task not detected in image');
//         setDetectionStatus(`Not detected (attempt ${analysisAttempts + 1})`);
//       }
//     } catch (error) {
//       console.error('Capture/Analysis error:', error);
//       setDetectionStatus('Capture failed');
//     }
//   };

//   const captureImage = (): string | null => {
//     try {
//       if (!videoRef.current || !canvasRef.current) {
//         throw new Error('Video or canvas not available');
//       }

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       const context = canvas.getContext('2d');
      
//       if (!context) {
//         throw new Error('Could not get canvas context');
//       }

//       // Ensure video is ready
//       if (video.videoWidth === 0 || video.videoHeight === 0) {
//         throw new Error('Video not ready');
//       }

//       // Set canvas dimensions to match video
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
      
//       // Draw video frame to canvas
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
//       // Convert to JPEG
//       return canvas.toDataURL('image/jpeg', 0.8);
//     } catch (error) {
//       console.error('Error capturing image:', error);
//       return null;
//     }
//   };

//   const analyzeImageWithAI = async (imageData: string): Promise<boolean> => {
//     if (!currentStep) return false;
    
//     setIsAnalyzing(true);
//     console.log('Sending image to Gemini AI for analysis...');
    
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
      
//       console.log('Sending prompt to Gemini:', prompt);
//       const result = await model.generateContent([prompt, imagePart]);
//       const response = await result.response;
//       const text = response.text().trim().toLowerCase();
      
//       console.log('Received response from Gemini:', text);
//       return text === 'yes';
//     } catch (error) {
//       console.error('Error analyzing image:', error);
//       return false;
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   const speakInstruction = () => {
//     if (!userInteracted || !currentStep || !speechSynthRef.current) return;
    
//     console.log('Speaking instruction:', currentStep.audioPrompt);
//     const utterance = new SpeechSynthesisUtterance(currentStep.audioPrompt);
//     utterance.rate = 0.9;
//     utterance.pitch = 1.1;
  
//     utterance.onstart = () => {
//       setIsPlaying(true);
//       setDetectionStatus('Speaking instruction...');
//       console.log('Speech started');
//     };
    
//     utterance.onend = () => {
//       setIsPlaying(false);
//       console.log('Speech ended');
//     };
    
//     utterance.onerror = (event) => {
//       setIsPlaying(false);
//       console.error('Speech error:', event.error);
//     };
  
//     speechSynthRef.current.cancel();
//     speechSynthRef.current.speak(utterance);
//   };

//   const moveToNextStep = () => {
//     if (!task) return;

//     console.log(`Moving from step ${currentStepIndex} to ${currentStepIndex + 1}`);
//     setAnalysisAttempts(0);

//     if (isLastStep) {
//       console.log('Task completed!');
//     } else {
//       setCurrentStepIndex(currentStepIndex + 1);
//       setIsStepComplete(false);
//       setDetectionStatus('Starting next step...');
//       setTimeLeft(repetitionMode === 'fixed' ? customInterval : 
//         task.steps[currentStepIndex + 1]?.defaultRepetition || 15);
      
//       // Restart capture for new step
//       startContinuousCapture();
//     }
//   };

//   // Handle step changes
//   useEffect(() => {
//     if (!currentStep) return;
    
//     console.log(`New step activated: ${currentStep.instruction}`);
//     speakInstruction();

//     clearAllIntervals();
    
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
//     } else if (repetitionMode === 'ai') {
//       const interval = currentStep.defaultRepetition || 15;
//       setTimeLeft(interval);
      
//       intervalRef.current = setInterval(() => {
//         speakInstruction();
//       }, interval * 1000);
//     }

//     return () => {
//       clearAllIntervals();
//     };
//   }, [currentStepIndex, repetitionMode, customInterval, currentStep]);

//   // Handle user interaction for speech
//   useEffect(() => {
//     const handleFirstInteraction = () => {
//       setUserInteracted(true);
//       window.removeEventListener('click', handleFirstInteraction);
//     };

//     window.addEventListener('click', handleFirstInteraction);
//     return () => window.removeEventListener('click', handleFirstInteraction);
//   }, []);

//   // Render UI remains the same as previous implementation
//   // ...

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
//       {!userInteracted && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-lg max-w-md text-center">
//             <h3 className="text-lg font-bold mb-4">Enable Voice Instructions</h3>
//             <p className="mb-4">Click anywhere to enable voice guidance</p>
//           </div>
//         </div>
//       )}

//       {/* Camera Preview */}
//       <div className="fixed top-4 right-4 z-30 bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white w-64 h-48">
//         {cameraError ? (
//           <div className="w-full h-full bg-red-100 flex flex-col items-center justify-center p-2">
//             <span className="text-red-600 text-sm mb-1">⚠️ Camera Error</span>
//             <p className="text-red-500 text-xs text-center">{cameraError}</p>
//             <button 
//               onClick={initCamera}
//               className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
//             >
//               Retry Camera
//             </button>
//           </div>
//         ) : (
//           <>
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               muted
//               className="w-full h-full object-cover"
//             />
//             {isAnalyzing && (
//               <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
//                 <div className="text-white text-sm font-medium animate-pulse">
//                   Analyzing...
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* Debug View */}
//       {debugMode && capturedImage && (
//         <div className="fixed bottom-4 right-4 z-20 bg-white p-2 rounded shadow-lg">
//           <h3 className="text-sm font-bold mb-1">Last Captured Image:</h3>
//           <img 
//             src={capturedImage} 
//             alt="Last captured frame" 
//             className="w-32 h-32 object-contain border"
//           />
//           <div className="text-xs mt-1">Attempts: {analysisAttempts}</div>
//           <button 
//             onClick={() => setDebugMode(false)}
//             className="mt-2 text-xs bg-gray-200 px-2 py-1 rounded"
//           >
//             Hide Debug
//           </button>
//         </div>
//       )}

//       {/* Debug Toggle */}
//       <button 
//         onClick={() => setDebugMode(!debugMode)}
//         className="fixed bottom-4 left-4 z-20 bg-gray-200 px-3 py-1 rounded text-sm"
//       >
//         {debugMode ? 'Hide Debug' : 'Show Debug'}
//       </button>

//       {/* Hidden canvas for image capture */}
//       <canvas ref={canvasRef} className="hidden" />

//       {/* Main Content */}
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
//                     detectionStatus.includes('complete') ? 'text-green-600' : 
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

//           {/* Task progress display */}
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
//                     {index < currentStepIndex ? '✓' : index + 1}
//                   </div>
//                   <div>
//                     <p className={index < currentStepIndex ? 'line-through text-gray-500' : ''}>
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

'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { tasks } from '@/lib/tasks';

export default function TaskExecution() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('task');
  const repetitionMode = searchParams.get('mode') as 'fixed' | 'ai';
  const customInterval = Number(searchParams.get('interval')) || 15;
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(customInterval);
  const [detectionStatus, setDetectionStatus] = useState('Initializing...');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [keypoints, setKeypoints] = useState<Array<{x: number, y: number}>>([]);
  const [boundingBoxes, setBoundingBoxes] = useState<Array<{x: number, y: number, width: number, height: number}>>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find the selected task
  const task = tasks.find(t => t.id === taskId);
  const currentStep = task?.steps[currentStepIndex];
  const isLastStep = currentStepIndex === (task?.steps.length ?? 0) - 1;

  // Initialize camera with retries
  const initCamera = async (attempt = 1) => {
    try {
      console.log(`Initializing camera (attempt ${attempt})...`);
      setDetectionStatus('Initializing camera...');
      
      // Clean up any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Camera timeout'));
        }, 5000);

        videoRef.current!.onloadedmetadata = () => {
          clearTimeout(timer);
          resolve();
        };

        videoRef.current!.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Video error'));
        };
      });

      // Play the video
      await videoRef.current.play();
      
      setCameraActive(true);
      setCameraError(null);
      setDetectionStatus('Camera ready');
      console.log('Camera successfully initialized');
      
      // Start simulated detection
      startSimulatedDetection();
      
    } catch (err) {
      console.error(`Camera init error (attempt ${attempt}):`, err);
      
      if (attempt < 3) {
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return initCamera(attempt + 1);
      }
      
      let errorMessage = 'Camera error';
      if (err instanceof DOMException) {
        if (err.name === 'NotFoundError') errorMessage = 'No camera found';
        else if (err.name === 'NotAllowedError') errorMessage = 'Permission denied';
        else if (err.name === 'NotReadableError') errorMessage = 'Camera in use';
      }
      
      setCameraError(errorMessage);
      setCameraActive(false);
      setDetectionStatus(errorMessage);
      
      // Clean up if we got a stream but failed to play
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Initialize speech synthesis
  const initSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
      console.log('Speech synthesis initialized');
    }
  };

  useEffect(() => {
    initSpeech();
    initCamera();

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (speechSynthRef.current?.speaking) {
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

  // Simulate pose detection and object detection
  const startSimulatedDetection = () => {
    stopDetection();
    setDetectionStatus('Starting detection engine...');
    setDetectionProgress(0);

    // Simulate loading detection models
    timeoutRef.current = setTimeout(() => {
      setDetectionStatus('Loading pose estimation model...');
      
      timeoutRef.current = setTimeout(() => {
        setDetectionStatus('Loading object detection model...');
        
        timeoutRef.current = setTimeout(() => {
          setDetectionStatus('Analyzing video feed...');
          startDetectionVisuals();
          
          // Start the actual simulated detection
          detectionIntervalRef.current = setInterval(() => {
            simulateDetectionFrame();
          }, 100);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setKeypoints([]);
    setBoundingBoxes([]);
  };

  const startDetectionVisuals = () => {
    // Generate random keypoints (like pose estimation)
    const newKeypoints = Array.from({length: 17}, () => ({
      x: Math.random() * 0.8 + 0.1, // Random position between 10% and 90%
      y: Math.random() * 0.8 + 0.1
    }));
    setKeypoints(newKeypoints);

    // Generate random bounding boxes (like object detection)
    const newBoxes = Array.from({length: 3}, () => {
      const size = Math.random() * 0.3 + 0.1;
      return {
        x: Math.random() * (0.9 - size),
        y: Math.random() * (0.9 - size),
        width: size,
        height: size
      };
    });
    setBoundingBoxes(newBoxes);
  };

  const simulateDetectionFrame = () => {
    setDetectionProgress(prev => {
      const newProgress = prev + Math.random() * 5;
      
      if (newProgress >= 100) {
        // Detection complete!
        completeDetection();
        return 100;
      }
      
      // Randomly update keypoints and boxes to make it look dynamic
      if (Math.random() > 0.7) {
        setKeypoints(prev => prev.map(kp => ({
          x: Math.min(0.9, Math.max(0.1, kp.x + (Math.random() * 0.1 - 0.05))),
          y: Math.min(0.9, Math.max(0.1, kp.y + (Math.random() * 0.1 - 0.05)))
      })));
      }
      
      if (Math.random() > 0.8) {
        setBoundingBoxes(prev => prev.map(box => ({
          ...box,
          x: Math.min(0.9 - box.width, Math.max(0.1, box.x + (Math.random() * 0.1 - 0.05))),
          y: Math.min(0.9 - box.height, Math.max(0.1, box.y + (Math.random() * 0.1 - 0.05)))
        })));
      }
      
      return newProgress;
    });
  };

  const completeDetection = () => {
    stopDetection();
    setDetectionStatus('Task detected!');
    setIsStepComplete(true);
    
    // Move to next step after delay
    timeoutRef.current = setTimeout(() => {
      moveToNextStep();
    }, 2000);
  };

  const speakInstruction = () => {
    if (!userInteracted || !currentStep || !speechSynthRef.current) return;
    
    console.log('Speaking instruction:', currentStep.audioPrompt);
    const utterance = new SpeechSynthesisUtterance(currentStep.audioPrompt);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
  
    utterance.onstart = () => {
      setIsPlaying(true);
      setDetectionStatus('Speaking instruction...');
      console.log('Speech started');
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      console.log('Speech ended');
      startSimulatedDetection();
    };
    
    utterance.onerror = (event) => {
      setIsPlaying(false);
      console.error('Speech error:', event.error);
      startSimulatedDetection();
    };
  
    speechSynthRef.current.cancel();
    speechSynthRef.current.speak(utterance);
  };

  const moveToNextStep = () => {
    if (!task) return;

    console.log(`Moving from step ${currentStepIndex} to ${currentStepIndex + 1}`);
    setDetectionProgress(0);

    if (isLastStep) {
      console.log('Task completed!');
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsStepComplete(false);
      setDetectionStatus('Starting next step...');
      setTimeLeft(repetitionMode === 'fixed' ? customInterval : 
        task.steps[currentStepIndex + 1]?.defaultRepetition || 15);
    }
  };

  // Handle step changes
  useEffect(() => {
    if (!currentStep) return;
    
    console.log(`New step activated: ${currentStep.instruction}`);
    speakInstruction();

    clearAllIntervals();
    
    if (repetitionMode === 'fixed') {
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

  // Handle user interaction for speech
  useEffect(() => {
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  // Draw detection overlays
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding boxes (object detection)
    boundingBoxes.forEach(box => {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        box.x * canvas.width,
        box.y * canvas.height,
        box.width * canvas.width,
        box.height * canvas.height
      );
    });

    // Draw keypoints (pose estimation)
    keypoints.forEach(kp => {
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(
        kp.x * canvas.width,
        kp.y * canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });

    // Draw connections between keypoints (skeleton)
    if (keypoints.length > 0) {
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      
      // Simple connections for demonstration
      for (let i = 0; i < keypoints.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(
          keypoints[i].x * canvas.width,
          keypoints[i].y * canvas.height
        );
        ctx.lineTo(
          keypoints[i + 1].x * canvas.width,
          keypoints[i + 1].y * canvas.height
        );
        ctx.stroke();
      }
    }
  }, [keypoints, boundingBoxes]);

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
            <p className="mb-4">Click anywhere to enable voice guidance</p>
          </div>
        </div>
      )}

      {/* Camera Preview with Detection Overlay */}
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
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            {detectionProgress > 0 && detectionProgress < 100 && (
              <div className="absolute bottom-2 left-0 right-0 mx-4 bg-black bg-opacity-50 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${detectionProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug Toggle */}
      <button 
        onClick={() => setDebugMode(!debugMode)}
        className="fixed bottom-4 left-4 z-20 bg-gray-200 px-3 py-1 rounded text-sm"
      >
        {debugMode ? 'Hide Debug' : 'Show Debug'}
      </button>

      {/* Debug View */}
      {debugMode && (
        <div className="fixed bottom-4 right-4 z-20 bg-white p-2 rounded shadow-lg">
          <h3 className="text-sm font-bold mb-1">Detection Debug</h3>
          <div className="text-xs">
            <div>Status: {detectionStatus}</div>
            <div>Progress: {detectionProgress.toFixed(1)}%</div>
            <div>Keypoints: {keypoints.length}</div>
            <div>Objects: {boundingBoxes.length}</div>
          </div>
        </div>
      )}

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

                {detectionProgress > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Detection progress:</span>
                      <span>{detectionProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${detectionProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Visual Prompt:</h3>
                <p className="text-blue-800 italic">"{currentStep.visualPrompt}"</p>
              </div>
            </div>
          </div>

          {/* Task progress display */}
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
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <div>
                    <p className={index < currentStepIndex ? 'line-through text-gray-500' : ''}>
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