import Header from '@/components/Header'
import VideoConverter from '@/components/VideoConverter'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-6">
            Convert Videos for Social Media
          </h1>
          <p className="text-xl text-secondary-300 max-w-3xl mx-auto">
            Transform your horizontal videos into engaging vertical content optimized for TikTok, Instagram Reels, and Stories with smart cropping technology.
          </p>
        </div>
        
        <VideoConverter />
      </div>
      
      <Footer />
    </main>
  )
}