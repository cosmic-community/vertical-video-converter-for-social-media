'use client'

import { useState, useCallback } from 'react'
import UploadZone from './UploadZone'
import VideoPreview from './VideoPreview'
import ConversionControls from './ConversionControls'
import { VideoUpload, ConversionJob, ConversionFormat } from '@/types'
import { VideoProcessor } from '@/lib/video-processor'
import { uploadVideo, createConversionJob } from '@/lib/cosmic'
import { startVideoConversion } from '@/lib/video-processor'

export default function VideoConverter() {
  const [uploads, setUploads] = useState<VideoUpload[]>([])
  const [currentJob, setCurrentJob] = useState<ConversionJob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const updateUploadProgress = useCallback((index: number, progress: number) => {
    setUploads(prev => prev.map((upload, idx) => 
      idx === index ? { ...upload, progress } : upload
    ))
  }, [])

  const updateUploadStatus = useCallback((index: number, status: VideoUpload['status'], error?: string) => {
    setUploads(prev => prev.map((upload, idx) => 
      idx === index ? { ...upload, status, error, progress: status === 'uploaded' ? 100 : upload.progress } : upload
    ))
  }, [])

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) {
      console.error('No files provided for upload')
      return
    }

    console.log('Starting upload process for files:', files.map(f => f?.name || 'unknown'))

    const newUploads: VideoUpload[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file) {
        console.error(`File at index ${i} is undefined`)
        continue
      }
      
      const uploadIndex = uploads.length + i

      try {
        console.log(`Processing file ${i + 1}/${files.length}:`, file.name)
        
        // Validate file first
        const validation = VideoProcessor.validateVideoFile(file)
        if (!validation.isValid) {
          console.error('File validation failed:', validation.error)
          updateUploadStatus(uploadIndex, 'error', validation.error)
          continue
        }

        // Update progress to show upload starting
        updateUploadProgress(uploadIndex, 10)

        // Upload to Cosmic
        console.log('Starting upload to Cosmic for:', file.name)
        const uploadResult = await uploadVideo(file)
        
        console.log('Upload result:', uploadResult)
        
        // Simple validation - just check if we got a result with media
        if (!uploadResult?.media?.id || !uploadResult?.media?.url) {
          throw new Error('Upload failed: Invalid response from server')
        }

        console.log('Upload successful, updating status')
        updateUploadStatus(uploadIndex, 'uploaded')

        // Create conversion job for the first successful upload
        if (!currentJob) {
          try {
            console.log('Creating conversion job for first successful upload')
            const metadata = await VideoProcessor.getVideoMetadata(file)
            const aspectRatio = VideoProcessor.getAspectRatio('tiktok')
            
            const jobData = {
              title: `Convert ${file.name}`,
              type: 'conversion-jobs' as const,
              slug: `convert-${Date.now()}`,
              metadata: {
                input_video: {
                  id: uploadResult.media.id,
                  url: uploadResult.media.url,
                  imgix_url: uploadResult.media.imgix_url || uploadResult.media.url,
                  name: uploadResult.media.name || file.name
                },
                status: 'pending' as const,
                format: 'tiktok' as ConversionFormat,
                crop_settings: {
                  position: 'center' as const,
                  smart_crop: true,
                  aspect_ratio: aspectRatio
                },
                progress: 0
              }
            }

            console.log('Creating conversion job with data:', jobData)
            const job = await createConversionJob(jobData)
            console.log('Conversion job created successfully:', job)

            setCurrentJob(job)
          } catch (jobError) {
            console.error('Failed to create conversion job:', jobError)
            const jobErrorMessage = jobError instanceof Error ? jobError.message : 'Failed to create conversion job'
            updateUploadStatus(uploadIndex, 'error', `Upload successful but ${jobErrorMessage}`)
          }
        }
      } catch (error) {
        console.error(`Upload error for file ${file.name}:`, error)
        
        let errorMessage = 'Upload failed'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        updateUploadStatus(uploadIndex, 'error', errorMessage)
      }
    }
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
      // Show error to user (you might want to add error state)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSettingsChange = (settings: Partial<ConversionJob['metadata']['crop_settings']>) => {
    if (!currentJob) return

    setCurrentJob(prev => prev ? {
      ...prev,
      metadata: {
        ...prev.metadata,
        crop_settings: {
          ...prev.metadata.crop_settings,
          ...settings
        }
      }
    } : null)
  }

  const handleFormatChange = (format: ConversionFormat) => {
    if (!currentJob) return

    const aspectRatio = VideoProcessor.getAspectRatio(format)
    setCurrentJob(prev => prev ? {
      ...prev,
      metadata: {
        ...prev.metadata,
        format,
        crop_settings: {
          ...prev.metadata.crop_settings,
          aspect_ratio: aspectRatio
        }
      }
    } : null)
  }

  const hasUploadedFiles = uploads.some(upload => upload.status === 'uploaded')
  const isUploading = uploads.some(upload => upload.status === 'uploading')

  return (
    <div className="max-w-7xl mx-auto">
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
              <h3 className="text-lg font-semibold text-white">Uploaded Files</h3>
              {uploads.map((upload, index) => {
                // Add safety check for undefined file
                if (!upload.file) {
                  return null
                }
                
                return (
                  <div 
                    key={`${upload.file.name}-${index}`}
                    className="bg-secondary-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white truncate">
                        {upload.file.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        upload.status === 'uploaded' 
                          ? 'bg-green-500/20 text-green-400'
                          : upload.status === 'error'
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                    
                    {upload.status === 'uploading' && (
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {upload.error && (
                      <p className="text-red-400 text-xs mt-2">{upload.error}</p>
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