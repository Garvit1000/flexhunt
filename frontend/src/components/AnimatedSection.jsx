import React, { useEffect, useRef } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { Star, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
const AnimatedSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [isInView, controls])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  }

  const imageVariants = {
    hidden: { 
      opacity: 0,
      x: 50,
      scale: 1.1,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.25, 0.4, 0.3, 1.0],
      },
    },
  }

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-100 to-white"
    >
      <div id='freelance' className="absolute inset-0 bg-gradient-to-br from-gray-200/50 to-white/50 backdrop-blur-sm" />
      
      {/* Hero Section */}
      <div className="container relative z-10 mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Column - Text Content */}
          <motion.div variants={containerVariants} className="space-y-8">
            <motion.div variants={itemVariants} className="space-y-2">
              <h4 className="text-lg font-medium text-indigo-600">
               Freelance jobs
              </h4>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Find the best freelance jobs
              </h1>
              <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">
              The premium freelance solutions for you !!
              </h2>
            </motion.div>

            <motion.p variants={itemVariants} className="text-lg text-gray-600 sm:text-xl">
            Work with the largest network of independent professionals and get things done—from quick turnarounds to big transformations.
            When freelancing on FlexHunt, your clients and work are in one place. You can find new jobs, message clients, submit work, and get paid all within the platform.
            </motion.p>

            <motion.div variants={itemVariants}>
              <Link to="/gigs" >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center rounded-full bg-indigo-600 px-8 py-3 text-white transition-all hover:bg-indigo-700 hover:shadow-lg"
              >
                Browse Freelance Jobs
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column - Image */}
          <motion.div
            variants={imageVariants}
            className="relative h-[600px] overflow-hidden rounded-2xl"
          >
            <motion.img
              src="https://st3.depositphotos.com/11422582/14047/i/450/depositphotos_140479018-stock-photo-female-working-on-laptop-at.jpg"
              alt="Data Center"
              className="h-full w-full object-cover"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.25, 0.4, 0.3, 1.0] }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
          </motion.div>
        </div>
      </div>

      {/* Animated background elements */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl sm:h-64 sm:w-64"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl sm:h-96 sm:w-96"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </motion.section>
  )
}

export default AnimatedSection