'use client'

import { useState, useCallback } from 'react'
import UploadZone from './UploadZone'
import VideoPreview from './VideoPreview'
import ConversionControls from './ConversionControls'
import { VideoUpload, ConversionJob, ConversionFormat, extractSelectValue, createSelectValue, JobStatus } from '@/types'
import { VideoProcessor } from '@/lib/video-processor'
import { uploadVideo, createConversionJob } from '@/lib/cosmic'
import { startVideoConversion } from '@/lib/video-processor'

export default function VideoConverter() {
  const [uploads, setUploads] = useState<VideoUpload[]>([])
  const [currentJob, setCurrentJob] = useState<ConversionJob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const updateUploadProgress = useCallback((index: number, progress: number) => {
    setUploads(prev => prev.map((upload, idx) => 
      idx === index ? { ...upload, progress: Math.min(100, Math.max(0, progress)) } : upload
    ))
  }, [])

  const updateUploadStatus = useCallback((index: number, status: VideoUpload['status'], error?: string) => {
    setUploads(prev => prev.map((upload, idx) => 
      idx === index ? { 
        ...upload, 
        status, 
        error, 
        progress: status === 'uploaded' ? 100 : upload.progress 
      } : upload
    ))
  }, [])

  const generateUniqueSlug = (fileName: string): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const baseName = fileName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `convert-${baseName}-${timestamp}-${randomSuffix}`;
  }

  const handleFileUpload = async (files: File[]) => {
    // Clear previous upload error
    setUploadError(null)
    
    if (!files || files.length === 0) {
      console.error('No files provided for upload')
      setUploadError('No files selected for upload')
      return
    }

    console.log('=== Starting Video Upload Process ===')
    console.log('Files to process:', files.map(f => ({
      name: f?.name || 'unnamed',
      size: f?.size || 0,
      type: f?.type || 'unknown'
    })))

    // Create upload records for UI tracking
    const newUploads: VideoUpload[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploads(prev => [...prev, ...newUploads])
    const startIndex = uploads.length

    // Process each file sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadIndex = startIndex + i

      if (!file) {
        console.error(`File at index ${i} is null or undefined`)
        updateUploadStatus(uploadIndex, 'error', 'Invalid file')
        continue
      }

      try {
        console.log(`--- Processing File ${i + 1}/${files.length}: ${file.name} ---`)
        
        // Step 1: Validate file
        console.log('Step 1: Validating file...')
        const validation = VideoProcessor.validateVideoFile(file)
        if (!validation.isValid) {
          console.error('File validation failed:', validation.error)
          updateUploadStatus(uploadIndex, 'error', validation.error)
          continue
        }
        console.log('✓ File validation passed')

        // Step 2: Start upload progress indicator
        updateUploadProgress(uploadIndex, 5)

        // Step 3: Get video metadata for job creation
        console.log('Step 3: Extracting video metadata...')
        let metadata;
        try {
          metadata = await VideoProcessor.getVideoMetadata(file)
          console.log('✓ Video metadata extracted:', metadata)
        } catch (metadataError) {
          console.warn('Failed to extract metadata, using defaults:', metadataError)
          metadata = {
            duration: 0,
            width: 1920,
            height: 1080,
            aspectRatio: 16/9
          }
        }
        
        updateUploadProgress(uploadIndex, 15)

        // Step 4: Upload to Cosmic
        console.log('Step 4: Uploading to Cosmic CMS...')
        const uploadResult = await uploadVideo(file, 'conversion-videos')
        
        console.log('✓ Upload successful:', {
          mediaId: uploadResult.media.id,
          mediaUrl: uploadResult.media.url,
          mediaName: uploadResult.media.name
        })
        
        updateUploadProgress(uploadIndex, 80)

        // Step 5: Mark upload as completed
        updateUploadStatus(uploadIndex, 'uploaded')
        console.log('✓ Upload status updated to completed')

        // Step 6: Create conversion job (only for the first successful upload)
        if (!currentJob) {
          console.log('Step 6: Creating conversion job...')
          
          try {
            const aspectRatio = VideoProcessor.getAspectRatio('tiktok')
            const uniqueSlug = generateUniqueSlug(file.name)
            
            const jobData = {
              title: `Convert ${file.name}`,
              type: 'conversion-jobs' as const,
              slug: uniqueSlug,
              metadata: {
                input_video: {
                  id: uploadResult.media.id,
                  url: uploadResult.media.url,
                  imgix_url: uploadResult.media.imgix_url,
                  name: uploadResult.media.name
                },
                output_video: null,
                status: createSelectValue('pending' as JobStatus),
                format: createSelectValue('tiktok'),
                crop_settings: JSON.stringify({
                  position: 'center',
                  smart_crop: true,
                  aspect_ratio: aspectRatio
                }),
                progress: 0,
                error_message: null,
                processing_started_at: null,
                processing_completed_at: null
              }
            }

            console.log('Creating conversion job with data:', jobData)
            const job = await createConversionJob(jobData)
            
            // Convert the response to match our expected format
            const formattedJob: ConversionJob = {
              ...job,
              metadata: {
                input_video: job.metadata.input_video,
                output_video: job.metadata.output_video,
                status: job.metadata.status,
                format: job.metadata.format,
                crop_settings: typeof job.metadata.crop_settings === 'string' 
                  ? JSON.parse(job.metadata.crop_settings)
                  : job.metadata.crop_settings || {
                    position: 'center',
                    smart_crop: true,
                    aspect_ratio: aspectRatio
                  },
                progress: job.metadata.progress || 0,
                error_message: job.metadata.error_message,
                processing_started_at: job.metadata.processing_started_at,
                processing_completed_at: job.metadata.processing_completed_at
              }
            }
            
            setCurrentJob(formattedJob)
            console.log('✓ Conversion job created successfully:', formattedJob.id)
            
          } catch (jobError) {
            console.error('Failed to create conversion job:', jobError)
            const errorMessage = jobError instanceof Error ? jobError.message : 'Failed to create conversion job'
            // Don't mark upload as failed, just show a warning that job creation failed
            console.warn(`Upload successful but job creation failed: ${errorMessage}`)
          }
        }
        
        updateUploadProgress(uploadIndex, 100)
        console.log(`✓ File ${i + 1} processing completed successfully`)

      } catch (error) {
        console.error(`❌ Upload failed for file ${file.name}:`, error)
        
        let errorMessage = 'Upload failed'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        updateUploadStatus(uploadIndex, 'error', errorMessage)
        
        // Set global error for user feedback
        if (!uploadError) {
          setUploadError(errorMessage)
        }
      }
    }
    
    console.log('=== Upload Process Completed ===')
  }

  const handleStartConversion = async () => {
    if (!currentJob) {
      console.error('No conversion job available')
      return
    }

    setIsProcessing(true)
    try {
      console.log('Starting video conversion for job:', currentJob.id)
      const result = await startVideoConversion(currentJob)
      
      if (!result.success) {
        throw new Error(result.error || 'Conversion failed')
      }
      
      console.log('Video conversion started successfully')
    } catch (error) {
      console.error('Conversion error:', error)
      setUploadError(error instanceof Error ? error.message : 'Conversion failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSettingsChange = (settings: Partial<ConversionJob['metadata']['crop_settings']>) => {
    if (!currentJob) return

    const currentCropSettings = typeof currentJob.metadata.crop_settings === 'string' 
      ? JSON.parse(currentJob.metadata.crop_settings)
      : currentJob.metadata.crop_settings

    // Ensure we have a valid current crop settings object
    if (!currentCropSettings || typeof currentCropSettings !== 'object') {
      return
    }

    setCurrentJob(prev => prev ? {
      ...prev,
      metadata: {
        ...prev.metadata,
        crop_settings: {
          ...currentCropSettings,
          ...settings
        }
      }
    } : null)
  }

  const handleFormatChange = (format: ConversionFormat) => {
    if (!currentJob) return

    const aspectRatio = VideoProcessor.getAspectRatio(format)
    const currentCropSettings = typeof currentJob.metadata.crop_settings === 'string' 
      ? JSON.parse(currentJob.metadata.crop_settings)
      : currentJob.metadata.crop_settings

    // Ensure we have a valid current crop settings object
    if (!currentCropSettings || typeof currentCropSettings !== 'object') {
      return
    }

    setCurrentJob(prev => prev ? {
      ...prev,
      metadata: {
        ...prev.metadata,
        format: createSelectValue(format),
        crop_settings: {
          ...currentCropSettings,
          aspect_ratio: aspectRatio
        }
      }
    } : null)
  }

  const hasUploadedFiles = uploads.some(upload => upload.status === 'uploaded')
  const isUploading = uploads.some(upload => upload.status === 'uploading')

  return (
    <div className="max-w-7xl mx-auto">
      {/* Error Display */}
      {uploadError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-400">{uploadError}</p>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-1">
          <UploadZone 
            onUpload={handleFileUpload}
            isUploading={isUploading}
            acceptedFiles={['.mp4', '.mov', '.avi', '.webm']}
          />
          
          {uploads.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-white">Upload Progress</h3>
              {uploads.map((upload, index) => {
                if (!upload.file) {
                  return null
                }
                
                return (
                  <div 
                    key={`${upload.file.name}-${index}`}
                    className="bg-secondary-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white truncate max-w-[200px]">
                        {upload.file.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        upload.status === 'uploaded' 
                          ? 'bg-green-500/20 text-green-400'
                          : upload.status === 'error'
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {upload.status === 'uploaded' ? 'Complete' : 
                         upload.status === 'error' ? 'Failed' : 
                         'Uploading'}
                      </span>
                    </div>
                    
                    {upload.status === 'uploading' && (
                      <div className="mb-2">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-secondary-300 mt-1">
                          {upload.progress}% completed
                        </div>
                      </div>
                    )}
                    
                    {upload.error && (
                      <p className="text-red-400 text-xs mt-2 bg-red-500/10 p-2 rounded">
                        {upload.error}
                      </p>
                    )}
                    
                    {upload.status === 'uploaded' && (
                      <p className="text-green-400 text-xs mt-2">
                        ✓ Successfully uploaded to database
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Video Preview */}
        <div className="lg:col-span-1">
          {hasUploadedFiles && currentJob && (
            <VideoPreview
              originalVideo={currentJob.metadata.input_video.url}
              convertedVideo={currentJob.metadata.output_video?.url}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Conversion Controls */}
        <div className="lg:col-span-1">
          {hasUploadedFiles && currentJob && (
            <ConversionControls
              job={currentJob}
              onSettingsChange={handleSettingsChange}
              onFormatChange={handleFormatChange}
              onStartConversion={handleStartConversion}
              onCancel={() => setCurrentJob(null)}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </div>
    </div>
  )
}