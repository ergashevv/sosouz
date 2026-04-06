'use client';

import { motion } from 'framer-motion';

const FIXED_PARTICLES = [
  { id: 1, x: '10%', y: '20%', opacity: 0.3, duration: 25, delay: 2 },
  { id: 2, x: '30%', y: '40%', opacity: 0.5, duration: 30, delay: 5 },
  { id: 3, x: '50%', y: '10%', opacity: 0.2, duration: 20, delay: 0 },
  { id: 4, x: '70%', y: '80%', opacity: 0.4, duration: 35, delay: 8 },
  { id: 5, x: '90%', y: '50%', opacity: 0.6, duration: 28, delay: 3 },
  { id: 6, x: '15%', y: '75%', opacity: 0.3, duration: 22, delay: 10 },
  { id: 7, x: '45%', y: '65%', opacity: 0.4, duration: 32, delay: 1 },
  { id: 8, x: '65%', y: '25%', opacity: 0.5, duration: 27, delay: 6 },
  { id: 9, x: '85%', y: '15%', opacity: 0.2, duration: 24, delay: 4 },
  { id: 10, x: '25%', y: '85%', opacity: 0.4, duration: 29, delay: 7 },
];

export default function ParticleLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {FIXED_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-[1px] h-[1px] bg-white rounded-full bg-primary/20"
          initial={{ 
            left: p.x, 
            top: p.y,
            opacity: 0
          }}
          animate={{ 
            top: [null, '-10%'],
            opacity: [0, p.opacity, 0]
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity,
            ease: "linear",
            delay: p.delay
          }}
        />
      ))}
    </div>
  );
}

