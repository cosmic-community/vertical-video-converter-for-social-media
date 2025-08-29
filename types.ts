// Base Cosmic object interface
interface CosmicObject {
  id: string;
  slug: string;
  title: string;
  content?: string;
  metadata: Record<string, any>;
  type: string;
  created_at: string;
  modified_at: string;
}

// Conversion job object
interface ConversionJob extends CosmicObject {
  type: 'conversion-jobs';
  metadata: {
    input_video: {
      id: string;
      url: string;
      imgix_url: string;
      name: string;
    };
    output_video?: {
      id: string;
      url: string;
      imgix_url: string;
      name: string;
    };
    status: JobStatus;
    format: ConversionFormat;
    crop_settings: CropSettings;
    progress?: number;
    error_message?: string;
    processing_started_at?: string;
    processing_completed_at?: string;
  };
}

// User settings object
interface UserSettings extends CosmicObject {
  type: 'user-settings';
  metadata: {
    default_format: ConversionFormat;
    auto_crop_enabled: boolean;
    quality_preset: QualityPreset;
    preferred_position: CropPosition;
    batch_processing_enabled: boolean;
  };
}

// Conversion preset object
interface ConversionPreset extends CosmicObject {
  type: 'conversion-presets';
  metadata: {
    name: string;
    description?: string;
    format: ConversionFormat;
    crop_settings: CropSettings;
    quality_settings: QualitySettings;
    is_default: boolean;
  };
}

// Type literals for select-dropdown values
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
type ConversionFormat = 'tiktok' | 'instagram-reel' | 'instagram-story' | 'custom';
type CropPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'smart';
type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

// Crop settings interface
interface CropSettings {
  position: CropPosition;
  smart_crop: boolean;
  manual_adjustment?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  aspect_ratio: {
    width: number;
    height: number;
  };
}

// Quality settings interface
interface QualitySettings {
  bitrate: number;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  codec: string;
}

// Video upload interface
interface VideoUpload {
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

// Conversion progress interface
interface ConversionProgress {
  jobId: string;
  progress: number;
  status: JobStatus;
  estimatedTimeRemaining?: number;
}

// API response types
interface CosmicResponse<T> {
  objects: T[];
  total: number;
  limit: number;
  skip: number;
}

interface ConversionResult {
  success: boolean;
  jobId?: string;
  downloadUrl?: string;
  error?: string;
}

// Component prop interfaces
interface VideoPreviewProps {
  originalVideo: string;
  convertedVideo?: string;
  isProcessing: boolean;
}

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  acceptedFiles?: string[];
}

interface ConversionControlsProps {
  job: ConversionJob;
  onSettingsChange: (settings: Partial<CropSettings>) => void;
  onStartConversion: () => void;
  onCancel: () => void;
}

// Utility types
type CreateConversionJobData = Omit<ConversionJob, 'id' | 'created_at' | 'modified_at'>;
type UpdateConversionJobData = Partial<ConversionJob['metadata']>;

// Type guards
function isConversionJob(obj: CosmicObject): obj is ConversionJob {
  return obj.type === 'conversion-jobs';
}

function isUserSettings(obj: CosmicObject): obj is UserSettings {
  return obj.type === 'user-settings';
}

function isConversionPreset(obj: CosmicObject): obj is ConversionPreset {
  return obj.type === 'conversion-presets';
}

export type {
  CosmicObject,
  ConversionJob,
  UserSettings,
  ConversionPreset,
  JobStatus,
  ConversionFormat,
  CropPosition,
  QualityPreset,
  CropSettings,
  QualitySettings,
  VideoUpload,
  ConversionProgress,
  CosmicResponse,
  ConversionResult,
  VideoPreviewProps,
  UploadZoneProps,
  ConversionControlsProps,
  CreateConversionJobData,
  UpdateConversionJobData,
};

export {
  isConversionJob,
  isUserSettings,
  isConversionPreset,
};