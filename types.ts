export enum Step {
  UPLOAD,
  EDIT,
}

export interface ImageFile {
  base64: string;
  mimeType: string;
}
