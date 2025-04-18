

// 'use client';
// import { useState, useEffect, useRef } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { tasks } from '@/lib/tasks';
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-backend-webgl';
// import * as cocoSsd from '@tensorflow-models/coco-ssd';
// import { drawHands, isHandNearMouth } from '@/lib/handDetection';

// // Audio fallback for browsers with speech synthesis issues
// const playAudioFallback = (text: string) => {
//   const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`);
//   audio.volume = 1.0;
//   audio.play().catch(e => console.error('Audio fallback error:', e));
// };

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
//   const [cameraError, setCameraError] = useState<string | null>(null);
//   const [debugMode, setDebugMode] = useState(false);
//   const [userInteracted, setUserInteracted] = useState(false);
//   const [detectionProgress, setDetectionProgress] = useState(0);
//   const [instructionRepeatCount, setInstructionRepeatCount] = useState(0);
//   const [objectDetections, setObjectDetections] = useState<any[]>([]);
//   const [handLandmarks, setHandLandmarks] = useState<any[]>([]);
//   const [ttsAvailable, setTtsAvailable] = useState(true);
//   const [volume, setVolume] = useState(1.0);
//   const [autoDetectTimeout, setAutoDetectTimeout] = useState<NodeJS.Timeout | null>(null);

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const instructionVideoRef = useRef<HTMLVideoElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
//   const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const objectDetectionModelRef = useRef<cocoSsd.ObjectDetection | null>(null);
//   const audioContextRef = useRef<AudioContext | null>(null);

//   // Find the selected task
//   const task = tasks.find(t => t.id === taskId);
//   const currentStep = task?.steps[currentStepIndex];
//   const isLastStep = currentStepIndex === (task?.steps.length ?? 0) - 1;

//   // Initialize audio context for better volume control
//   const initAudioContext = () => {
//     if (!audioContextRef.current) {
//       audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
//     }
//   };

//   // Initialize TensorFlow.js and models
//   const initModels = async () => {
//     try {
//       setDetectionStatus('Loading TensorFlow.js...');
//       await tf.setBackend('webgl');
//       await tf.ready();
      
//       setDetectionStatus('Loading object detection model...');
//       objectDetectionModelRef.current = await cocoSsd.load();
      
//       setDetectionStatus('Models loaded');
//     } catch (error) {
//       console.error('Error loading models:', error);
//       setDetectionStatus('Failed to load models');
//     }
//   };

//   // Initialize camera
//   const initCamera = async (attempt = 1) => {
//     try {
//       console.log(`Initializing camera (attempt ${attempt})...`);
//       setDetectionStatus('Initializing camera...');
      
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

//       await new Promise<void>((resolve, reject) => {
//         const timer = setTimeout(() => {
//           reject(new Error('Camera timeout'));
//         }, 10000);

//         videoRef.current!.onloadedmetadata = () => {
//           clearTimeout(timer);
//           resolve();
//         };

//         videoRef.current!.onerror = () => {
//           clearTimeout(timer);
//           reject(new Error('Video error'));
//         };
//       });

//       await videoRef.current.play();
      
//       setCameraActive(true);
//       setCameraError(null);
//       setDetectionStatus('Camera ready');
//       console.log('Camera successfully initialized');
      
//       startDetection();
      
//     } catch (err) {
//       console.error(`Camera init error (attempt ${attempt}):`, err);
      
//       if (attempt < 3) {
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
      
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//         streamRef.current = null;
//       }
//     }
//   };

//   // Initialize speech synthesis with better error handling
//   const initSpeech = () => {
//     if ('speechSynthesis' in window) {
//       speechSynthesisRef.current = window.speechSynthesis;
      
//       // Check if voices are actually available
//       const checkVoices = () => {
//         const voices = speechSynthesisRef.current?.getVoices();
//         if (!voices || voices.length === 0) {
//           console.warn('No voices available in speech synthesis');
//           setTtsAvailable(false);
//         } else {
//           console.log('Available voices:', voices);
//           setTtsAvailable(true);
//         }
//       };
      
//       speechSynthesisRef.current.onvoiceschanged = checkVoices;
//       checkVoices();
//     } else {
//       console.warn('Speech Synthesis API not supported');
//       setTtsAvailable(false);
//       setDetectionStatus('Voice instructions not supported');
//     }
//   };

//   // Clean up all resources
//   const cleanUp = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//     }
//     cancelSpeech();
//     clearAllIntervals();
    
//     if (autoDetectTimeout) {
//       clearTimeout(autoDetectTimeout);
//     }
//   };

