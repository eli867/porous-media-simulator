'use client'

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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

const CreditsSection = () => {
  const [sectionRef, inView] = useInView({ threshold: 0.1 });
  const mounted = inView;

  return (
    <div ref={sectionRef} className="relative flex flex-col items-center justify-center min-h-screen py-12 px-4 overflow-hidden w-screen h-screen">
      {/* 2x2 Grid of Transparent Cards */}
      <div className="relative z-10 flex flex-col gap-8 max-w-lg w-full">
        {/* Card 1 - Team Members */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="backdrop-blur-sm border rounded-2xl">
          <div className="p-6">
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
        </motion.div>

        {/* Card 2 - Tech Stack */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-sm border rounded-2xl"
        >
          <div className="text-center p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-white text-md font-semibold">C++</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-md font-semibold">Node.js</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-md font-semibold">Next.js</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-md font-semibold">React</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-md font-semibold">TypeScript</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-md font-semibold">Tailwind</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-md font-semibold">Motion</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-md font-semibold">Vercel</span>
              </div>
              <div className="flex items-center gap-3">
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