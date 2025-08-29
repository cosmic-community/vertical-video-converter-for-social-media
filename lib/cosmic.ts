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

// File upload function with comprehensive error handling and response validation
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
    
    // Create upload promise with timeout
    const uploadPromise = cosmic.media.insertOne({
      media: file,
      folder: folder
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout after 60 seconds')), 60000);
    });
    
    const response = await Promise.race([uploadPromise, timeoutPromise]);
    
    console.log('Raw upload response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', response ? Object.keys(response) : 'no keys');
    
    // Comprehensive response validation
    if (!response) {
      console.error('No response received from upload');
      throw new Error('Upload failed: No response from server');
    }
    
    if (typeof response !== 'object') {
      console.error('Invalid response type:', typeof response, response);
      throw new Error('Upload failed: Invalid response format');
    }
    
    // Check for different possible response structures from Cosmic API
    let mediaObject = null;
    
    // Check for response.media first (most common structure)
    if ('media' in response && response.media) {
      mediaObject = response.media;
      console.log('Found media in response.media:', mediaObject);
    }
    // Check for response.object (alternative structure)
    else if ('object' in response && response.object) {
      mediaObject = response.object;
      console.log('Found media in response.object:', mediaObject);
    }
    // Check if response itself is the media object
    else if ('id' in response && 'url' in response) {
      mediaObject = response;
      console.log('Response itself appears to be the media object:', mediaObject);
    }
    // Check for response.data (another possible structure)
    else if ('data' in response && response.data) {
      mediaObject = response.data;
      console.log('Found media in response.data:', mediaObject);
    }
    
    if (!mediaObject) {
      console.error('No media object found in response structure:', response);
      throw new Error('Upload failed: Invalid response structure - no media object found');
    }
    
    // Validate media object has required properties
    if (typeof mediaObject !== 'object') {
      console.error('Media object is not an object:', typeof mediaObject, mediaObject);
      throw new Error('Upload failed: Invalid media object type');
    }
    
    if (!('id' in mediaObject) || !mediaObject.id) {
      console.error('Media object missing id:', mediaObject);
      throw new Error('Upload failed: Media object missing ID');
    }
    
    if (!('url' in mediaObject) || !mediaObject.url) {
      console.error('Media object missing url:', mediaObject);
      throw new Error('Upload failed: Media object missing URL');
    }
    
    console.log('Upload successful, media object:', mediaObject);
    
    // Return in consistent format regardless of original response structure
    return {
      media: mediaObject
    };
    
  } catch (error) {
    console.error('Upload error details:', error);
    
    // Handle timeout errors specifically
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Upload timed out. Please check your internet connection and try again with a smaller file.');
    }
    
    // Handle fetch/network errors
    if (error instanceof TypeError) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      if (errorMessage.includes('cannot read properties')) {
        throw new Error('Upload failed due to invalid response. Please try again.');
      }
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    // Handle Cosmic API specific errors
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
          throw new Error('Too many uploads. Please wait a moment and try again.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server error. Please try again in a few moments.');
        default:
          throw new Error(`Upload failed with status ${error.status}. Please try again.`);
      }
    }
    
    // Handle other error types
    if (error instanceof Error) {
      // Check if it's already one of our custom error messages
      if (error.message.startsWith('Upload failed:') || 
          error.message.includes('Network error') ||
          error.message.includes('File size exceeds') ||
          error.message.includes('Invalid file type')) {
        throw error; // Re-throw our custom errors as-is
      }
      
      console.error('Unexpected upload error:', error.stack);
      throw new Error('Failed to upload video. Please try again.');
    }
    
    // Fallback error
    throw new Error('Failed to upload video. Please try again.');
  }
}