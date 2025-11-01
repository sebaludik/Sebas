import React, { useState, useCallback } from 'react';
import { Step, ImageFile } from './types';
import Header from './components/Header';
import UploadStep from './components/UploadStep';
import EditStep from './components/EditStep';
import * as geminiService from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [history, setHistory] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Gemini is thinking...');

  const currentImage = history.length > 0 ? history[history.length - 1] : null;

  const handleImageUpload = (imageFile: ImageFile) => {
    setHistory([imageFile]);
    setStep(Step.EDIT);
  };

  const handleEdit = useCallback(async (editFunction: () => Promise<ImageFile | null>) => {
    setIsLoading(true);
    try {
      const newImage = await editFunction();
      if (newImage) {
        setHistory(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error("Error during image editing:", error);
      alert("An error occurred while editing the image. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('Gemini is thinking...');
    }
  }, []);

  const handleBack = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    } else {
      setHistory([]);
      setStep(Step.UPLOAD);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = `data:${currentImage.mimeType};base64,${currentImage.base64}`;
    link.download = `edited-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleReset = () => {
    setHistory([]);
    setStep(Step.UPLOAD);
    setIsLoading(false);
  }

  const performExpressionEdit = useCallback((prompt: string) => {
    if (!currentImage) return;
    setLoadingMessage('Changing expression...');
    handleEdit(async () => geminiService.editImageWithPrompt(currentImage, prompt, 'original'));
  }, [currentImage, handleEdit]);

  const performAspectRatioChange = useCallback((aspectRatio: string) => {
    if (!currentImage) return;
    setLoadingMessage('Changing aspect ratio...');
    handleEdit(async () => geminiService.editImageWithPrompt(currentImage, '', aspectRatio));
  }, [currentImage, handleEdit]);

  const performObjectAddition = useCallback((objectImage: ImageFile, placement: string) => {
      if (!currentImage) return;
      setLoadingMessage('Adding object...');
      handleEdit(async () => geminiService.combineImages(currentImage, objectImage, placement));
  }, [currentImage, handleEdit]);

  const performObjectGeneration = useCallback(async (prompt: string, aspectRatio: string): Promise<ImageFile | null> => {
      try {
        const generatedImage = await geminiService.generateImage(prompt, aspectRatio);
        return generatedImage;
      } catch (error) {
        console.error("Error generating object:", error);
        alert("An error occurred while generating the object image. Please try again.");
        return null;
      }
  }, []);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <Header onReset={handleReset}/>
      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        {step === Step.UPLOAD && <UploadStep onImageUpload={handleImageUpload} />}
        {step === Step.EDIT && currentImage && (
          <EditStep
            imageFile={currentImage}
            onExpressionEdit={performExpressionEdit}
            onObjectAdd={performObjectAddition}
            onObjectGenerate={performObjectGeneration}
            onAspectRatioChange={performAspectRatioChange}
            onDownload={handleDownload}
            onBack={handleBack}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            canGoBack={history.length > 1}
          />
        )}
      </main>
    </div>
  );
};

export default App;