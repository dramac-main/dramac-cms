/**
 * 3D Effects Demo Page
 * 
 * Interactive demo to test all Phase 31 effects.
 * Access at: /demo/effects
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

"use client";

import React from "react";
import { 
  CardFlip3D, 
  ScrollAnimate, 
  ScrollStagger, 
  GlassCard, 
  ParticleBackground, 
  TiltCard 
} from "@/components/studio/effects";

export default function EffectsDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero with Particles */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <ParticleBackground 
          particleCount={80} 
          color="#a855f7" 
          connected={true}
          speed={0.5}
        />
        
        <div className="relative z-10 text-center">
          <ScrollAnimate animation="fade-up" duration={800}>
            <h1 className="text-6xl font-bold text-white mb-4">
              DRAMAC Studio Effects
            </h1>
          </ScrollAnimate>
          
          <ScrollAnimate animation="fade-up" delay={200} duration={800}>
            <p className="text-xl text-purple-200 mb-8">
              Phase 31: 3D Effects & Advanced Animations
            </p>
          </ScrollAnimate>
          
          <ScrollAnimate animation="zoom-in" delay={400} duration={600}>
            <div className="animate-bounce text-purple-300">
              ↓ Scroll to explore ↓
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* Tilt Cards Section */}
      <section className="py-20 px-8">
        <ScrollAnimate animation="fade-up">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            3D Tilt Cards
          </h2>
        </ScrollAnimate>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <ScrollAnimate animation="fade-up" delay={0}>
            <TiltCard maxRotation={15} glare={true}>
              <div className="p-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl h-64 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">✨</div>
                  <h3 className="text-xl font-bold">Tilt + Glare</h3>
                  <p className="text-sm opacity-80 mt-2">Hover over me!</p>
                </div>
              </div>
            </TiltCard>
          </ScrollAnimate>
          
          <ScrollAnimate animation="fade-up" delay={100}>
            <TiltCard maxRotation={20} scale={1.1}>
              <div className="p-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl h-64 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">🚀</div>
                  <h3 className="text-xl font-bold">High Rotation</h3>
                  <p className="text-sm opacity-80 mt-2">20° max tilt</p>
                </div>
              </div>
            </TiltCard>
          </ScrollAnimate>
          
          <ScrollAnimate animation="fade-up" delay={200}>
            <TiltCard maxRotation={10} perspective={500}>
              <div className="p-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl h-64 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="text-xl font-bold">Deep Perspective</h3>
                  <p className="text-sm opacity-80 mt-2">500px depth</p>
                </div>
              </div>
            </TiltCard>
          </ScrollAnimate>
        </div>
      </section>

      {/* Card Flip Section */}
      <section className="py-20 px-8 bg-black/30">
        <ScrollAnimate animation="fade-up">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            3D Card Flip
          </h2>
        </ScrollAnimate>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 justify-items-center">
          <ScrollAnimate animation="flip-up">
            <div>
              <p className="text-purple-300 text-center mb-4">Hover to flip:</p>
              <CardFlip3D
                flipOn="hover"
                width={280}
                height={360}
                front={
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">🃏</div>
                      <h3 className="text-xl font-bold">Front Side</h3>
                    </div>
                  </div>
                }
                back={
                  <div className="w-full h-full bg-gradient-to-br from-pink-600 to-pink-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">✨</div>
                      <h3 className="text-xl font-bold">Back Side!</h3>
                    </div>
                  </div>
                }
              />
            </div>
          </ScrollAnimate>
          
          <ScrollAnimate animation="flip-up" delay={200}>
            <div>
              <p className="text-purple-300 text-center mb-4">Click to flip:</p>
              <CardFlip3D
                flipOn="click"
                width={280}
                height={360}
                front={
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">👆</div>
                      <h3 className="text-xl font-bold">Click Me!</h3>
                    </div>
                  </div>
                }
                back={
                  <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-xl font-bold">You did it!</h3>
                    </div>
                  </div>
                }
              />
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* Glassmorphism Section */}
      <section className="py-20 px-8 relative overflow-hidden">
        {/* Colorful background for glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-50" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-60" />
        
        <div className="relative z-10">
          <ScrollAnimate animation="fade-up">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              Glassmorphism Effects
            </h2>
          </ScrollAnimate>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollAnimate animation="zoom-in" delay={0}>
              <GlassCard preset="light" padding="lg" rounded="xl">
                <h3 className="text-xl font-bold text-white mb-2">Light Glass</h3>
                <p className="text-white/80">Subtle frosted effect with light tint</p>
              </GlassCard>
            </ScrollAnimate>
            
            <ScrollAnimate animation="zoom-in" delay={100}>
              <GlassCard preset="colored" padding="lg" rounded="xl">
                <h3 className="text-xl font-bold text-white mb-2">Colored Glass</h3>
                <p className="text-white/80">Indigo tinted glass effect</p>
              </GlassCard>
            </ScrollAnimate>
            
            <ScrollAnimate animation="zoom-in" delay={200}>
              <GlassCard preset="heavy" padding="lg" rounded="xl">
                <h3 className="text-xl font-bold text-white mb-2">Heavy Blur</h3>
                <p className="text-white/80">Maximum blur intensity</p>
              </GlassCard>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* Scroll Animations Section */}
      <section className="py-20 px-8 bg-black/50">
        <ScrollAnimate animation="fade-up">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Scroll Animations
          </h2>
        </ScrollAnimate>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <ScrollAnimate animation="fade-left">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl text-white">
              <h3 className="text-xl font-bold">Fade Left →</h3>
              <p className="opacity-80">This slides in from the right</p>
            </div>
          </ScrollAnimate>
          
          <ScrollAnimate animation="fade-right">
            <div className="p-6 bg-gradient-to-r from-pink-600 to-pink-800 rounded-xl text-white">
              <h3 className="text-xl font-bold">← Fade Right</h3>
              <p className="opacity-80">This slides in from the left</p>
            </div>
          </ScrollAnimate>
          
          <ScrollAnimate animation="bounce-in">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl text-white">
              <h3 className="text-xl font-bold">🎾 Bounce In</h3>
              <p className="opacity-80">This bounces into view</p>
            </div>
          </ScrollAnimate>
          
          <ScrollAnimate animation="rotate-in">
            <div className="p-6 bg-gradient-to-r from-green-600 to-green-800 rounded-xl text-white">
              <h3 className="text-xl font-bold">🔄 Rotate In</h3>
              <p className="opacity-80">This rotates into view</p>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* Tailwind Animations */}
      <section className="py-20 px-8">
        <ScrollAnimate animation="fade-up">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Tailwind Animations
          </h2>
        </ScrollAnimate>
        
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="animate-float w-20 h-20 mx-auto bg-purple-500 rounded-xl flex items-center justify-center text-2xl">
              🎈
            </div>
            <p className="text-white mt-4">Float</p>
          </div>
          
          <div className="text-center">
            <div className="animate-swing w-20 h-20 mx-auto bg-pink-500 rounded-xl flex items-center justify-center text-2xl origin-top">
              🎐
            </div>
            <p className="text-white mt-4">Swing</p>
          </div>
          
          <div className="text-center">
            <div className="animate-heartbeat w-20 h-20 mx-auto bg-red-500 rounded-xl flex items-center justify-center text-2xl">
              ❤️
            </div>
            <p className="text-white mt-4">Heartbeat</p>
          </div>
          
          <div className="text-center">
            <div className="animate-wiggle w-20 h-20 mx-auto bg-orange-500 rounded-xl flex items-center justify-center text-2xl">
              🐱
            </div>
            <p className="text-white mt-4">Wiggle</p>
          </div>
          
          <div className="text-center">
            <div className="animate-jello w-20 h-20 mx-auto bg-yellow-500 rounded-xl flex items-center justify-center text-2xl">
              🍮
            </div>
            <p className="text-white mt-4">Jello</p>
          </div>
          
          <div className="text-center">
            <div className="animate-rubberBand w-20 h-20 mx-auto bg-green-500 rounded-xl flex items-center justify-center text-2xl">
              🎸
            </div>
            <p className="text-white mt-4">Rubber Band</p>
          </div>
          
          <div className="text-center">
            <div className="animate-tada w-20 h-20 mx-auto bg-blue-500 rounded-xl flex items-center justify-center text-2xl">
              🎉
            </div>
            <p className="text-white mt-4">Tada</p>
          </div>
          
          <div className="text-center">
            <div className="animate-glowPulse w-20 h-20 mx-auto bg-purple-700 rounded-xl flex items-center justify-center text-2xl">
              💎
            </div>
            <p className="text-white mt-4">Glow Pulse</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-20 px-8 text-center">
        <ScrollAnimate animation="fade-up">
          <GlassCard preset="light" padding="lg" rounded="xl" className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              🎉 Phase 31 Complete!
            </h2>
            <p className="text-white/80">
              DRAMAC Studio now has award-winning 3D effects and animations.
              All 31 phases of DRAMAC Studio are complete!
            </p>
          </GlassCard>
        </ScrollAnimate>
      </section>
    </div>
  );
}
