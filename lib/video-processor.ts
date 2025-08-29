import { ConversionFormat, CropSettings, ConversionJob } from '@/types';

// Video processing utilities
export class VideoProcessor {
  static getAspectRatio(format: ConversionFormat): { width: number; height: number } {
    switch (format) {
      case 'tiktok':
      case 'instagram-reel':
        return { width: 9, height: 16 };
      case 'instagram-story':
        return { width: 9, height: 16 };
      case 'custom':
      default:
        return { width: 9, height: 16 };
    }
  }

  static getOptimalCropPosition(
    videoWidth: number,
    videoHeight: number,
    targetAspectRatio: { width: number; height: number },
    position: CropSettings['position'] = 'center'
  ): { x: number; y: number; width: number; height: number } {
    const targetRatio = targetAspectRatio.width / targetAspectRatio.height;
    const sourceRatio = videoWidth / videoHeight;

    let cropWidth: number;
    let cropHeight: number;
    let x: number;
    let y: number;

    if (sourceRatio > targetRatio) {
      // Video is wider than target - crop horizontally
      cropHeight = videoHeight;
      cropWidth = cropHeight * targetRatio;
      y = 0;
      
      switch (position) {
        case 'left':
          x = 0;
          break;
        case 'right':
          x = videoWidth - cropWidth;
          break;
        case 'center':
        case 'smart':
        default:
          x = (videoWidth - cropWidth) / 2;
          break;
      }
    } else {
      // Video is taller than target or same ratio - crop vertically
      cropWidth = videoWidth;
      cropHeight = cropWidth / targetRatio;
      x = 0;
      
      switch (position) {
        case 'top':
          y = 0;
          break;
        case 'bottom':
          y = videoHeight - cropHeight;
          break;
        case 'center':
        case 'smart':
        default:
          y = (videoHeight - cropHeight) / 2;
          break;
      }
    }

    return {
      x: Math.max(0, Math.round(x)),
      y: Math.max(0, Math.round(y)),
      width: Math.min(videoWidth, Math.round(cropWidth)),
      height: Math.min(videoHeight, Math.round(cropHeight))
    };
  }

  static generatePreviewCanvas(
    video: HTMLVideoElement,
    cropSettings: CropSettings,
    targetWidth: number = 300,
    targetHeight: number = 533
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const aspectRatio = VideoProcessor.getAspectRatio('tiktok');
    const cropArea = cropSettings.manual_adjustment || 
      VideoProcessor.getOptimalCropPosition(
        video.videoWidth,
        video.videoHeight,
        aspectRatio,
        cropSettings.position
      );

    // Draw the cropped video frame to canvas
    ctx.drawImage(
      video,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, targetWidth, targetHeight
    );

    return canvas;
  }

  static estimateProcessingTime(fileSizeBytes: number): number {
    // Rough estimation: ~10MB per minute of processing time
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    const estimatedMinutes = Math.max(1, Math.ceil(fileSizeMB / 10));
    return estimatedMinutes * 60; // Return in seconds
  }

  static validateVideoFile(file: File): { isValid: boolean; error?: string } {
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      };
    }

    const validTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm'
    ];

    if (!validTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload MP4, MOV, AVI, or WebM files.'
      };
    }

    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 500MB.'
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty. Please select a valid video file.'
      };
    }

    return { isValid: true };
  }

  static async getVideoMetadata(file: File): Promise<{
    duration: number;
    width: number;
    height: number;
    aspectRatio: number;
  }> {
    if (!file) {
      throw new Error('No file provided for metadata extraction');
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          reject(new Error('Invalid video: no video dimensions found'));
          return;
        }
        
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight
        });
      };
      
      video.onerror = (event) => {
        URL.revokeObjectURL(url);
        console.error('Video loading error:', event);
        reject(new Error('Failed to load video metadata. The file may be corrupted or in an unsupported format.'));
      };
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Timeout while loading video metadata'));
      }, 10000); // 10 second timeout
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          reject(new Error('Invalid video: no video dimensions found'));
          return;
        }
        
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight
        });
      };
      
      video.src = url;
    });
  }
}

// Mock conversion API (replace with actual server endpoint)
export async function startVideoConversion(job: ConversionJob): Promise<{ success: boolean; error?: string }> {
  try {
    if (!job || !job.id) {
      throw new Error('Invalid job data provided');
    }

    // This would typically call your server-side video processing API
    const response = await fetch('/api/convert-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: job.id,
        inputVideo: job.metadata.input_video,
        cropSettings: job.metadata.crop_settings,
        format: job.metadata.format
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Conversion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}