'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Video } from 'lucide-react'
import { UploadZoneProps } from '@/types'

export default function UploadZone({ 
  onUpload, 
  isUploading, 
  acceptedFiles = ['.mp4', '.mov', '.avi', '.webm'] 
}: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles)
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': acceptedFiles
    },
    multiple: true,
    disabled: isUploading
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'dragover' : ''} ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <div className="animate-spin">
              <Upload className="w-12 h-12 text-primary-500" />
            </div>
          ) : (
            <Video className="w-12 h-12 text-primary-500" />
          )}
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              {isUploading ? 'Uploading...' : 'Drop your videos here'}
            </h3>
            <p className="text-secondary-300 mb-4">
              {isDragActive 
                ? 'Drop the files here...' 
                : 'Or click to select files'
              }
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {acceptedFiles.map(format => (
                <span 
                  key={format}
                  className="text-xs bg-secondary-200 text-secondary-900 px-2 py-1 rounded"
                >
                  {format.replace('.', '').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {!isUploading && (
          <div className="mt-6 text-center">
            <button className="btn-primary">
              Choose Files
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-secondary-300">
        <p>• Maximum file size: 500MB</p>
        <p>• Supported formats: MP4, MOV, AVI, WebM</p>
        <p>• Multiple files supported</p>
      </div>
    </div>
  )
}