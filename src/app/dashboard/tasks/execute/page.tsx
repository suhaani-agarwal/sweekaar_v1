
// app/tasks/execute/page.tsx
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
  const [detectionStatus, setDetectionStatus] = useState('waiting');
  
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find the selected task
  const task = tasks.find(t => t.id === taskId);
  const currentStep = task?.steps[currentStepIndex];
  const isLastStep = currentStepIndex === (task?.steps.length ?? 0) - 1;

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Speak the current instruction
  const speakInstruction = () => {
    if (!speechSynthRef.current || !currentStep) {
      console.warn('Speech synthesis not available or no current step');
      return;
    }
    
    speechSynthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(currentStep.audioPrompt);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      startDetection();
    };
    
    speechSynthRef.current.speak(utterance);
  };

  // Mock detection function
  const startDetection = () => {
    setDetectionStatus('detecting...');
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Simulate random detection between 3-8 seconds
    const detectionTime = 3000 + Math.random() * 5000;
    
    timeoutRef.current = setTimeout(() => {
      // For demo purposes, we'll randomly decide if detected
      const isDetected = Math.random() > 0.3; // 70% chance of detection
      
      if (isDetected) {
        setDetectionStatus('detected!');
        setIsStepComplete(true);
        setTimeout(() => {
          moveToNextStep();
        }, 2000);
      } else {
        setDetectionStatus('not detected - repeating');
        setTimeout(speakInstruction, 1000);
      }
    }, detectionTime);
  };

  const moveToNextStep = () => {
    if (!task) return;

    if (isLastStep) {
      // Task complete
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
    
    // Start the process for each step
    speakInstruction();
    
    // For fixed interval mode, set up repetition
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
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (speechSynthRef.current) speechSynthRef.current.cancel();
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
    <div className="max-w-3xl mx-auto p-6 text-black">
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