//   // Cancel any ongoing speech
//   const cancelSpeech = () => {
//     if (speechSynthesisRef.current?.speaking) {
//       speechSynthesisRef.current.cancel();
//     }
//     if (speechUtteranceRef.current) {
//       speechUtteranceRef.current.onend = null;
//       speechUtteranceRef.current = null;
//     }
//     setIsPlaying(false);
//   };

//   const clearAllIntervals = () => {
//     if (intervalRef.current) clearInterval(intervalRef.current);
//     if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//   };

//   // Enhanced speak function with multiple fallbacks
//   const speak = (text: string) => {
//     if (!userInteracted) return;

//     cancelSpeech();
//     initAudioContext();

//     // Try Web Speech API first
//     if (ttsAvailable && speechSynthesisRef.current) {
//       const utterance = new SpeechSynthesisUtterance(text);
//       speechUtteranceRef.current = utterance;
      
//       // Configure voice
//       const voices = speechSynthesisRef.current.getVoices();
//       const preferredVoice = voices.find(v => v.lang.includes('en')) || voices[0];
//       if (preferredVoice) {
//         utterance.voice = preferredVoice;
//       }
      
//       utterance.rate = 0.9;
//       utterance.pitch = 1.1;
//       utterance.volume = volume;
    
//       utterance.onstart = () => {
//         setIsPlaying(true);
//         setDetectionStatus('Speaking instruction...');
//       };
      
//       utterance.onend = () => {
//         setIsPlaying(false);
//         speechUtteranceRef.current = null;
//       };
      
//       utterance.onerror = (event) => {
//         console.error('Speech error:', event.error);
//         setIsPlaying(false);
//         speechUtteranceRef.current = null;
        
//         // Fallback to audio if Web Speech fails
//         playAudioFallback(text);
//       };
    
//       try {
//         speechSynthesisRef.current.speak(utterance);
//       } catch (e) {
//         console.error('Speech synthesis failed:', e);
//         playAudioFallback(text);
//       }
//     } else {
//       // Use audio fallback if Web Speech not available
//       playAudioFallback(text);
//     }
//   };

//   // Speak instruction with proper repeating
//   const speakInstruction = () => {
//     if (!currentStep) return;
    
//     // Increment repeat count
//     setInstructionRepeatCount(prev => prev + 1);
    
//     console.log(`Speaking instruction (repeat ${instructionRepeatCount}):`, currentStep.audioPrompt);
    
//     speak(currentStep.audioPrompt);
//   };

//   // Run object detection and hand pose estimation
//   const startDetection = async () => {
//     if (!videoRef.current || !objectDetectionModelRef.current) return;
    
//     clearInterval(detectionIntervalRef.current!);
    
//     detectionIntervalRef.current = setInterval(async () => {
//       if (!videoRef.current || !objectDetectionModelRef.current || isStepComplete) return;
      
//       try {
//         const detections = await objectDetectionModelRef.current.detect(videoRef.current);
//         setObjectDetections(detections);
        
//         const simulatedLandmarks = simulateHandPose();
//         setHandLandmarks(simulatedLandmarks);
        
//         checkStepCompletion(detections, simulatedLandmarks);
//       } catch (error) {
//         console.error('Detection error:', error);
//       }
//     }, 1000);
    
//     // Set up auto-detect timer (7-8 seconds)
//     const randomDelay = 7000 + Math.floor(Math.random() * 1000); // 7-8 seconds
//     console.log(`Setting auto-detection timer for ${randomDelay}ms`);
    
//     const timeout = setTimeout(() => {
//       console.log('Auto-detection timer expired');
//       setDetectionStatus('Task detected!');
//       setDetectionProgress(100);
//       completeDetection();
//     }, randomDelay);
    
//     setAutoDetectTimeout(timeout);
//   };

//   const simulateHandPose = () => {
//     if (Math.random() > 0.7) {
//       return [Array(21).fill(0).map(() => ({
//         x: Math.random(),
//         y: Math.random(),
//         z: Math.random()
//       }))];
//     }
//     return [];
//   };

//   const checkStepCompletion = (detections: any[], landmarks: any[]) => {
//     if (!currentStep) return;
    
//     if (currentStep.id === 'brush_teeth') {
//       const toothbrushDetected = detections.some(
//         d => d.class === 'toothbrush' && d.score > 0.7
//       );
      
//       const handNearMouth = isHandNearMouth(landmarks);
      
//       if (toothbrushDetected && handNearMouth) {
//         setDetectionProgress(prev => Math.min(prev + 20, 100));
        
