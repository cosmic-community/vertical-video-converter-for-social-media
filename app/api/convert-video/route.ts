import { NextRequest, NextResponse } from 'next/server'
import { updateConversionJob } from '@/lib/cosmic'

export async function POST(request: NextRequest) {
  try {
    const { jobId, inputVideo, cropSettings, format } = await request.json()

    if (!jobId || !inputVideo || !cropSettings || !format) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Update job status to processing
    await updateConversionJob(jobId, {
      status: 'processing',
      progress: 0,
      processing_started_at: new Date().toISOString()
    })

    // Simulate video processing (replace with actual FFmpeg processing)
    setTimeout(async () => {
      try {
        // Simulate processing progress
        const progressUpdates = [25, 50, 75, 100]
        
        for (const progress of progressUpdates) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
          
          if (progress === 100) {
            // Simulate completion
            await updateConversionJob(jobId, {
              status: 'completed',
              progress: 100,
              processing_completed_at: new Date().toISOString(),
              output_video: {
                id: `output_${jobId}`,
                url: inputVideo.url, // In real implementation, this would be the processed video
                imgix_url: inputVideo.imgix_url,
                name: `vertical_${inputVideo.name}`
              }
            })
          } else {
            await updateConversionJob(jobId, {
              progress: progress
            })
          }
        }
      } catch (error) {
        console.error('Processing error:', error)
        await updateConversionJob(jobId, {
          status: 'failed',
          error_message: 'Processing failed'
        })
      }
    }, 1000)

    return NextResponse.json({
      success: true,
      message: 'Conversion started successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}