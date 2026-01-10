'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Target, Clock, Brain, Sparkles, ChevronRight, Zap, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">LearnBook</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary px-4 py-2">
              Login
            </Link>
            <Link href="/signup" className="btn-primary flex items-center gap-2 px-4 py-2">
              Sign Up <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted">AI-Powered Learning Control</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Learn Smarter, <br />
              <span className="gradient-text">Not Harder</span>
            </h1>

            <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
              An AI learning companion that decides what to learn and when.
              Personalized roadmaps, smart timetables, and curated resources —
              all optimized for your goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
                Start Your Journey <Zap className="w-5 h-5" />
              </Link>
              <button className="btn-secondary text-lg px-8 py-4">
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="gradient-border p-1 rounded-2xl glow">
              <div className="bg-card-bg rounded-2xl p-8 aspect-video flex items-center justify-center">
                <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
                  {/* Preview Cards */}
                  <div className="card float-animation" style={{ animationDelay: '0s' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">Roadmap</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-secondary rounded-full w-full" />
                      <div className="h-2 bg-secondary rounded-full w-3/4" />
                      <div className="h-2 bg-secondary rounded-full w-1/2" />
                    </div>
                  </div>

                  <div className="card float-animation" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-accent" />
                      </div>
                      <span className="font-medium">Timetable</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="h-2 bg-secondary rounded-full flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <div className="h-2 bg-secondary rounded-full flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <div className="h-2 bg-secondary rounded-full flex-1" />
                      </div>
                    </div>
                  </div>

                  <div className="card float-animation" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-success" />
                      </div>
                      <span className="font-medium">Progress</span>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      <div className="w-4 bg-primary/50 rounded-t" style={{ height: '40%' }} />
                      <div className="w-4 bg-primary/50 rounded-t" style={{ height: '60%' }} />
                      <div className="w-4 bg-primary/50 rounded-t" style={{ height: '45%' }} />
                      <div className="w-4 bg-primary rounded-t" style={{ height: '80%' }} />
                      <div className="w-4 bg-primary rounded-t" style={{ height: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              LearnBook is your AI learning control layer. It doesn't create content —
              it decides the optimal learning actions for your unique situation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-border p-1 rounded-3xl"
          >
            <div className="bg-card-bg rounded-3xl p-12 text-center">
              <Brain className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
                Tell us about your goals, and our AI will create a personalized
                learning roadmap optimized just for you.
              </p>
              <Link href="/onboarding" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                Get Your Personal Roadmap <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-card-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-semibold">LearnBook</span>
          </div>
          <p className="text-muted text-sm">
            Powered by AI • Built for Learners
          </p>
        </div>
      </footer>
    </main>
  )
}

const features = [
  {
    icon: Target,
    title: 'Smart Roadmaps',
    description: 'AI-optimized learning paths based on your goals, time, and exam dates.',
    color: 'bg-gradient-to-br from-primary to-purple-600'
  },
  {
    icon: Clock,
    title: 'Dynamic Timetables',
    description: 'Daily schedules that adapt when you skip tasks or need more time.',
    color: 'bg-gradient-to-br from-accent to-blue-500'
  },
  {
    icon: BookOpen,
    title: 'Chapter Intelligence',
    description: 'Understand why each topic matters and what breaks if you skip it.',
    color: 'bg-gradient-to-br from-success to-emerald-500'
  },
  {
    icon: Brain,
    title: 'NotebookLM Ready',
    description: 'Export curated sources and prompts for deep study sessions.',
    color: 'bg-gradient-to-br from-accent-pink to-rose-500'
  }
]
