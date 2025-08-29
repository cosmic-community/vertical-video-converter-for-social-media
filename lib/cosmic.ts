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

// File upload function
export async function uploadVideo(file: File, folder: string = 'videos') {
  try {
    const media = await cosmic.media.insertOne({
      media: file,
      folder: folder
    });
    
    return media;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new Error('Failed to upload video');
  }
}