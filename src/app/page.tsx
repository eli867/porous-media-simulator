'use client'
import { LavaLamp } from "@/components/fluid-blob";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useCallback, useState } from "react";
import ComputerComponent from "@/components/ComputerComponent";
import { ChevronDown } from "lucide-react";
import CommandsSection from "@/components/CommandsSection";
import CreditsSection from "@/components/CreditsSection";

export default function DemoOne() {
  const progress = useMotionValue(0); // 0 = hidden, 1 = fully covered
  
  // Overlay appears first - very relaxed timing
  const y = useTransform(progress, [0, 0.8], ["100vh", "0vh"]);
  
  // Background color and opacity for seamless transition
  const bgColor = useTransform(progress, [0, 1], [
    "rgba(24,24,27,0)",
    "rgba(24,24,27,1)"
  ]);
  const bgOpacity = useTransform(progress, [0.1, 0.8, 1], [0, 0.2, 1]);
  const bgY = useTransform(progress, [0, 1], ["0vh", "0vh"]); // Keep background in place
  
  // Content takes its sweet time to slide up
  const contentY = useTransform(progress, [0.5, 1], ["0vh", "-80vh"]);
  const contentOpacity = useTransform(progress, [0.2, 0.7, 1], [1, 0.6, 0]);
  
  const [isCovered, setIsCovered] = useState(false);
  const [showNextSection, setShowNextSection] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const terminalSectionRef = useRef<HTMLDivElement | null>(null);
  const commandsSectionRef = useRef<HTMLDivElement | null>(null);
  const creditsSectionRef = useRef<HTMLDivElement | null>(null);

  // Handle wheel event to animate progress
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // If scrolling down and not covered, cover
    if (e.deltaY > 0 && !isCovered) {
      setIsCovered(true);
      animate(progress, 1, {
        duration: 3,
        ease: [0.23, 1, 0.32, 1], // Very smooth, relaxed easing
        onComplete: () => {
          setIsCovered(true);
        }
      });
    }
  }, [progress, isCovered]);

  // Handle scroll snap navigation
  const handleSectionScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!showNextSection) return;
    
    e.preventDefault();
    
    const sections = [heroSectionRef, terminalSectionRef, commandsSectionRef, creditsSectionRef];
    const maxSection = sections.length - 1;
    
    if (e.deltaY > 0 && currentSection < maxSection) {
      // Scroll down to next section
      const nextSection = currentSection + 1;
      setCurrentSection(nextSection);
      sections[nextSection]?.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else if (e.deltaY < 0 && currentSection > 0) {
      // Scroll up to previous section
      const prevSection = currentSection - 1;
      setCurrentSection(prevSection);
      sections[prevSection]?.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [showNextSection, currentSection]);

  // Helper to transition to next sections and settle terminal into its section
  const handleContinue = () => {
    setShowNextSection(true);
    setCurrentSection(2); // Start at commands section (index 2)
    setTimeout(() => {
      if (commandsSectionRef.current) {
        commandsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Always lock scroll during transitions
  const containerClass = `relative bg-white min-h-screen w-full overflow-hidden`;

  return (
    <div className={containerClass} onWheel={showNextSection ? handleSectionScroll : handleWheel} style={{ touchAction: 'none' }}>
      {/* Animated background that glides into place */}
      {!showNextSection && (
        <motion.div
          style={{ backgroundColor: bgColor, opacity: bgOpacity, y: bgY }}
          className="fixed inset-0 z-0 pointer-events-none"
        />
      )}
      
      {/* Main content that slides up and fades out */}
      {!showNextSection && (
        <motion.section 
          style={{ y: contentY, opacity: contentOpacity }}
          className="h-screen w-screen flex flex-col justify-center items-center relative z-10"
        >
          <LavaLamp/>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mix-blend-exclusion text-white whitespace-nowrap">
            Permeability Simulator
          </h1>
        </motion.section>
      )}

      {/* Terminal overlay during initial animation phase */}
      {!showNextSection && (
        <motion.div
          className="fixed inset-0 w-full h-full z-20"
        >
          <ComputerComponent
            y={y}
            isCovered={isCovered}
            onContinue={handleContinue}
          />
        </motion.div>
      )}

      {/* Sections with scroll snap - includes hero, terminal, commands, and credits */}
      {showNextSection && (
        <div className="snap-y snap-mandatory h-screen overflow-y-auto scroll-smooth">
          {/* Hero section */}
          <section
            ref={heroSectionRef}
            className="snap-start w-full h-screen flex flex-col justify-center items-center relative bg-white"
          >
            <LavaLamp/>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mix-blend-exclusion text-white whitespace-nowrap">
              Permeability Simulator
            </h1>
          </section>

          {/* Terminal section - settled and static */}
          <section
            ref={terminalSectionRef}
            className="snap-start w-full h-screen relative bg-zinc-900 flex items-center justify-center"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-4/5 h-4/5 rounded-3xl border-8 border-zinc-800 bg-black shadow-2xl flex flex-col font-mono overflow-hidden">
                <div className="w-full bg-zinc-900 border-b border-zinc-700 rounded-t-2xl px-4 py-2 flex items-center gap-2" style={{ minHeight: '2.5rem' }}>
                  <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full inline-block"></span>
                  <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
                  <span className="ml-4 text-zinc-400 text-xs">permeability-simulator@user:~</span>
                </div>
                <div className="flex-1 w-full bg-black rounded-b-2xl px-4 py-8 text-green-400 text-lg overflow-y-auto">
                  <div className="min-h-[1.5em]">&gt; Welcome to the Permeability Simulator!</div>
                  <div className="min-h-[1.5em]"></div>
                  <div className="min-h-[1.5em]">&gt; To begin, upload a PNG image of your porous medium.</div>
                  <div className="min-h-[1.5em]">&gt; The image should be black and white, where white is open space and black is solid.</div>
                  <div className="min-h-[1.5em]">&gt; There must be at least one clear channel of black from left to right.</div>
                  <div className="min-h-[1.5em]">&gt; Recommended size: at least 128x128 pixels.</div>
                  <div className="min-h-[1.5em]"></div>
                  <div className="min-h-[1.5em]">&gt; Select your PNG image:</div>
                  <div className="min-h-[1.5em]">&gt; [File upload interface would appear here]</div>
                  <div className="min-h-[1.5em]"></div>
                  <div className="min-h-[1.5em]">&gt; Now choose your simulation parameters:</div>
                  <div className="min-h-[1.5em]">&gt; - Fluid Density (kg/m³): The density of the fluid.</div>
                  <div className="min-h-[1.5em]">&gt; - Viscosity (Pa·s): The viscosity of the fluid.</div>
                  <div className="min-h-[1.5em]">&gt; - Domain Width (m): The width of the simulation domain.</div>
                  <div className="min-h-[1.5em]">&gt; - Mesh Amplification: Controls mesh refinement.</div>
                  <div className="min-h-[1.5em]">&gt; - Max Iterations: Maximum number of solver iterations.</div>
                  <div className="min-h-[1.5em]">&gt; - Convergence RMS: Residual threshold for convergence.</div>
                  <div className="min-h-[1.5em]">&gt; - CPU Cores: Number of CPU cores to use.</div>
                  <div className="min-h-[1.5em]"></div>
                  <div className="min-h-[1.5em]">&gt; [Parameter form would appear here]</div>
                  <div className="min-h-[1.5em]"></div>
                  <div className="min-h-[1.5em]">&gt; [Simulation results would appear here]</div>
                </div>
              </div>
            </div>
          </section>

          {/* Commands section */}
          <section
            ref={commandsSectionRef}
            className="snap-start w-full min-h-screen flex items-center justify-center bg-zinc-950 border-t-4 border-zinc-800"
          >
            <CommandsSection />
          </section>
          
          {/* Credits section */}
          <section 
            ref={creditsSectionRef}
            className="snap-start w-full min-h-screen flex items-center justify-center bg-zinc-900 border-t-4 border-zinc-800"
          >
            <CreditsSection />
          </section>
        </div>
      )}

      {showNextSection && currentSection !== 3 && (
        <div className="w-full flex justify-center items-end fixed bottom-0 left-0 z-50 pointer-events-none">
          <ChevronDown className="h-12 w-12 text-gray-400 dark:text-gray-600 animate-bounce" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
}