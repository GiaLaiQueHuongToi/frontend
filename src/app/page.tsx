import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Video, Zap, Layers, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">AI Short Video Creator</h1>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Create Trending Short Videos with <span className="text-purple-600">AI</span>
            </h1>
            <p className="text-xl text-gray-600">
              Transform your ideas into engaging short videos for TikTok, YouTube Shorts, and more using our AI-powered
              platform. No editing skills required.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="h-20 w-20 text-white opacity-80" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 text-center">
                Create videos in minutes with AI
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI-Generated Scripts</h3>
                <p className="text-gray-600">
                  Get trending topic suggestions and automatically generate engaging scripts for your videos.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Text-to-Speech</h3>
                <p className="text-gray-600">
                  Convert your script to natural-sounding voice with our advanced TTS technology.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Layers className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Automatic Video Creation</h3>
                <p className="text-gray-600">
                  Combine voice, images, and captions into a professional-looking short video.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Target Users */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Who It's For</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Content Creators</h3>
                <p className="text-gray-600">Quickly create educational, informative, or entertaining short videos.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Students</h3>
                <p className="text-gray-600">Create visual presentations and media projects for academic purposes.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Multimedia Enthusiasts</h3>
                <p className="text-gray-600">Experiment with modern AI technologies for creative expression.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-purple-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Create Your First Video?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already using AI to streamline their content creation process.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-bold">AI Short Video Creator</h2>
            </div>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-purple-400">
                About
              </Link>
              <Link href="#" className="hover:text-purple-400">
                Features
              </Link>
              <Link href="#" className="hover:text-purple-400">
                Pricing
              </Link>
              <Link href="#" className="hover:text-purple-400">
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} AI Short Video Creator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
