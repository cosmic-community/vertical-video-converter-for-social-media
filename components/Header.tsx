import Link from 'next/link'
import { Video, Upload, List } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-secondary-800/50 backdrop-blur-sm border-b border-secondary-300">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Video className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold text-white">
              VideoConverter
            </span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-secondary-300 hover:text-white transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>Convert</span>
            </Link>
            
            <Link 
              href="/jobs" 
              className="flex items-center space-x-2 text-secondary-300 hover:text-white transition-colors"
            >
              <List className="w-5 h-5" />
              <span>Jobs</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}