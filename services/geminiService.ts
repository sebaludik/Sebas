import { GoogleGenAI, Modality } from "@google/genai";
import { ImageFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
  
export const convertFileToImageFile = async (file: File): Promise<ImageFile> => {
    const base64 = await fileToBase64(file);
    return { base64, mimeType: file.type };
}

export const editImageWithPrompt = async (
  imageFile: ImageFile,
  prompt: string,
  aspectRatio: string
): Promise<ImageFile | null> => {
  const model = 'gemini-2.5-flash-image';
  
  let fullPrompt = '';

  const hasPrompt = prompt && prompt.trim().length > 0;
  const hasAspectRatio = aspectRatio && aspectRatio !== 'original';

  if (hasAspectRatio) {
    fullPrompt = `Change the aspect ratio of this image to ${aspectRatio}.`;
    if (hasPrompt) {
        // This case is unlikely with the new UI, but handles it for robustness.
        fullPrompt += ` Also, apply this change: ${prompt}`;
    } else {
        fullPrompt += ` Do not change the subject or content of the image, only extend or crop the scene naturally to fit the new aspect ratio.`
    }
  } else if (hasPrompt) {
    fullPrompt = prompt;
  } else {
    // If there's no prompt and no aspect ratio change, do nothing.
    return imageFile;
  }

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageFile.base64,
            mimeType: imageFile.mimeType,
          },
        },
        { text: fullPrompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }
  }
  return null;
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<ImageFile | null> => {
    const model = 'imagen-4.0-generate-001';
    
    const response = await ai.models.generateImages({
        model,
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const image = response.generatedImages[0];
        return {
            base64: image.image.imageBytes,
            mimeType: 'image/png',
        };
    }
    return null;
};

export const combineImages = async (
  baseImage: ImageFile,
  objectImage: ImageFile,
  placement: string
): Promise<ImageFile | null> => {
    const model = 'gemini-2.5-flash-image';

    let placementInstruction = "Let AI decide the best placement.";
    if (placement && placement !== 'auto') {
        const placementText = placement.replace('-', ' ');
        placementInstruction = `Place the object at the ${placementText} location of the scene.`;
    }
    
    const prompt = `Your task is to realistically integrate an object from a second image into a primary scene from a first image. The second image contains the object to add.

Instructions:
1.  Analyze the lighting, shadows, perspective, and overall style of the primary scene image.
2.  Seamlessly composite the object from the second image into the scene.
3.  ${placementInstruction}
4.  This is not just an overlay. The object must appear as a natural part of the scene. Adjust the object's properties (lighting, shadows, color temperature, grain, focus) to perfectly match the surrounding environment.
5.  Ensure the object casts appropriate shadows on the scene and receives lighting and shadows from elements within the scene.
6.  If the object is placed on a person or another object (e.g., a hat on a head), it must conform to the shape, contours, and perspective of that surface. It should look like it's really there, interacting with the scene.
7.  The final image should be highly convincing and photorealistic, as if the object was part of the original photograph.
8.  Crucially, DO NOT change the aspect ratio of the primary scene image. The output dimensions must match the first image.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        data: baseImage.base64,
                        mimeType: baseImage.mimeType,
                    },
                },
                {
                    inlineData: {
                        data: objectImage.base64,
                        mimeType: objectImage.mimeType,
                    },
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return {
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }
    }
    return null;
};