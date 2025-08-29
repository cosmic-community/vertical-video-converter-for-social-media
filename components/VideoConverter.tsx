'use client'

import { useState } from 'react'
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

  const handleFileUpload = async (files: File[]) => {
    const newUploads = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadIndex = uploads.length + i

      try {
        // Validate file
        const validation = VideoProcessor.validateVideoFile(file)
        if (!validation.isValid) {
          setUploads(prev => prev.map((upload, idx) => 
            idx === uploadIndex 
              ? { ...upload, status: 'error', error: validation.error }
              : upload
          ))
          continue
        }

        // Upload to Cosmic
        const uploadedMedia = await uploadVideo(file)
        
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { ...upload, status: 'uploaded', progress: 100 }
            : upload
        ))

        // Create conversion job
        if (!currentJob) {
          const metadata = await VideoProcessor.getVideoMetadata(file)
          const aspectRatio = VideoProcessor.getAspectRatio('tiktok')
          
          const job = await createConversionJob({
            title: `Convert ${file.name}`,
            type: 'conversion-jobs',
            slug: `convert-${Date.now()}`,
            metadata: {
              input_video: uploadedMedia.media,
              status: 'pending',
              format: 'tiktok',
              crop_settings: {
                position: 'center',
                smart_crop: true,
                aspect_ratio: aspectRatio
              },
              progress: 0
            }
          })

          setCurrentJob(job)
        }
      } catch (error) {
        console.error('Upload error:', error)
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { ...upload, status: 'error', error: 'Upload failed' }
            : upload
        ))
      }
    }
  }

  const handleStartConversion = async () => {
    if (!currentJob) return

    setIsProcessing(true)
    try {
      const result = await startVideoConversion(currentJob)
      if (!result.success) {
        throw new Error(result.error || 'Conversion failed')
      }
    } catch (error) {
      console.error('Conversion error:', error)
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-1">
          <UploadZone 
            onUpload={handleFileUpload}
            isUploading={uploads.some(upload => upload.status === 'uploading')}
            acceptedFiles={['.mp4', '.mov', '.avi', '.webm']}
          />
          
          {uploads.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-white">Uploaded Files</h3>
              {uploads.map((upload, index) => (
                <div 
                  key={index} 
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
              ))}
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