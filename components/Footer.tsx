import { Video } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-secondary-800/30 border-t border-secondary-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Video className="w-6 h-6 text-primary-500" />
              <span className="text-lg font-bold text-white">VideoConverter</span>
            </div>
            <p className="text-secondary-300">
              Professional video format conversion for social media platforms.
              Transform your content with AI-powered smart cropping.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-secondary-300">
              <li>Smart Auto-Cropping</li>
              <li>Batch Processing</li>
              <li>Multiple Formats</li>
              <li>High Quality Output</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Supported Platforms</h3>
            <ul className="space-y-2 text-secondary-300">
              <li>TikTok (9:16)</li>
              <li>Instagram Reels</li>
              <li>Instagram Stories</li>
              <li>Custom Formats</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-secondary-300 mt-8 pt-8 text-center">
          <p className="text-secondary-300">
            © 2024 VideoConverter. Powered by Cosmic CMS.
          </p>
        </div>
      </div>
    </footer>
  )
}