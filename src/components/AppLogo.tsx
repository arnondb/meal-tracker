import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface AppLogoProps {
  className?: string;
}
export function AppLogo({ className }: AppLogoProps) {
  return (
    <motion.svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "backOut" }}
    >
      {/* Pizza Slice */}
      <motion.path
        d="M12 2 L4 20 C4 22, 8 22, 12 22 C16 22, 20 22, 20 20 L12 2 Z"
        fill="currentColor"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      {/* Toppings */}
      <motion.circle
        cx="12" cy="9" r="1.5" fill="hsl(var(--destructive))"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      />
      <motion.circle
        cx="9" cy="14" r="1.5" fill="hsl(var(--destructive))"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9, type: 'spring' }}
      />
      <motion.circle
        cx="15" cy="14" r="1.5" fill="hsl(var(--destructive))"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.0, type: 'spring' }}
      />
      {/* Antenna */}
      <motion.path
        d="M12 2C14.5 4.5 14.5 7.5 12 10"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.5, x: -5 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1.2, type: 'spring', stiffness: 300 }}
      />
      <motion.path
        d="M12 2C9.5 4.5 9.5 7.5 12 10"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.5, x: 5 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1.2, type: 'spring', stiffness: 300 }}
      />
    </motion.svg>
  );
}