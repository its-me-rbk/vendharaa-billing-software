import React from 'react'
import { motion } from 'framer-motion'

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.18, ease: [0.55, 0, 0.55, 0.2] } }
}

const FadeInUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={fadeInUp}
    transition={{ delay }}
    className={className}
    style={{ willChange: 'opacity, transform' }}
  >
    {children}
  </motion.div>
)

export default FadeInUp
