import { createBucketClient } from '@cosmicjs/sdk'

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
})

// Error handling helper
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Conversion jobs functions
export async function getConversionJobs(): Promise<import('../types').ConversionJob[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'conversion-jobs' })
      .props(['id', 'title', 'slug', 'metadata', 'created_at'])
      .depth(1);
    
    // Manual sorting by created date (newest first)
    return (response.objects as import('../types').ConversionJob[]).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch conversion jobs');
  }
}

export async function getConversionJob(id: string): Promise<import('../types').ConversionJob | null> {
  try {
    const response = await cosmic.objects
      .findOne({ id, type: 'conversion-jobs' })
      .depth(1);
    
    return response.object as import('../types').ConversionJob;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch conversion job');
  }
}

export async function createConversionJob(jobData: import('../types').CreateConversionJobData): Promise<import('../types').ConversionJob> {
  try {
    const response = await cosmic.objects.insertOne({
      type: 'conversion-jobs',
      title: jobData.title,
      metadata: jobData.metadata
    });
    
    return response.object as import('../types').ConversionJob;
  } catch (error) {
    console.error('Error creating conversion job:', error);
    throw new Error('Failed to create conversion job');
  }
}

export async function updateConversionJob(id: string, updates: import('../types').UpdateConversionJobData): Promise<import('../types').ConversionJob> {
  try {
    const response = await cosmic.objects.updateOne(id, {
      metadata: updates
    });
    
    return response.object as import('../types').ConversionJob;
  } catch (error) {
    console.error('Error updating conversion job:', error);
    throw new Error('Failed to update conversion job');
  }
}

// User settings functions
export async function getUserSettings(): Promise<import('../types').UserSettings | null> {
  try {
    const response = await cosmic.objects
      .find({ type: 'user-settings' })
      .props(['id', 'title', 'metadata'])
      .limit(1);
    
    return response.objects[0] as import('../types').UserSettings || null;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch user settings');
  }
}

// Conversion presets functions
export async function getConversionPresets(): Promise<import('../types').ConversionPreset[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'conversion-presets' })
      .props(['id', 'title', 'metadata']);
    
    return response.objects as import('../types').ConversionPreset[];
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch conversion presets');
  }
}

// Simplified file upload function with robust error handling
export async function uploadVideo(file: File, folder: string = 'videos') {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // Validate file size
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 500MB limit');
  }

  // Validate file type
  const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only MP4, MOV, AVI, and WebM files are supported');
  }

  try {
    console.log('Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Simple upload call without complex timeout handling
    const response = await cosmic.media.insertOne({
      media: file,
      folder: folder
    });
    
    console.log('Upload response received:', response);
    
    // Validate response structure - handle various possible Cosmic API response formats
    if (!response || typeof response !== 'object') {
      console.error('Invalid response format:', response);
      throw new Error('Upload failed: Invalid server response');
    }
    
    // Extract media object from response
    let mediaObject = null;
    
    // Try different response structures that Cosmic API might return
    if (response.media && typeof response.media === 'object') {
      mediaObject = response.media;
    } else if (response.object && typeof response.object === 'object') {
      mediaObject = response.object;
    } else if (response.id && response.url) {
      // Response itself might be the media object
      mediaObject = response;
    }
    
    if (!mediaObject) {
      console.error('No media object found in response:', response);
      throw new Error('Upload completed but server response format is invalid');
    }
    
    // Validate essential media properties
    if (!mediaObject.id) {
      console.error('Media object missing ID:', mediaObject);
      throw new Error('Upload completed but media ID is missing');
    }
    
    if (!mediaObject.url) {
      console.error('Media object missing URL:', mediaObject);
      throw new Error('Upload completed but media URL is missing');
    }
    
    console.log('Upload successful - Media ID:', mediaObject.id, 'URL:', mediaObject.url);
    
    // Return standardized format
    return {
      media: {
        id: mediaObject.id,
        url: mediaObject.url,
        imgix_url: mediaObject.imgix_url || mediaObject.url,
        name: mediaObject.name || mediaObject.original_name || file.name,
        type: mediaObject.type || file.type,
        size: mediaObject.size || file.size
      }
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle network and API errors
    if (error instanceof TypeError) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw new Error('Upload failed. Please try again.');
    }
    
    // Handle Cosmic API status errors
    if (hasStatus(error)) {
      switch (error.status) {
        case 413:
          throw new Error('File too large. Maximum size is 500MB.');
        case 415:
          throw new Error('Unsupported file type. Please use MP4, MOV, AVI, or WebM.');
        case 403:
          throw new Error('Upload permission denied. Check your API keys.');
        case 401:
          throw new Error('Authentication failed. Check your API keys.');
        case 429:
          throw new Error('Too many uploads. Please wait and try again.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server error. Please try again in a few moments.');
        default:
          throw new Error(`Upload failed (Error ${error.status}). Please try again.`);
      }
    }
    
    // Re-throw custom errors as-is
    if (error instanceof Error) {
      if (error.message.includes('File size exceeds') ||
          error.message.includes('Invalid file type') ||
          error.message.includes('Network error') ||
          error.message.includes('Upload completed but') ||
          error.message.includes('Upload failed:')) {
        throw error;
      }
    }
    
    // Default error
    throw new Error('Upload failed. Please try again.');
  }
}