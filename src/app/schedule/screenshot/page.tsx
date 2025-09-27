"use client";
import React, { useState } from 'react';
import { Upload, Camera, X, Loader2, FileImage } from 'lucide-react';
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";

import { useSession } from 'next-auth/react';

export default function Screenshot() {
    const { data: session, status } = useSession();
        const isLoggedIn = status === 'authenticated';

    const [selectedImage, setSelectedImage] = useState<File | null>(null); // holds image
    const [previewUrl, setPreviewUrl] = useState('');
    const [error, setError] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const router = useRouter();

    const handleFileSelect = (file: File | null) => {
        // verify it's image
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        if(file.size > 10 * 1024 * 1024) {
            setError('Image must be less than 10MB');
            return;
        }
        setSelectedImage(file);
        setError(''); 
        // file reader is go to shit
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
    }

    // drag drop functionality
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        handleFileSelect(file);
    };

    const removeImage = () => {
        setSelectedImage(null);
        setPreviewUrl('');
        setError('');
    };

    // analyze that shit
    const passToGemini = async () => {
        if (!selectedImage) { 
            setError('Please select an image first');
            return; 
        }

        // loading
        setIsAnalyzing(true);
        setError('');

        // 
        try {
            const formData = new FormData();
            formData.append('image', selectedImage);
formData.append('prompt', `
Return **ONLY JSON** with \`availableTimes\` for the schedule in the uploaded image. Each day (Sunday → Saturday) must be included. If unclear, use full-day availability. Use 0,0 for all coordinates. For example: 
{
  "availableTimes": [
    {
      "day": "Sunday",
      "startTime": "00:00",
      "endTime": "23:59",
      "beginLocation": { "lat": 0, "long": 0 },
      "finalLocation": { "lat": 0, "long": 0 }
    }
  ]
}
`);

            

            

            //     Return a JSON object in this exact format:

            //     {
            //     "availableTimes": [
            //         {
            //         "day": "Monday",
            //         "startTime": "09:00",
            //         "endTime": "17:00",
            //         "beginLocation": { "lat": 0, "long": 0 },
            //         "finalLocation": { "lat": 0, "long": 0 }
            //         }
            //     ]
            //     }

            //     Rules:
            //     - Include every day of the week (Sunday → Saturday).
            //     - If a day is missing or unclear, use full-day availability ("00:00" → "23:59").
            //     - Use placeholder coordinates (0,0).
            //     - Respond with **JSON only**, no explanations.

            // sends request
            console.log('Sending request to /api/upload...');
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            console.log("LOOK HERE: DATA IS " + formData);

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            let result;
            const responseText = await response.text();
            console.log('RAWDOGGING THIS: ', responseText);

            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                throw new Error(`Server returned invalid JSON. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
            }

            if (!response.ok) {
                console.error('API Error:', result);
                throw new Error(result.error || `HTTP ${response.status}: ${responseText}`);
            }
            
            console.log('Parsed result:', result);

            if (result.success && result.schedule) {
                sessionStorage.setItem('analyzedSchedule', JSON.stringify(result.schedule));
                
                router.push('/schedule/manual');
            } else {
                console.error('Invalid result structure:', result);
                throw new Error(`Invalid response structure. Expected success=true and schedule data. Got: ${JSON.stringify(result)}`);
            }

        } catch (err: any) {
            console.error('FULL ERROR HER ELOOK HERE OML Full error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            
            // More specific error messages
            if (err.message?.includes('Failed to fetch')) {
                setError('Network error. Please check your connection and try again.');
            } else if (err.message?.includes('Authentication')) {
                setError('Please sign in to analyze images.');
            } else if (err.message?.includes('quota') || err.message?.includes('limit')) {
                setError('API quota exceeded. Please try again later.');
            } else if (err.message?.includes('safety') || err.message?.includes('blocked')) {
                setError('Image content was flagged by safety filters. Please try a different image.');
            } else {
                setError(err.message || 'Failed to analyze image. Please try again.');
            }
        } finally {
            setIsAnalyzing(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F9F5FF] ">
            			<Navbar isLoggedIn={isLoggedIn} />

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">Upload Your Schedule</h1>
                
                {/* Upload Area */}
                <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragOver 
                            ? 'border-[#663399] bg-purple-50' 
                            : 'border-gray-300 hover:border-[#663399]'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {previewUrl ? (
                        <div className="space-y-4">
                            <div className="relative inline-block">
                                <img 
                                    src={previewUrl} 
                                    alt="Selected schedule" 
                                    className="max-w-full max-h-64 rounded-lg shadow-md"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                {selectedImage?.name} ({(selectedImage?.size || 0 / (1024 * 1024)).toFixed(2)} MB)
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-gray-100 rounded-full">
                                    <FileImage size={48} className="text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-700">
                                    Drop your schedule image here
                                </p>
                                <p className="text-sm text-gray-500">
                                    or click to browse files
                                </p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="inline-flex items-center gap-2 bg-[#663399] text-white px-4 py-2 rounded-lg hover:bg-purple-700 cursor-pointer"
                            >
                                <Upload size={20} />
                                Choose File
                            </label>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Analyze Button */}
                {selectedImage && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={passToGemini}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-2 bg-[#663399] text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Analyzing Schedule...
                                </>
                            ) : (
                                <>
                                    <Camera size={20} />
                                    Analyze Schedule
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Tips for best results:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Make sure your schedule is clearly visible</li>
                        <li>• Include days of the week and time blocks</li>
                        <li>• Ensure good lighting and minimal shadows</li>
                        <li>• Supported formats: JPG, PNG, GIF, WebP (max 10MB)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}