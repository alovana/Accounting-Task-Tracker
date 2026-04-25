export type WorkItemFile = {
  id: string;
  workItemId: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  storageProvider: string;
  storageBucket: string;
  storageObjectKey: string;
  uploadedByUserId?: string;
  uploadedByName: string;
  createdAt: string;
};
