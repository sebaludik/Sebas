import React, { useState, useCallback, useRef } from 'react';
import { ImageFile } from '../types';
import Spinner from './Spinner';
import IconButton from './IconButton';
import { convertFileToImageFile } from '../services/geminiService';

interface EditStepProps {
  imageFile: ImageFile;
  onExpressionEdit: (prompt: string) => void;
  onObjectAdd: (objectImage: ImageFile, placement: string) => void;
  onObjectGenerate: (prompt: string, aspectRatio: string) => Promise<ImageFile | null>;
  onAspectRatioChange: (aspectRatio: string) => void;
  onDownload: () => void;
  onBack: () => void;
  isLoading: boolean;
  loadingMessage: string;
  canGoBack: boolean;
}

type AddObjectMode = 'generate' | 'upload';

const PLACEMENT_OPTIONS = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right',
];

const EditStep: React.FC<EditStepProps> = ({
  imageFile,
  onExpressionEdit,
  onObjectAdd,
  onObjectGenerate,
  onAspectRatioChange,
  onDownload,
  onBack,
  isLoading,
  loadingMessage,
  canGoBack,
}) => {
  const [expressionPrompt, setExpressionPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('original');
  const [objectPrompt, setObjectPrompt] = useState('');
  const [objectAspectRatio, setObjectAspectRatio] = useState('1:1');
  const [addMode, setAddMode] = useState<AddObjectMode>('generate');
  const [objectPlacement, setObjectPlacement] = useState('auto');
  const [stagedObject, setStagedObject] = useState<ImageFile | null>(null);
  const [isGeneratingObject, setIsGeneratingObject] = useState(false);
  const objectUploadRef = useRef<HTMLInputElement>(null);

  const handleExpressionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expressionPrompt.trim()) {
      onExpressionEdit(expressionPrompt);
      setExpressionPrompt('');
    }
  };

  const handleAspectRatioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aspectRatio && aspectRatio !== 'original') {
        onAspectRatioChange(aspectRatio);
    }
  };

  const handleObjectGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (objectPrompt.trim()) {
      setIsGeneratingObject(true);
      const result = await onObjectGenerate(objectPrompt, objectAspectRatio);
      if (result) {
        setStagedObject(result);
      }
      setObjectPrompt('');
      setIsGeneratingObject(false);
    }
  };
  
  const handleObjectFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const objectImageFile = await convertFileToImageFile(file);
        setStagedObject(objectImageFile);
      } catch (error) {
        console.error("Error processing object upload:", error);
        alert("Could not process the uploaded object file.");
      }
    }
    if (e.target) {
        e.target.value = '';
    }
  }, []);

  const handleAddStagedObject = () => {
    if (stagedObject) {
        onObjectAdd(stagedObject, objectPlacement);
        setStagedObject(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 w-full lg:w-auto lg:sticky top-28">
        <div className="relative aspect-auto w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <img
            src={`data:${imageFile.mimeType};base64,${imageFile.base64}`}
            alt="Editable"
            className="w-full h-full object-contain"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
              <Spinner />
              <p className="mt-4 text-lg font-semibold animate-pulse">{loadingMessage}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <IconButton icon="back" onClick={onBack} disabled={isLoading || !canGoBack}>
            Undo
          </IconButton>
          <IconButton icon="download" onClick={onDownload} disabled={isLoading}>
            Download
          </IconButton>
        </div>
      </div>

      <div className="w-full lg:max-w-md flex flex-col gap-6">
        {/* Expression Editor */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-purple-300">Change Expression</h3>
          <form onSubmit={handleExpressionSubmit}>
            <textarea
              value={expressionPrompt}
              onChange={(e) => setExpressionPrompt(e.target.value)}
              placeholder="e.g., smiling happily, looking surprised..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
              rows={3}
              disabled={isLoading}
            />
            <div className="flex justify-end mt-4">
                <button
                type="submit"
                disabled={isLoading || !expressionPrompt.trim()}
                className="w-full sm:w-auto p-3 px-6 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                >
                Apply
                </button>
            </div>
          </form>
        </div>
        
        {/* Change Aspect Ratio */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-purple-300">Change Aspect Ratio</h3>
            <form onSubmit={handleAspectRatioSubmit}>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className='flex-1'>
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
                        <select
                            id="aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            disabled={isLoading}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                        >
                            <option value="original">Keep Original</option>
                            <option value="1:1">Square (1:1)</option>
                            <option value="16:9">Landscape (16:9)</option>
                            <option value="9:16">Portrait (9:16)</option>
                        </select>
                    </div>
                    <button
                    type="submit"
                    disabled={isLoading || aspectRatio === 'original'}
                    className="w-full sm:w-auto p-3 px-6 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                    >
                    Apply
                    </button>
                </div>
            </form>
        </div>


        {/* Add Object Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-purple-300">Add an Object</h3>
          <div className="flex border-b border-gray-700 mb-4">
            <button
              onClick={() => { setAddMode('generate'); setStagedObject(null); }}
              disabled={isGeneratingObject}
              className={`flex-1 py-2 text-center font-medium transition ${addMode === 'generate' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Generate with AI
            </button>
            <button
              onClick={() => { setAddMode('upload'); setStagedObject(null); }}
              disabled={isGeneratingObject}
              className={`flex-1 py-2 text-center font-medium transition ${addMode === 'upload' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Upload
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">Placement (Optional)</label>
            <div className="grid grid-cols-3 gap-2">
                {PLACEMENT_OPTIONS.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setObjectPlacement(p)}
                        disabled={isLoading || isGeneratingObject}
                        className={`p-2 rounded-md text-xs font-semibold transition capitalize disabled:opacity-50 ${
                            objectPlacement === p ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        {p.replace('-', ' ')}
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={() => setObjectPlacement('auto')}
                disabled={isLoading || isGeneratingObject}
                className={`w-full mt-2 p-2 rounded-md text-sm font-semibold transition disabled:opacity-50 ${
                    objectPlacement === 'auto' ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'
                }`}
            >
                Automatic
            </button>
          </div>

          {stagedObject && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <h4 className="text-md font-semibold text-gray-200 mb-3">Ready to Add</h4>
                <div className="flex items-center gap-4">
                    <img
                        src={`data:${stagedObject.mimeType};base64,${stagedObject.base64}`}
                        alt="Staged object preview"
                        className="w-20 h-20 object-contain rounded-md bg-gray-800 p-1"
                    />
                    <div className="flex-1 flex flex-col gap-2">
                        <button
                            onClick={handleAddStagedObject}
                            disabled={isLoading}
                            className="w-full p-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>
                            Add to Scene
                        </button>
                        <button
                            onClick={() => setStagedObject(null)}
                            disabled={isLoading}
                            className="w-full py-2 px-3 bg-gray-600 text-white font-semibold text-sm rounded-md hover:bg-gray-500 disabled:opacity-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
          )}

          {!stagedObject && addMode === 'generate' && (
            <form onSubmit={handleObjectGenerateSubmit}>
              <textarea
                value={objectPrompt}
                onChange={(e) => setObjectPrompt(e.target.value)}
                placeholder="e.g., a birthday hat, cool sunglasses..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                rows={2}
                disabled={isLoading || isGeneratingObject}
              />
               <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className='flex-1'>
                    <label htmlFor="object-aspect-ratio" className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
                    <select
                        id="object-aspect-ratio"
                        value={objectAspectRatio}
                        onChange={(e) => setObjectAspectRatio(e.target.value)}
                        disabled={isLoading || isGeneratingObject}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                    >
                        <option value="1:1">1:1</option>
                        <option value="16:9">16:9</option>
                        <option value="9:16">9:16</option>
                        <option value="4:3">4:3</option>
                        <option value="3:4">3:4</option>
                    </select>
                </div>
                <button
                type="submit"
                disabled={isLoading || isGeneratingObject || !objectPrompt.trim()}
                className="w-full sm:w-auto self-end p-3 px-6 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                >
                {isGeneratingObject ? 'Generating...' : 'Generate Object'}
                </button>
            </div>
            </form>
          )} 
          
          {!stagedObject && addMode === 'upload' && (
            <div>
              <input type="file" accept="image/*" className="hidden" ref={objectUploadRef} onChange={handleObjectFileUpload} />
              <button 
                onClick={() => objectUploadRef.current?.click()}
                disabled={isLoading || isGeneratingObject}
                className="w-full p-3 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                Upload Object
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditStep;