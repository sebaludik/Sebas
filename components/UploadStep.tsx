import React, { useState, useCallback } from 'react';
import { ImageFile } from '../types';
import { convertFileToImageFile } from '../services/geminiService';

interface UploadStepProps {
  onImageUpload: (imageFile: ImageFile) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
        try {
            const imageFile = await convertFileToImageFile(file);
            onImageUpload(imageFile);
        } catch (error) {
            console.error("Error converting file:", error);
            alert("Could not process the file. Please try another image.");
        }
    } else {
        alert("Please select a valid image file.");
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, []);

  return (
    <div className="w-full max-w-2xl text-center">
      <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-purple-300 mb-2">Upload Your Image</h2>
        <p className="text-gray-400 mb-6">Start by uploading a photo with a face to begin editing expressions.</p>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
        />
        <label
          htmlFor="file-upload"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            mt-4 p-10 block w-full border-2 border-dashed rounded-lg cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-purple-400 hover:bg-gray-700/50'}
          `}
        >
          <div className="flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <p className="text-lg font-semibold text-gray-300">Drag & drop an image here</p>
            <p className="text-sm text-gray-500">or click to browse</p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default UploadStep;
