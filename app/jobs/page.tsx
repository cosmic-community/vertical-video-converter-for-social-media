import Header from '@/components/Header'
import JobsManager from '@/components/JobsManager'
import Footer from '@/components/Footer'

export default function JobsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Conversion Jobs
          </h1>
          <p className="text-secondary-300">
            Track your video conversion progress and download completed files.
          </p>
        </div>
        
        <JobsManager />
      </div>
      
      <Footer />
    </main>
  )
}