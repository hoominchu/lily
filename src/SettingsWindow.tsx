"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Confetti from 'react-confetti-boom'

export default function SettingsForm() {
  const [apiKey, setApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [screenshotCount, setScreenshotCount] = useState(0)
  const [showNScreenshots, setShowNScreenshots] = useState(false)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // First, check if the electron API is available
        if (!window.electron) {
          throw new Error('Electron API not available');
        }

        console.log("Reading data from electron API");

        // Try each call separately to identify which one fails
        try {
          const key = await window.electron.getApiKey();
          setApiKey(key || "");
          if (key) {
            setShowNScreenshots(true);
          }
        } catch (error) {
          console.error("Error getting API key:", error);
        }

        try {
          console.log("window.electron", window.electron);
          const count = await window.electron.getScreenshotCount();
          setScreenshotCount(count);
        } catch (error) {
          console.error("Error getting screenshot count:", error);
        }

      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };
    
    loadInitialData();

    // Set up an interval to refresh the screenshot count
    const intervalId = setInterval(async () => {
      try {
        const count = await window.electron.getScreenshotCount();
        setScreenshotCount(count);
      } catch (error) {
        console.error("Error updating screenshot count:", error);
      }
    }, 1000); // Update every second

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSuccess(false);

    try {
      if (!apiKey.trim().startsWith('sk-')) {
        setIsSaving(false);
        return;
      }

      const success = await window.electron.saveApiKey(apiKey);
      if (success) {
        setIsSuccess(true);
        setShowConfetti(true);
        setShowNScreenshots(true);
        // Clean up after 8 seconds
        setTimeout(() => {
          setIsSuccess(false);
          setShowConfetti(false);
        }, 8000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    window.electron.closeSettings()
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 flex flex-col">
      {showConfetti && (
        <div className="animate-confetti-fade">
          <Confetti
            mode="fall"
            particleCount={80}
            colors={[
              '#FF577F', '#FF884B', '#FFD384', '#FFF9B0',
              '#4ADE80', '#22C55E',
              '#60A5FA', '#3B82F6',
              '#FACC15', '#EAB308'
            ]}
            shapeSize={12}
            fadeOutHeight={1200}
          />
        </div>
      )}
      {/* Title bar */}
      <div className="h-8 flex items-center justify-between">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flower"><circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/><path d="M12 7.5V9"/><path d="M7.5 12H9"/><path d="M16.5 12H15"/><path d="M12 16.5V15"/><path d="m8 8 1.88 1.88"/><path d="M14.12 9.88 16 8"/><path d="m8 16 1.88-1.88"/><path d="M14.12 14.12 16 16"/></svg>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Close settings"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Center the stats and form */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        {/* Stats Display */}
        <div className="h-[100px] relative flex items-center justify-center" style={{ width: '210px' }}>
          {(!showNScreenshots) ? (
            <div className="text-gray-600 text-sm text-center absolute">
              Please enter your OpenAI API key below to get started
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center absolute">
              <span className="text-6xl font-bold">{screenshotCount}</span>
              <span className="text-sm text-gray-500 mt-2">Screenshots Renamed</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="w-full flex justify-center">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Save Button at bottom */}
      <div className="mt-auto pt-4 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className={`relative transition-all duration-200 ${
            isSuccess ? 'bg-green-500 hover:bg-green-600' : ''
          } ${
            !apiKey.trim().startsWith('sk-') && !isSaving ? 'bg-red-500 hover:bg-red-600' : ''
          }`}
        >
          {isSaving ? (
            "Saving..."
          ) : isSuccess ? (
            <span className="flex items-center">
              <svg 
                className="w-5 h-5 animate-scale-check" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  )
} 