//         if (detectionProgress >= 80) {
//           completeDetection();
//         }
//       } else {
//         setDetectionProgress(prev => Math.max(prev - 10, 0));
//       }
//     }
//   };

//   const completeDetection = () => {
//     if (autoDetectTimeout) {
//       clearTimeout(autoDetectTimeout);
//       setAutoDetectTimeout(null);
//     }
//     clearInterval(detectionIntervalRef.current!);
//     setDetectionStatus('Task detected!');
//     setIsStepComplete(true);
//     cancelSpeech();
    
//     // Pause instruction video
//     if (instructionVideoRef.current) {
//       instructionVideoRef.current.pause();
//     }
    
//     timeoutRef.current = setTimeout(() => {
//       moveToNextStep();
//     }, 2000);
//   };

//   const moveToNextStep = () => {
//     if (!task) return;

//     console.log(`Moving from step ${currentStepIndex} to ${currentStepIndex + 1}`);
//     setInstructionRepeatCount(0);
//     setDetectionProgress(0);
//     setObjectDetections([]);
//     setHandLandmarks([]);

//     if (isLastStep) {
//       console.log('Task completed!');
//     } else {
//       setCurrentStepIndex(currentStepIndex + 1);
//       setIsStepComplete(false);
//       setDetectionStatus('Starting next step...');
//       setTimeLeft(repetitionMode === 'fixed' ? customInterval : 
//         task.steps[currentStepIndex + 1]?.defaultRepetition || 15);
      
//       startDetection();
//       speakInstruction();
//     }
//   };

//   // Get video source for current step
//   const getVideoSourceForStep = (stepId: string) => {
//     // Map step IDs to video sources
//     const videoMap: Record<string, string> = {
//       brush_teeth: '/pickup.mp4',
//       wash_hands: '/toothpaste.mp4',
//       take_medicine: '/videos/take_medicine.mp4',
//       // Add more mappings as needed
//     };
    
//     return videoMap[stepId] || '/pickup.mp4'; // Fallback to default video
//   };

//   // Handle step changes
//   useEffect(() => {
//     if (!currentStep) return;
    
//     console.log(`New step activated: ${currentStep.instruction}`);
//     setInstructionRepeatCount(0); // Reset for new step
    
//     cleanUp();
    
//     // Initial instruction
//     if (userInteracted) {
//       speakInstruction();
      
//       // Play video for this step
//       if (instructionVideoRef.current) {
//         instructionVideoRef.current.src = getVideoSourceForStep(currentStep.id);
//         instructionVideoRef.current.load();
//         instructionVideoRef.current.play().catch(err => {
//           console.error('Error playing instruction video:', err);
//         });
//       }
//     }
    
//     // Set up timing for fixed repetition mode
//     if (repetitionMode === 'fixed') {
//       setTimeLeft(customInterval);
      
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
    
//     // Start detection
//     startDetection();

//     return cleanUp;
//   }, [currentStepIndex, repetitionMode, customInterval, currentStep]);

//   // Draw detection results
//   useEffect(() => {
//     if (!canvasRef.current || !videoRef.current) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     objectDetections.forEach(detection => {
//       const [x, y, width, height] = detection.bbox;
      
//       ctx.strokeStyle = '#00FF00';
//       ctx.lineWidth = 2;
//       ctx.strokeRect(x, y, width, height);
      
//       ctx.fillStyle = '#00FF00';
//       ctx.font = '16px Arial';
//       ctx.fillText(
//         `${detection.class} (${Math.round(detection.score * 100)}%)`,
//         x,
//         y > 10 ? y - 5 : 10
//       );
//     });

//     drawHands(ctx, handLandmarks, canvas.width, canvas.height);
//   }, [objectDetections, handLandmarks]);

//   // Initialize on mount
//   useEffect(() => {
//     initSpeech();
//     initModels().then(() => initCamera());
//     initAudioContext();

//     return cleanUp;
//   }, []);

//   // Handle user interaction for speech
//   useEffect(() => {
//     const handleFirstInteraction = () => {
//       setUserInteracted(true);
//       window.removeEventListener('click', handleFirstInteraction);
//       if (currentStep) {
//         speakInstruction();
        
//         // Play initial video
//         if (instructionVideoRef.current && currentStep) {
//           instructionVideoRef.current.src = getVideoSourceForStep(currentStep.id);
//           instructionVideoRef.current.load();
//           instructionVideoRef.current.play().catch(err => {
//             console.error('Error playing instruction video:', err);
//           });
//         }
//       }
//     };

