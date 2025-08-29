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

// Conversion job object - matches the CMS structure
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
    } | null;
    status: JobStatus | { key: JobStatus; value: JobStatus };
    format: ConversionFormat | { key: ConversionFormat; value: ConversionFormat };
    crop_settings: CropSettings | string; // Can be JSON string from CMS
    progress?: number;
    error_message?: string | null;
    processing_started_at?: string | null;
    processing_completed_at?: string | null;
  };
}

// User settings object
interface UserSettings extends CosmicObject {
  type: 'user-settings';
  metadata: {
    default_format: ConversionFormat | { key: ConversionFormat; value: ConversionFormat };
    auto_crop_enabled: boolean;
    quality_preset: QualityPreset | { key: QualityPreset; value: QualityPreset };
    preferred_position: CropPosition | { key: CropPosition; value: CropPosition };
    batch_processing_enabled: boolean;
  };
}

// Conversion preset object
interface ConversionPreset extends CosmicObject {
  type: 'conversion-presets';
  metadata: {
    name: string;
    description?: string;
    format: ConversionFormat | { key: ConversionFormat; value: ConversionFormat };
    crop_settings: CropSettings | string; // Can be JSON string from CMS
    quality_settings: QualitySettings | string; // Can be JSON string from CMS
    is_default: boolean;
  };
}

// Type literals for select-dropdown values - matching CMS values exactly
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
  onFormatChange: (format: ConversionFormat) => void;
  onStartConversion: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

// Utility types for creating and updating records
type CreateConversionJobData = {
  title: string;
  type: 'conversion-jobs';
  slug: string;
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
    } | null;
    status: { key: JobStatus; value: JobStatus };
    format: { key: ConversionFormat; value: ConversionFormat };
    crop_settings: string; // JSON string for CMS compatibility
    progress?: number;
    error_message?: string | null;
    processing_started_at?: string | null;
    processing_completed_at?: string | null;
  };
};

type UpdateConversionJobData = Partial<{
  status: JobStatus | { key: JobStatus; value: JobStatus };
  format: ConversionFormat | { key: ConversionFormat; value: ConversionFormat };
  crop_settings: string; // JSON string for CMS compatibility
  progress: number;
  error_message: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  output_video: {
    id: string;
    url: string;
    imgix_url: string;
    name: string;
  } | null;
}>;

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

// Utility functions for handling CMS select-dropdown values
function extractSelectValue<T>(value: T | { key: T; value: T }): T {
  if (typeof value === 'object' && value !== null && 'key' in value) {
    return (value as { key: T; value: T }).key;
  }
  return value as T;
}

function createSelectValue<T>(value: T): { key: T; value: T } {
  return { key: value, value: value };
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
  extractSelectValue,
  createSelectValue,
};