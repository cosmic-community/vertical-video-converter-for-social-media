'use client'

import { ConversionControlsProps, ConversionFormat, CropPosition } from '@/types'
import { Play, Settings, Download, X } from 'lucide-react'

interface ExtendedConversionControlsProps extends ConversionControlsProps {
  onFormatChange: (format: ConversionFormat) => void;
  isProcessing: boolean;
}

export default function ConversionControls({ 
  job, 
  onSettingsChange, 
  onFormatChange,
  onStartConversion, 
  onCancel,
  isProcessing 
}: ExtendedConversionControlsProps) {
  const formats: { value: ConversionFormat; label: string; ratio: string }[] = [
    { value: 'tiktok', label: 'TikTok', ratio: '9:16' },
    { value: 'instagram-reel', label: 'Instagram Reel', ratio: '9:16' },
    { value: 'instagram-story', label: 'Instagram Story', ratio: '9:16' },
    { value: 'custom', label: 'Custom', ratio: '9:16' }
  ]

  const positions: { value: CropPosition; label: string }[] = [
    { value: 'center', label: 'Center' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'smart', label: 'Smart (AI)' }
  ]

  const canStart = job.metadata.status === 'pending' && !isProcessing
  const isComplete = job.metadata.status === 'completed'
  const currentProgress = job.metadata.progress || 0

  return (
    <div className="conversion-controls">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Conversion Settings
        </h3>
        
        {canStart && (
          <button
            onClick={onCancel}
            className="text-secondary-300 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-3">
          Output Format
        </label>
        <div className="grid grid-cols-1 gap-2">
          {formats.map(format => (
            <button
              key={format.value}
              onClick={() => onFormatChange(format.value)}
              disabled={isProcessing}
              className={`p-3 text-left rounded-lg border transition-colors ${
                job.metadata.format === format.value
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-secondary-300 bg-secondary-800 text-secondary-300 hover:text-white hover:border-primary-500'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{format.label}</span>
                <span className="text-xs bg-secondary-200 text-secondary-900 px-2 py-1 rounded">
                  {format.ratio}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Crop Position */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-3">
          Crop Position
        </label>
        <select
          value={job.metadata.crop_settings.position}
          onChange={(e) => onSettingsChange({ position: e.target.value as CropPosition })}
          disabled={isProcessing}
          className="w-full bg-secondary-800 border border-secondary-300 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
        >
          {positions.map(position => (
            <option key={position.value} value={position.value}>
              {position.label}
            </option>
          ))}
        </select>
      </div>

      {/* Smart Crop Toggle */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={job.metadata.crop_settings.smart_crop}
            onChange={(e) => onSettingsChange({ smart_crop: e.target.checked })}
            disabled={isProcessing}
            className="mr-3 w-4 h-4 text-primary-500 bg-secondary-800 border-secondary-300 rounded focus:ring-primary-500"
          />
          <span className="text-white">Enable Smart Cropping (AI)</span>
        </label>
        <p className="text-xs text-secondary-300 mt-1">
          Uses AI to detect important content areas for optimal framing
        </p>
      </div>

      {/* Progress Bar */}
      {(isProcessing || currentProgress > 0) && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white">Progress</span>
            <span className="text-primary-500">{currentProgress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {canStart && (
          <button
            onClick={onStartConversion}
            disabled={isProcessing}
            className="w-full btn-primary flex items-center justify-center"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Conversion
          </button>
        )}

        {isComplete && job.metadata.output_video && (
          <a
            href={job.metadata.output_video.url}
            download={job.metadata.output_video.name}
            className="w-full btn-primary flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Video
          </a>
        )}

        {isProcessing && (
          <div className="text-center text-secondary-300">
            <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Processing your video...
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="mt-6 pt-6 border-t border-secondary-300">
        <h4 className="text-sm font-medium text-white mb-3">File Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary-300">Input:</span>
            <span className="text-white truncate ml-2">
              {job.metadata.input_video.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-300">Status:</span>
            <span className={`font-medium ${
              job.metadata.status === 'completed' 
                ? 'text-green-400'
                : job.metadata.status === 'processing'
                ? 'text-yellow-400'
                : job.metadata.status === 'failed'
                ? 'text-red-400'
                : 'text-white'
            }`}>
              {job.metadata.status.charAt(0).toUpperCase() + job.metadata.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}