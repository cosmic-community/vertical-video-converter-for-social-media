'use client'

import { useState, useEffect } from 'react'
import { ConversionJob, extractSelectValue } from '@/types'
import { getConversionJobs } from '@/lib/cosmic'
import { Download, RefreshCw, Eye, Trash2 } from 'lucide-react'

export default function JobsManager() {
  const [jobs, setJobs] = useState<ConversionJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const fetchedJobs = await getConversionJobs()
      setJobs(fetchedJobs)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setError('Failed to load conversion jobs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/10'
      case 'processing':
        return 'text-yellow-400 bg-yellow-500/10'
      case 'failed':
        return 'text-red-400 bg-red-500/10'
      case 'cancelled':
        return 'text-gray-400 bg-gray-500/10'
      default:
        return 'text-blue-400 bg-blue-500/10'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchJobs}
          className="btn-primary flex items-center mx-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Eye className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No conversion jobs yet</h3>
        <p className="text-secondary-300">
          Upload and convert your first video to see jobs here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-secondary-300">
          {jobs.length} conversion job{jobs.length !== 1 ? 's' : ''} found
        </p>
        <button
          onClick={fetchJobs}
          className="btn-secondary flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6">
        {jobs.map(job => {
          // Extract simple values from Cosmic select-dropdown format
          const jobStatus = extractSelectValue(job.metadata.status)
          const jobFormat = extractSelectValue(job.metadata.format)
          
          return (
            <div key={job.id} className="bg-secondary-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-secondary-300">
                    Created {formatDate(job.created_at)}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(jobStatus)}`}>
                  {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <span className="text-xs text-secondary-300">Input Video</span>
                  <p className="text-sm text-white truncate">
                    {job.metadata.input_video.name}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-secondary-300">Format</span>
                  <p className="text-sm text-white">
                    {jobFormat.charAt(0).toUpperCase() + jobFormat.slice(1).replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-secondary-300">Progress</span>
                  <p className="text-sm text-white">
                    {job.metadata.progress || 0}%
                  </p>
                </div>
              </div>

              {job.metadata.progress && job.metadata.progress > 0 && job.metadata.progress < 100 && (
                <div className="mb-4">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${job.metadata.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {job.metadata.error_message && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{job.metadata.error_message}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {job.metadata.output_video && (
                    <a
                      href={job.metadata.output_video.url}
                      download={job.metadata.output_video.name}
                      className="btn-primary flex items-center text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  )}
                  
                  <a
                    href={job.metadata.input_video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Original
                  </a>
                </div>

                {(jobStatus === 'failed' || jobStatus === 'cancelled') && (
                  <button className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}