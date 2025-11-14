import { motion } from 'framer-motion';
export function EmptyStateIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex justify-center items-center"
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground/50"
      >
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="10 5"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M50 45C50 42.2386 52.2386 40 55 40C57.7614 40 60 42.2386 60 45V75C60 77.7614 57.7614 80 55 80C52.2386 80 50 77.7614 50 75V45Z"
          fill="currentColor"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />
        <motion.path
          d="M70 45C70 42.2386 72.2386 40 75 40C77.7614 40 80 42.2386 80 45V55C80 57.7614 77.7614 60 75 60C72.2386 60 70 57.7614 70 55V45Z"
          fill="currentColor"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        <motion.circle
          cx="75"
          cy="70"
          r="5"
          fill="currentColor"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
        />
      </svg>
    </motion.div>
  );
}