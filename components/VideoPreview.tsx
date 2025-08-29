'use client'

import { VideoPreviewProps } from '@/types'
import { Play, Pause } from 'lucide-react'
import { useState, useRef } from 'react'

export default function VideoPreview({ 
  originalVideo, 
  convertedVideo, 
  isProcessing 
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showConverted, setShowConverted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Preview</h3>
        
        {convertedVideo && (
          <div className="flex bg-secondary-800 rounded-lg p-1">
            <button
              onClick={() => setShowConverted(false)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                !showConverted 
                  ? 'bg-primary-500 text-white' 
                  : 'text-secondary-300 hover:text-white'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setShowConverted(true)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                showConverted 
                  ? 'bg-primary-500 text-white' 
                  : 'text-secondary-300 hover:text-white'
              }`}
            >
              Converted
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div className={`video-container ${showConverted ? 'vertical' : ''}`}>
          {isProcessing && !convertedVideo ? (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary-800 rounded-lg">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white">Converting video...</p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={showConverted && convertedVideo ? convertedVideo : originalVideo}
              className="w-full h-full object-cover"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}
        </div>

        {!isProcessing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors duration-200"
          >
            {isPlaying ? (
              <Pause className="w-16 h-16 text-white/80" />
            ) : (
              <Play className="w-16 h-16 text-white/80" />
            )}
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-secondary-800 rounded-lg p-3">
          <span className="text-secondary-300">Format:</span>
          <p className="text-white font-medium">
            {showConverted ? 'Vertical (9:16)' : 'Original'}
          </p>
        </div>
        <div className="bg-secondary-800 rounded-lg p-3">
          <span className="text-secondary-300">Status:</span>
          <p className={`font-medium ${
            convertedVideo ? 'text-green-400' : isProcessing ? 'text-yellow-400' : 'text-white'
          }`}>
            {convertedVideo ? 'Complete' : isProcessing ? 'Processing' : 'Ready'}
          </p>
        </div>
      </div>
    </div>
  )
}