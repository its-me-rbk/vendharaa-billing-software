import React from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 24, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.48, ease: [0.33, 1, 0.68, 1] } },
  exit: { opacity: 0, y: -16, scale: 0.985, transition: { duration: 0.28, ease: [0.55, 0, 0.55, 0.2] } }
}

const PageTransition = ({ children, className = '' }) => {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className={`page-transition ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
