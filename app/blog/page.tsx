"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { PageBackground } from "@/components/ui/page-background"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Clock } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  date: string
  excerpt: string
  content: string
  image: string
}

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/admin/blog')
        if (response.ok) {
          const data = await response.json()
          setBlogPosts(data)
        }
      } catch (error) {
        console.error('Failed to fetch blog posts')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPosts()
  }, [])

  if (isLoading) {
    return (
      <PageBackground>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </PageBackground>
    )
  }

  return (
    <PageBackground>
      <div className="w-full max-w-3xl mx-auto py-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Insights <span className="text-primary">&</span> Updates.</h1>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">
            Latest news and guides from Akubrecah • 2026 Edition
          </p>
        </div>

        <AnimatePresence mode="wait">
          {selectedPost ? (
            <motion.div
              key="post"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Feed
              </button>

              <div className="glass rounded-2xl overflow-hidden border border-white/5">
                <div className="relative h-64 w-full">
                  <Image
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    fill
                    className="object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">{selectedPost.title}</h2>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-2 text-[8px] text-primary font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {selectedPost.date}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium leading-relaxed opacity-80">
                    {selectedPost.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-4"
            >
              {blogPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPost(post)}
                  className="glass rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group overflow-hidden flex flex-col md:flex-row h-auto md:h-48"
                >
                  {/* Landscape Image Section */}
                  <div className="relative w-full md:w-2/5 h-40 md:h-full overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent hidden md:block" />
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-6 flex flex-col justify-center space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-[8px] text-primary font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {post.date}
                      </div>
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium line-clamp-2 opacity-60 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="pt-2">
                      <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary/60 group-hover:text-primary transition-colors">
                        READ ARTICLE →
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageBackground>
  )
}