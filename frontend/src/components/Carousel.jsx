import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Building2, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const jobs = [
    {
      title: "Project Engineer Intern",
      company: "Goldman Sachs",
      location: "remote",
      image: "https://i0.wp.com/opportunitycell.com/wp-content/uploads/2019/10/goldman-sachs.jpg?resize=950%2C500&ssl=1",
      logo: "https://media.licdn.com/dms/image/v2/D4E0BAQG9L7InIQVZrQ/company-logo_200_200/company-logo_200_200/0/1722506756452/goldman_sachs_logo?e=2147483647&v=beta&t=85S4fEek5OdSBt9cJokj9jluSQG7p7OprDNr_ORa114",
      type: "Internship"
    },
    {
      title: "Software Developer",
      company: "apple",
      location: "Mumbai, India",
      image: "https://images.unsplash.com/photo-1536572701422-28e6051dd93f?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      logo: "https://images.unsplash.com/photo-1621768216002-5ac171876625?q=80&w=1474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "Full-time"
    },
    {
      title: "Software Engineering Intern",
      company: "Meta",
      location: "Remote",
      image: "https://images.cnbctv18.com/wp-content/uploads/2022/10/meta.jpg?impolicy=website&width=400&height=225",
      logo: "https://banner2.cleanpng.com/lnd/20240424/jf/transparent-meta-logo-logo-design-blue-logo-interlocking-ovals-logo-with-overlapping-ovals-letter-o66298832c312e9.71031057.webp",
      type: "internship"
    },
    {
      title: "Software Engineer",
      company: "Google LLC",
      location: "Mumbai, India",
      image: "https://akm-img-a-in.tosshub.com/businesstoday/images/story/202402/65d57d799cf7d-google-191005112-16x9.png",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png",
      type: "Full-time"
    }
  ]

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity
  }

  const paginate = useCallback((newDirection) => {
    let newIndex = currentIndex + newDirection
    if (newIndex < 0) newIndex = jobs.length - 1
    if (newIndex >= jobs.length) newIndex = 0
    setCurrentIndex(newIndex)
  }, [currentIndex, jobs.length])

  useEffect(() => {
    const intervalId = setInterval(() => {
      paginate(1)
    }, 5000)
    
    return () => clearInterval(intervalId)
  }, [paginate])

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white py-16"
    >
      <div id="jobs" className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center text-4xl font-bold text-gray-900 md:text-5xl"
        >
          Featured Opportunities
        </motion.h2>

        <div className="relative mx-auto h-[500px] max-w-5xl">
          <AnimatePresence initial={false} custom={currentIndex}>
            <motion.div
              key={currentIndex}
              custom={currentIndex}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x)
                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1)
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1)
                }
              }}
              className="absolute h-full w-full"
            >
              <div className="relative h-full overflow-hidden rounded-2xl bg-black shadow-xl">
                {/* Full-size background image */}
                <img
                  src={jobs[currentIndex].image}
                  alt={jobs[currentIndex].title}
                  className="absolute h-full w-full object-cover opacity-80"
                />
                
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                
                {/* Content */}
                <div className="absolute bottom-0 w-full p-8">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={jobs[currentIndex].logo}
                        alt={`${jobs[currentIndex].company} logo`}
                        className="h-16 w-16 rounded-lg border-2 border-white object-cover"
                      />
                    </div>
                    <div className="text-white">
                      <h3 className="text-2xl font-bold">{jobs[currentIndex].title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-5 w-5" />
                          <span>{jobs[currentIndex].company}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-5 w-5" />
                          <span>{jobs[currentIndex].location}</span>
                        </div>
                        <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-medium">
                          {jobs[currentIndex].type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <button
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-3 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
            onClick={() => paginate(-1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-3 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
            onClick={() => paginate(1)}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 space-x-2">
            {jobs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  currentIndex === index ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex justify-center"
        >
          <Link to="/job-page">
      <button
        className="inline-block px-8 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition duration-300 shadow-md hover:shadow-lg"
      >
        Explore All Opportunities
      </button>
    </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Carousel