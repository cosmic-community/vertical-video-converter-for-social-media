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
    console.log('Creating conversion job with data:', jobData);
    
    const response = await cosmic.objects.insertOne({
      type: 'conversion-jobs',
      title: jobData.title,
      slug: jobData.slug,
      metadata: jobData.metadata
    });
    
    console.log('Conversion job created successfully:', response);
    return response.object as import('../types').ConversionJob;
  } catch (error) {
    console.error('Error creating conversion job:', error);
    throw new Error('Failed to create conversion job');
  }
}

export async function updateConversionJob(id: string, updates: import('../types').UpdateConversionJobData): Promise<import('../types').ConversionJob> {
  try {
    console.log('Updating conversion job:', id, 'with updates:', updates);
    
    const response = await cosmic.objects.updateOne(id, {
      metadata: updates
    });
    
    console.log('Conversion job updated successfully:', response);
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

// Enhanced file upload function with comprehensive error handling and logging
export async function uploadVideo(file: File, folder: string = 'videos') {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  console.log('Upload request details:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    folder: folder
  });

  // Validate file size
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    console.error('File size validation failed:', file.size, 'exceeds', maxSize);
    throw new Error('File size exceeds 500MB limit');
  }

  // Validate file type
  const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  if (!validTypes.includes(file.type)) {
    console.error('File type validation failed:', file.type, 'not in', validTypes);
    throw new Error('Invalid file type. Only MP4, MOV, AVI, and WebM files are supported');
  }

  // Check environment variables
  if (!process.env.COSMIC_BUCKET_SLUG || !process.env.COSMIC_WRITE_KEY) {
    console.error('Missing environment variables:', {
      bucketSlug: !!process.env.COSMIC_BUCKET_SLUG,
      writeKey: !!process.env.COSMIC_WRITE_KEY
    });
    throw new Error('Server configuration error: Missing API credentials');
  }

  try {
    console.log('Starting Cosmic media upload...');
    
    // Use the Cosmic client that's already configured
    const response = await cosmic.media.insertOne({
      media: file,
      folder: folder
    });
    
    console.log('Raw Cosmic API response:', response);
    
    // Enhanced response validation with detailed logging
    if (!response || typeof response !== 'object') {
      console.error('Invalid response type:', typeof response, response);
      throw new Error('Upload failed: Invalid server response format');
    }
    
    // Extract media object from various possible response structures
    let mediaObject = null;
    
    if (response.media && typeof response.media === 'object') {
      console.log('Found media in response.media');
      mediaObject = response.media;
    } else if (response.object && typeof response.object === 'object') {
      console.log('Found media in response.object');
      mediaObject = response.object;
    } else if (response.id && response.url) {
      console.log('Response itself contains media data');
      mediaObject = response;
    } else {
      console.error('No media object found in response structure:', Object.keys(response));
      throw new Error('Upload completed but server response format is unrecognized');
    }
    
    if (!mediaObject) {
      console.error('mediaObject is null after extraction attempts');
      throw new Error('Upload completed but no media data found in response');
    }
    
    console.log('Extracted media object:', mediaObject);
    
    // Validate essential properties with detailed error messages
    if (!mediaObject.id) {
      console.error('Media object structure:', Object.keys(mediaObject));
      throw new Error('Upload completed but media ID is missing from response');
    }
    
    if (!mediaObject.url) {
      console.error('Media object with ID but no URL:', mediaObject.id);
      throw new Error('Upload completed but media URL is missing from response');
    }
    
    // Create standardized response object
    const standardizedResponse = {
      media: {
        id: mediaObject.id,
        url: mediaObject.url,
        imgix_url: mediaObject.imgix_url || mediaObject.url,
        name: mediaObject.name || mediaObject.original_name || file.name,
        type: mediaObject.type || file.type,
        size: mediaObject.size || file.size
      }
    };
    
    console.log('Upload successful! Standardized response:', standardizedResponse);
    
    return standardizedResponse;
    
  } catch (error) {
    console.error('Cosmic upload error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    
    // Handle different types of errors with specific messaging
    if (error instanceof TypeError) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        throw new Error('Network error: Unable to reach upload server. Please check your internet connection.');
      } else if (errorMessage.includes('cannot read properties')) {
        throw new Error('Upload failed: Server returned invalid data. Please try again.');
      }
      throw new Error('Upload failed due to a technical error. Please try again.');
    }
    
    // Handle Cosmic API specific errors
    if (hasStatus(error)) {
      console.error('API status error:', error.status);
      switch (error.status) {
        case 400:
          throw new Error('Invalid file format or corrupted file. Please try a different video.');
        case 401:
          throw new Error('Authentication failed: Invalid API credentials.');
        case 403:
          throw new Error('Upload permission denied: Check your API key permissions.');
        case 413:
          throw new Error('File too large: Maximum size is 500MB.');
        case 415:
          throw new Error('Unsupported file type: Please use MP4, MOV, AVI, or WebM.');
        case 429:
          throw new Error('Too many requests: Please wait a moment and try again.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server error: Our upload servers are temporarily unavailable. Please try again in a few minutes.');
        default:
          throw new Error(`Upload failed with server error ${error.status}. Please try again.`);
      }
    }
    
    // Re-throw specific custom errors
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('File size exceeds') ||
          message.includes('Invalid file type') ||
          message.includes('Server configuration error') ||
          message.includes('Upload completed but') ||
          message.includes('Network error:') ||
          message.includes('Upload failed:')) {
        throw error;
      }
    }
    
    // Default fallback error
    throw new Error('Upload failed due to an unexpected error. Please try again or contact support if the problem persists.');
  }
}