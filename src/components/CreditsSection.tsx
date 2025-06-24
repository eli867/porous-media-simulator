'use client'

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  SiRailway, 
  SiTailwindcss, 
  SiVercel, 
  SiCplusplus, 
  SiNextdotjs, 
  SiReact, 
  SiFramer, 
  SiNodedotjs, 
  SiTypescript 
} from 'react-icons/si';

// Intersection Observer hook
function useInView(options: IntersectionObserverInit = {}): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // Only trigger once
        }
      },
      options
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [options]);

  return [ref, inView];
}

// Background icons with random positions and animations
const iconColor = '#e5e7eb'; // Tailwind's gray-200
const backgroundIcons = [
  { icon: <SiRailway size={48} color={iconColor} />, x: '10%', y: '15%', delay: 0 },
  { icon: <SiTailwindcss size={44} color={iconColor} />, x: '85%', y: '25%', delay: 0.2 },
  { icon: <SiVercel size={46} color={iconColor} />, x: '20%', y: '75%', delay: 0.4 },
  { icon: <SiCplusplus size={42} color={iconColor} />, x: '75%', y: '80%', delay: 0.6 },
  { icon: <SiNextdotjs size={50} color={iconColor} />, x: '5%', y: '50%', delay: 0.8 },
  { icon: <SiReact size={46} color={iconColor} />, x: '90%', y: '60%', delay: 1.0 },
  { icon: <SiFramer size={44} color={iconColor} />, x: '50%', y: '10%', delay: 1.2 },
  { icon: <SiRailway size={40} color={iconColor} />, x: '60%', y: '90%', delay: 1.4 },
  { icon: <SiTailwindcss size={48} color={iconColor} />, x: '15%', y: '85%', delay: 1.6 },
  { icon: <SiVercel size={42} color={iconColor} />, x: '80%', y: '40%', delay: 1.8 },
  { icon: <SiCplusplus size={46} color={iconColor} />, x: '40%', y: '25%', delay: 2.0 },
  { icon: <SiNextdotjs size={44} color={iconColor} />, x: '70%', y: '70%', delay: 2.2 },
  { icon: <SiReact size={40} color={iconColor} />, x: '25%', y: '35%', delay: 2.4 },
  { icon: <SiFramer size={48} color={iconColor} />, x: '95%', y: '15%', delay: 2.6 },
  { icon: <SiNodedotjs size={45} color={iconColor} />, x: '30%', y: '65%', delay: 2.8 },
  { icon: <SiTypescript size={43} color={iconColor} />, x: '70%', y: '30%', delay: 3.0 },
  { icon: <SiNodedotjs size={41} color={iconColor} />, x: '85%', y: '85%', delay: 3.2 },
  { icon: <SiTypescript size={47} color={iconColor} />, x: '45%', y: '75%', delay: 3.4 },
];

const CreditsSection = () => {
  const [sectionRef, inView] = useInView({ threshold: 0.1 });
  const mounted = inView;

  return (
    <div ref={sectionRef} className="relative flex flex-col items-center justify-center min-h-screen py-12 px-4 overflow-hidden w-screen h-screen">
      {/* Scattered background icons */}
      {backgroundIcons.map((bgIcon, index) => (
        <motion.div
          key={index}
          className="absolute pointer-events-none opacity-20"
          style={{ left: bgIcon.x, top: bgIcon.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={mounted ? { 
            opacity: [0.1, 0.3, 0.1], 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          } : { opacity: 0, scale: 0 }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            delay: bgIcon.delay,
            ease: "easeInOut"
          }}
        >
          {bgIcon.icon}
        </motion.div>
      ))}

      {/* 2x2 Grid of Transparent Cards */}
      <div className="relative z-10 flex flex-col gap-8 max-w-lg w-full">
        {/* Card 1 - Team Members */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="backdrop-blur-sm border rounded-2xl border-gray-500/50 relative overflow-hidden"
        >
          <div className="p-6 pb-14">
            <div className="space-x-4 flex flex-row gap-4">
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="text-xl font-bold text-white">Andre Adam</h4>
                  <p className="text-gray-300 text-xs">C++ Developer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="text-xl font-bold text-white">Eric Li</h4>
                  <p className="text-gray-300 text-xs">Node.js Developer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="text-xl font-bold text-white">Xianglin Li</h4>
                  <p className="text-gray-300 text-xs">Project Manager</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-4 px-6">
            <a href="https://github.com/adama-wzr/PixelBasedPermeability/tree/main" className="text-blue-400 hover:underline text-sm truncate" target="_blank" rel="noopener noreferrer">https://github.com/adama-wzr/PixelBasedPermeability/tree/main</a>
            <a href="https://github.com/eli867/porous-media-simulator" className="text-blue-400 hover:underline text-sm truncate" target="_blank" rel="noopener noreferrer">https://github.com/eli867/porous-media-simulator</a>
          </div>
        </motion.div>

        {/* Card 2 - Tech Stack */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-sm border rounded-2xl border-gray-500/50"
        >
          <div className="text-center p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <SiCplusplus size={24} className="text-[#00599C]" />
                <span className="text-white text-md font-semibold">C++</span>
              </div>
              <div className="flex items-center gap-3">
                <SiNodedotjs size={24} className="text-[#339933]" />
                <span className="text-white text-md font-semibold">Node.js</span>
              </div>
              <div className="flex items-center gap-3">
                <SiNextdotjs size={24} className="text-white" />
                <span className="text-white text-md font-semibold">Next.js</span>
              </div>
              <div className="flex items-center gap-3">
                <SiReact size={24} className="text-[#61DAFB]" />
                <span className="text-white text-md font-semibold">React</span>
              </div>
              <div className="flex items-center gap-3">
                <SiTypescript size={24} className="text-[#3178CC]" />
                <span className="text-white text-md font-semibold">TypeScript</span>
              </div>
              <div className="flex items-center gap-3">
                <SiTailwindcss size={24} className="text-[#06B6D4]" />
                <span className="text-white text-md font-semibold">Tailwind</span>
              </div>
              <div className="flex items-center gap-3">
                <SiFramer size={24} className="text-[#0055FF]" />
                <span className="text-white text-md font-semibold">Motion</span>
              </div>
              <div className="flex items-center gap-3">
                <SiVercel size={24} className="text-white" />
                <span className="text-white text-md font-semibold">Vercel</span>
              </div>
              <div className="flex items-center gap-3">
                <SiRailway size={24} className="text-white" />
                <span className="text-white text-md font-semibold">Railway</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreditsSection;