# Vertical Video Converter for Social Media

![App Preview](https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1200&h=300&fit=crop&auto=format)

A powerful web application that automatically converts horizontal videos into vertical format optimized for TikTok and Instagram. The app intelligently crops and repositions content to create engaging vertical videos while preserving the most important visual elements through smart framing algorithms.

## ✨ Features

- **Smart Auto-Cropping**: AI-powered detection of important content areas for optimal framing
- **Real-time Preview**: Side-by-side comparison of original and converted videos
- **Multiple Export Formats**: Optimized presets for TikTok (9:16), Instagram Reels, and Stories
- **Drag & Drop Interface**: Seamless file upload with progress tracking
- **Batch Processing**: Convert multiple videos simultaneously
- **Custom Positioning**: Manual adjustment tools for precise frame control
- **Cloud Processing**: Fast server-side video conversion
- **Download Management**: Organized file delivery system

<!-- CLONE_PROJECT_BUTTON -->

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> No content model prompt provided - app built from existing content structure

### Code Generation Prompt

> Build an application that converts horizontal videos into vertical videos for posting on tiktok and instagram

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## 🛠 Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Cosmic CMS** - Content management and file storage
- **FFmpeg** - Video processing engine
- **React Dropzone** - File upload interface
- **Framer Motion** - Smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Cosmic account and bucket

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```env
   COSMIC_BUCKET_SLUG=your-bucket-slug
   COSMIC_READ_KEY=your-read-key
   COSMIC_WRITE_KEY=your-write-key
   ```

4. Run the development server:
   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📚 Cosmic SDK Examples

### Upload Video File
```javascript
import { cosmic } from '@/lib/cosmic'

const uploadVideo = async (file) => {
  try {
    const media = await cosmic.media.insertOne({
      media: file,
      folder: 'videos'
    })
    return media
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}
```

### Store Conversion Job
```javascript
const createConversionJob = async (videoData) => {
  try {
    const job = await cosmic.objects.insertOne({
      type: 'conversion-jobs',
      title: `Conversion ${Date.now()}`,
      metadata: {
        input_video: videoData.id,
        status: 'pending',
        format: 'vertical',
        crop_settings: {
          position: 'center',
          smart_crop: true
        }
      }
    })
    return job
  } catch (error) {
    console.error('Job creation failed:', error)
    throw error
  }
}
```

## 🎨 Cosmic CMS Integration

This application uses Cosmic CMS for:

- **Video Storage**: Secure cloud storage for uploaded videos
- **Job Management**: Tracking conversion progress and status
- **User Settings**: Storing conversion preferences and presets
- **Processing Queue**: Managing batch conversion workflows

## 🚀 Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Netlify
1. Connect repository to Netlify
2. Configure build settings: `bun run build`
3. Set environment variables
4. Deploy

### Environment Variables
Set these in your deployment platform:
- `COSMIC_BUCKET_SLUG` - Your Cosmic bucket identifier
- `COSMIC_READ_KEY` - Read access key
- `COSMIC_WRITE_KEY` - Write access key for uploads