//     window.addEventListener('click', handleFirstInteraction);
//     return () => window.removeEventListener('click', handleFirstInteraction);
//   }, [currentStep]);

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
//             <button 
//               onClick={() => setUserInteracted(true)}
//               className="bg-blue-500 text-white px-4 py-2 rounded"
//             >
//               Enable Voice
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Volume Control */}
//       <div className="fixed top-4 left-4 z-30 bg-white bg-opacity-90 p-2 rounded-lg shadow-md">
//         <div className="flex items-center space-x-2">
//           <span className="text-sm">Volume:</span>
//           <input
//             type="range"
//             min="0"
//             max="1"
//             step="0.1"
//             value={volume}
//             onChange={(e) => setVolume(parseFloat(e.target.value))}
//             className="w-24"
//           />
//           <span className="text-xs w-8">{Math.round(volume * 100)}%</span>
//         </div>
//         {!ttsAvailable && (
//           <div className="text-xs text-red-500 mt-1">
//             Using audio fallback (no TTS available)
//           </div>
//         )}
//       </div>

//       {/* Camera Preview with Detection Overlay */}
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
//           <div className="relative w-full h-full">
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               muted
//               className="w-full h-full object-cover"
//             />
//             <canvas
//               ref={canvasRef}
//               className="absolute top-0 left-0 w-full h-full pointer-events-none"
//             />
//             {detectionProgress > 0 && (
//               <div className="absolute bottom-2 left-0 right-0 mx-4 bg-black bg-opacity-50 rounded-full h-2">
//                 <div 
//                   className="bg-blue-500 h-2 rounded-full transition-all duration-300"
//                   style={{ width: `${detectionProgress}%` }}
//                 ></div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Debug Toggle */}
//       <button 
//         onClick={() => setDebugMode(!debugMode)}
//         className="fixed bottom-4 left-4 z-20 bg-gray-200 px-3 py-1 rounded text-sm"
//       >
//         {debugMode ? 'Hide Debug' : 'Show Debug'}
//       </button>

//       {/* Debug View */}
//       {debugMode && (
//         <div className="fixed bottom-4 right-4 z-20 bg-white p-2 rounded shadow-lg">
//           <h3 className="text-sm font-bold mb-1">Detection Debug</h3>
//           <div className="text-xs">
//             <div>Status: {detectionStatus}</div>
//             <div>Progress: {detectionProgress.toFixed(1)}%</div>
//             <div>Objects: {objectDetections.length}</div>
//             <div>Hands: {handLandmarks.length}</div>
//             <div>Instruction Repeat: {instructionRepeatCount}</div>
//             <div>Speech: {isPlaying ? 'Playing' : 'Idle'}</div>
//             <div>TTS: {ttsAvailable ? 'Available' : 'Unavailable'}</div>
//             <div>Auto-detection: {autoDetectTimeout ? 'Active' : 'Inactive'}</div>
//           </div>
//         </div>
//       )}

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

//                 {detectionProgress > 0 && (
//                   <div className="mt-2">
//                     <div className="flex justify-between text-sm mb-1">
//                       <span>Detection progress:</span>
//                       <span>{detectionProgress.toFixed(0)}%</span>
//                     </div>
//                     <div className="w-full bg-gray-200 rounded-full h-2">
//                       <div 
//                         className="bg-blue-600 h-2 rounded-full" 
//                         style={{ width: `${detectionProgress}%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Video Instruction (replacing Visual Prompt) */}
//               <div className="bg-black rounded-lg overflow-hidden">
//                 <video
//                   ref={instructionVideoRef}
//                   className="w-full h-auto"
//                   controls={false}
//                   autoPlay
//                   muted={false}
//                   loop
//                   playsInline
//                 >
//                   <source src={getVideoSourceForStep(currentStep.id)} type="video/mp4" />
//                   Your browser does not support the video tag.
//                 </video>
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
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { drawHands, isHandNearMouth } from '@/lib/handDetection';

// Audio fallback for browsers with speech synthesis issues
const playAudioFallback = (text: string) => {
  const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`);
  audio.volume = 1.0;
  audio.play().catch(e => console.error('Audio fallback error:', e));
};

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
  const [instructionRepeatCount, setInstructionRepeatCount] = useState(0);
  const [objectDetections, setObjectDetections] = useState<any[]>([]);
  const [handLandmarks, setHandLandmarks] = useState<any[]>([]);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [autoDetectTimeout, setAutoDetectTimeout] = useState<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instructionVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const objectDetectionModelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Find the selected task
  const task = tasks.find(t => t.id === taskId);
  const currentStep = task?.steps[currentStepIndex];
  const isLastStep = currentStepIndex === (task?.steps.length ?? 0) - 1;

  // Initialize audio context for better volume control
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Initialize TensorFlow.js and models
  const initModels = async () => {
    try {
      setDetectionStatus('Loading TensorFlow.js...');
      await tf.setBackend('webgl');
      await tf.ready();
      
      setDetectionStatus('Loading object detection model...');
      objectDetectionModelRef.current = await cocoSsd.load();
      
      setDetectionStatus('Models loaded');
    } catch (error) {
      console.error('Error loading models:', error);
      setDetectionStatus('Failed to load models');
    }
  };

  // Initialize camera
  const initCamera = async (attempt = 1) => {
    try {
      console.log(`Initializing camera (attempt ${attempt})...`);
      setDetectionStatus('Initializing camera...');
      
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

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Camera timeout'));
        }, 10000);

        videoRef.current!.onloadedmetadata = () => {
          clearTimeout(timer);
          resolve();
        };

        videoRef.current!.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Video error'));
        };
      });

      await videoRef.current.play();
      
      setCameraActive(true);
      setCameraError(null);
      setDetectionStatus('Camera ready');
      console.log('Camera successfully initialized');
      
      startDetection();
      
    } catch (err) {
      console.error(`Camera init error (attempt ${attempt}):`, err);
      
      if (attempt < 3) {
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
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Initialize speech synthesis with better error handling
  const initSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      
      // Check if voices are actually available
      const checkVoices = () => {
        const voices = speechSynthesisRef.current?.getVoices();
        if (!voices || voices.length === 0) {
          console.warn('No voices available in speech synthesis');
          setTtsAvailable(false);
        } else {
          console.log('Available voices:', voices);
          setTtsAvailable(true);
        }
      };
      
      speechSynthesisRef.current.onvoiceschanged = checkVoices;
      checkVoices();
    } else {
      console.warn('Speech Synthesis API not supported');
      setTtsAvailable(false);
      setDetectionStatus('Voice instructions not supported');
    }
  };

  // Clean up all resources
  const cleanUp = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    cancelSpeech();
    clearAllIntervals();
    
    if (autoDetectTimeout) {
      clearTimeout(autoDetectTimeout);
    }
  };

  // Cancel any ongoing speech
  const cancelSpeech = () => {
    if (speechSynthesisRef.current?.speaking) {
      speechSynthesisRef.current.cancel();
    }
    if (speechUtteranceRef.current) {
      speechUtteranceRef.current.onend = null;
      speechUtteranceRef.current = null;
    }
    setIsPlaying(false);
  };

  const clearAllIntervals = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Enhanced speak function with multiple fallbacks
  const speak = (text: string) => {
    if (!userInteracted) return;

    cancelSpeech();
    initAudioContext();

    // Try Web Speech API first
    if (ttsAvailable && speechSynthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechUtteranceRef.current = utterance;
      
      // Configure voice
      const voices = speechSynthesisRef.current.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en')) || voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = volume;
    
      utterance.onstart = () => {
        setIsPlaying(true);
        setDetectionStatus('Speaking instruction...');
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        speechUtteranceRef.current = null;
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
        setIsPlaying(false);
        speechUtteranceRef.current = null;
        
        // Fallback to audio if Web Speech fails
        playAudioFallback(text);
      };
    
      try {
        speechSynthesisRef.current.speak(utterance);
      } catch (e) {
        console.error('Speech synthesis failed:', e);
        playAudioFallback(text);
      }
    } else {
      // Use audio fallback if Web Speech not available
      playAudioFallback(text);
    }
  };

  // Speak instruction with proper repeating
  const speakInstruction = () => {
    if (!currentStep) return;
    
    // Increment repeat count
    setInstructionRepeatCount(prev => prev + 1);
    
    console.log(`Speaking instruction (repeat ${instructionRepeatCount}):`, currentStep.audioPrompt);
    
    speak(currentStep.audioPrompt);
  };

  // Run object detection and hand pose estimation
  const startDetection = async () => {
    if (!videoRef.current || !objectDetectionModelRef.current) return;
    
    clearInterval(detectionIntervalRef.current!);
    
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !objectDetectionModelRef.current || isStepComplete) return;
      
      try {
        const detections = await objectDetectionModelRef.current.detect(videoRef.current);
        setObjectDetections(detections);
        
        const simulatedLandmarks = simulateHandPose();
        setHandLandmarks(simulatedLandmarks);
        
        checkStepCompletion(detections, simulatedLandmarks);
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, 1000);
    
    // Set up auto-detect timer (7-8 seconds)
    const randomDelay = 10000 + Math.floor(Math.random() * 1000); // 7-8 seconds
    console.log(`Setting auto-detection timer for ${randomDelay}ms`);
    
    const timeout = setTimeout(() => {
      console.log('Auto-detection timer expired');
      setDetectionStatus('Task detected!');
      setDetectionProgress(100);
      completeDetection();
    }, randomDelay);
    
    setAutoDetectTimeout(timeout);
  };

  const simulateHandPose = () => {
    if (Math.random() > 0.7) {
      return [Array(21).fill(0).map(() => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      }))];
    }
    return [];
  };

  // Improved step completion checking
  const checkStepCompletion = (detections: any[], landmarks: any[]) => {
    if (!currentStep) return;
    
    // Map step IDs to action types for detection logic
    const actionType = getActionTypeForStep(currentStep.id);
    
    // Handle different types of step actions
    switch (actionType) {
      case 'brush_teeth':
        // Improved toothbrush detection with better confidence thresholds and position checking
        const toothbrushDetection = detections.find(d => d.class === 'toothbrush');
        
        // Check if toothbrush is detected with reasonable confidence
        const toothbrushDetected = toothbrushDetection && toothbrushDetection.score > 0.6;
        
        // Check if toothbrush is in upper area of frame (likely near mouth)
        const isToothbrushInUpperFrame = toothbrushDetection && 
          (toothbrushDetection.bbox[1] < videoRef.current?.videoHeight * 0.6);
        
        // Check hand position using landmarks
        const handNearMouth = isHandNearMouth(landmarks);
        
        // Log detection data for debugging
        if (debugMode && toothbrushDetection) {
          console.log(`Toothbrush detected: ${toothbrushDetected}, score: ${toothbrushDetection.score.toFixed(2)}, position: ${isToothbrushInUpperFrame}`);
        }
        
        // Combined detection criteria
        if ((toothbrushDetected && isToothbrushInUpperFrame) || (toothbrushDetected && handNearMouth)) {
          // Faster progression when both conditions are met
          const incrementAmount = handNearMouth && toothbrushDetected ? 25 : 15;
          setDetectionProgress(prev => Math.min(prev + incrementAmount, 100));
          
          if (detectionProgress >= 80) {
            completeDetection();
          }
        } else {
          // Slower regression when conditions aren't met
          setDetectionProgress(prev => Math.max(prev - 5, 0));
        }
        break;
        
      case 'wash_hands':
        // Handle wash hands detection logic
        const handMovement = landmarks.length > 0;
        const sinkDetected = detections.some(d => 
          (d.class === 'sink' || d.class === 'bottle') && d.score > 0.6
        );
        
        if (handMovement && sinkDetected) {
          setDetectionProgress(prev => Math.min(prev + 20, 100));
          
          if (detectionProgress >= 80) {
            completeDetection();
          }
        } else if (handMovement || sinkDetected) {
          setDetectionProgress(prev => Math.min(prev + 10, 100));
        } else {
          setDetectionProgress(prev => Math.max(prev - 5, 0));
        }
        break;
        
      case 'take_medicine':
        // Handle medicine detection logic
        const bottleDetected = detections.some(d => 
          (d.class === 'bottle' || d.class === 'cup') && d.score > 0.6
        );
        
        const handDetected = landmarks.length > 0;
        
        if (bottleDetected && handDetected) {
          setDetectionProgress(prev => Math.min(prev + 20, 100));
          
          if (detectionProgress >= 80) {
            completeDetection();
          }
        } else {
          setDetectionProgress(prev => Math.max(prev - 5, 0));
        }
        break;
        
      default:
        // For steps that don't have specific detection logic, increment progress more generically
        // based on any detected objects or hands
        if (detections.length > 0 || landmarks.length > 0) {
          setDetectionProgress(prev => Math.min(prev + 10, 100));
          
          if (detectionProgress >= 80) {
            completeDetection();
          }
        } else {
          setDetectionProgress(prev => Math.max(prev - 2, 0));
        }
    }
  };

  // Map step IDs to action types for detection and video matching
  const getActionTypeForStep = (stepId: string) => {
    // Map step IDs to action types based on step content
    const stepActionMap: Record<string, string> = {
      'step-1': 'pickup_toothbrush',
      'step-2': 'wet_toothbrush',
      'step-3': 'open_toothpaste',
      'step-4': 'apply_toothpaste',
      'step-5': 'brush_teeth',
      'step-6': 'brush_teeth',
      'step-7': 'rinse_mouth',
      // Add more mappings for additional steps
    };
    
    return stepActionMap[stepId] || 'default';
  };

  const completeDetection = () => {
    if (autoDetectTimeout) {
      clearTimeout(autoDetectTimeout);
      setAutoDetectTimeout(null);
    }
    clearInterval(detectionIntervalRef.current!);
    setDetectionStatus('Task detected!');
    setIsStepComplete(true);
    cancelSpeech();
    
    // Pause instruction video
    if (instructionVideoRef.current) {
      instructionVideoRef.current.pause();
    }
    
    timeoutRef.current = setTimeout(() => {
      moveToNextStep();
    }, 2000);
  };

  const moveToNextStep = () => {
    if (!task) return;

    console.log(`Moving from step ${currentStepIndex} to ${currentStepIndex + 1}`);
    setInstructionRepeatCount(0);
    setDetectionProgress(0);
    setObjectDetections([]);
    setHandLandmarks([]);

    if (isLastStep) {
      console.log('Task completed!');
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsStepComplete(false);
      setDetectionStatus('Starting next step...');
      setTimeLeft(repetitionMode === 'fixed' ? customInterval : 
        task.steps[currentStepIndex + 1]?.defaultRepetition || 15);
      
      startDetection();
      speakInstruction();
    }
  };

  // Fixed video mapping function for steps
  const getVideoSourceForStep = (stepId: string) => {
    if (!stepId) return '/videos/default_instruction.mp4';
    
    // First, map specific step IDs to corresponding videos
    const videoMap: Record<string, string> = {
      'step-1': '/pickup.mp4',           // Pick up toothbrush
      'step-2': '/toothpaste.mp4',       // Wet toothbrush
      'step-3': '/videos/open_toothpaste.mp4',  // Open toothpaste
      'step-4': '/videos/apply_toothpaste.mp4', // Apply toothpaste
      'step-5': '/videos/brush_top.mp4',        // Brush top teeth
      'step-6': '/videos/brush_bottom.mp4',     // Brush bottom teeth
      'step-7': '/videos/rinse.mp4',            // Rinse mouth
    };
    
    // If we have a direct mapping, use it
    if (videoMap[stepId]) {
      console.log(`Found specific video for step ${stepId}: ${videoMap[stepId]}`);
      return videoMap[stepId];
    }
    
    // If no direct mapping, try to use action type mapping
    const actionType = getActionTypeForStep(stepId);
    const actionVideoMap: Record<string, string> = {
      'pickup_toothbrush': '/pickup.mp4',
      'wet_toothbrush': '/water.mp4',
      'brush_teeth': '/toothpaste.mp4',
      'rinse_mouth': '/brush.mp4',
      'wash_hands': '/videos/wash_hands.mp4',
      'take_medicine': '/videos/take_medicine.mp4',
      'floss_teeth': '/videos/floss_teeth.mp4', 
      'put_on_shoes': '/videos/put_on_shoes.mp4',
      'tie_shoelaces': '/videos/tie_shoelaces.mp4',
      'button_shirt': '/videos/button_shirt.mp4'
    };
    
    if (actionVideoMap[actionType]) {
      console.log(`Using action type video for ${stepId} (${actionType}): ${actionVideoMap[actionType]}`);
      return actionVideoMap[actionType];
    }
    
    // If still no match, use a default video based on task ID
    const taskDefaultMap: Record<string, string> = {
      'brushing-teeth': '/videos/dental_default.mp4',
      'morning_routine': '/videos/morning_routine_default.mp4',
      'evening_routine': '/videos/evening_routine_default.mp4',
      'medication': '/videos/medication_default.mp4',
      'dental_hygiene': '/videos/dental_default.mp4',
      'dressing': '/videos/dressing_default.mp4'
    };
    
    // Use task-specific default if available
    if (task && taskDefaultMap[task.id]) {
      console.log(`Using task default video for ${task.id}`);
      return taskDefaultMap[task.id];
    }
    
    // Fall back to generic default video
    console.log(`No specific video found for step ${stepId}, using default`);
    return '/videos/default_instruction.mp4';
  };

  // Handle step changes
  useEffect(() => {
    if (!currentStep) return;
    
    console.log(`New step activated: ${currentStep.instruction}`);
    setInstructionRepeatCount(0); // Reset for new step
    
    cleanUp();
    
    // Initial instruction
    if (userInteracted) {
      speakInstruction();
      
      // Play video for this step
      if (instructionVideoRef.current) {
        const videoSource = getVideoSourceForStep(currentStep.id);
        console.log(`Setting video source to: ${videoSource}`);
        instructionVideoRef.current.src = videoSource;
        instructionVideoRef.current.load();
        instructionVideoRef.current.play().catch(err => {
          console.error('Error playing instruction video:', err);
        });
      }
    }
    
    // Set up timing for fixed repetition mode
    if (repetitionMode === 'fixed') {
      setTimeLeft(customInterval);
      
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            speakInstruction();
            return customInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Start detection
    startDetection();

    return cleanUp;
  }, [currentStepIndex, repetitionMode, customInterval, currentStep]);

  // Draw detection results
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw object detections with improved visibility
    objectDetections.forEach(detection => {
      const [x, y, width, height] = detection.bbox;
      
      // Use different colors based on confidence
      let color = '#FF0000'; // Red for low confidence
      if (detection.score > 0.7) color = '#00FF00'; // Green for high confidence
      else if (detection.score > 0.5) color = '#FFFF00'; // Yellow for medium confidence
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      // Draw label with confidence
      ctx.fillStyle = color;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(
        `${detection.class} (${Math.round(detection.score * 100)}%)`,
        x,
        y > 20 ? y - 5 : 20
      );
    });

    // Draw hand landmarks
    drawHands(ctx, handLandmarks, canvas.width, canvas.height);
    
    // Draw detection progress indicator directly on canvas
    if (detectionProgress > 0) {
      const progressBarHeight = 10;
      const progressBarWidth = canvas.width * 0.8;
      const progressBarX = (canvas.width - progressBarWidth) / 2;
      const progressBarY = canvas.height - 20;
      
      // Background bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
      
      // Progress fill
      ctx.fillStyle = detectionProgress > 75 ? '#00FF00' : '#3388FF';
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * (detectionProgress / 100), progressBarHeight);
    }
    
  }, [objectDetections, handLandmarks, detectionProgress]);

  // Initialize on mount
  useEffect(() => {
    initSpeech();
    initModels().then(() => initCamera());
    initAudioContext();

    return cleanUp;
  }, []);

  // Handle user interaction for speech
  useEffect(() => {
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      window.removeEventListener('click', handleFirstInteraction);
      if (currentStep) {
        speakInstruction();
        
        // Play initial video
        if (instructionVideoRef.current && currentStep) {
          const videoSource = getVideoSourceForStep(currentStep.id);
          instructionVideoRef.current.src = videoSource;
          instructionVideoRef.current.load();
          instructionVideoRef.current.play().catch(err => {
            console.error('Error playing instruction video:', err);
          });
        }
      }
    };

    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [currentStep]);

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
            <button 
              onClick={() => setUserInteracted(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Enable Voice
            </button>
          </div>
        </div>
      )}

      {/* Volume Control */}
      <div className="fixed top-4 left-4 z-30 bg-white bg-opacity-90 p-2 rounded-lg shadow-md">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-xs w-8">{Math.round(volume * 100)}%</span>
        </div>
        {!ttsAvailable && (
          <div className="text-xs text-red-500 mt-1">
            Using audio fallback (no TTS available)
          </div>
        )}
      </div>

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
            {detectionProgress > 0 && (
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
            <div>Objects: {objectDetections.length}</div>
            <div>Step ID: {currentStep?.id}</div>
            <div>Video Source: {currentStep ? getVideoSourceForStep(currentStep.id) : 'none'}</div>
            <div>Hands: {handLandmarks.length}</div>
            <div>Instruction Repeat: {instructionRepeatCount}</div>
            <div>Speech: {isPlaying ? 'Playing' : 'Idle'}</div>
            <div>TTS: {ttsAvailable ? 'Available' : 'Unavailable'}</div>
            <div>Auto-detection: {autoDetectTimeout ? 'Active' : 'Inactive'}</div>
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
                    <span className="text-blue-600 font-bold">{timeLeft}</span><span className="text-blue-600 font-bold">{timeLeft}</span>
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

              {/* Video Instruction (replacing Visual Prompt) */}
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  ref={instructionVideoRef}
                  className="w-full h-auto"
                  controls={false}
                  autoPlay
                  muted={false}
                  loop
                  playsInline
                >
                  <source src={getVideoSourceForStep(currentStep.id)} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
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
