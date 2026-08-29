/**
 * DeveloperCard.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Developer acknowledgement component presenting Fayas (Mohammad Fayas Khan).
 *
 * Features:
 *   - Profile Photo from authentic asset (src/MyPic.jpeg).
 *   - Verified clickable links to LinkedIn, Instagram, and GitHub.
 *   - Focus chips (AI/ML, DSA, Web Dev, IoT, CSE @ LPU).
 *   - Centered layout with clean responsive wrapping and zero accidental text cutting.
 */

import React from 'react';
import myPic from '../../MyPic.jpeg';
import { motion } from 'framer-motion';
import { Github, Linkedin, Instagram, Code2, Sparkles, ExternalLink, Heart, Terminal } from 'lucide-react';

interface DeveloperCardProps {
  className?: string;
  isCompact?: boolean;
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ className = '', isCompact = false }) => {
  const socialLinks = [
    {
      name: 'LinkedIn',
      handle: 'mohammadfayaskhan',
      url: 'https://www.linkedin.com/in/mohammadfayaskhan',
      icon: Linkedin,
      color: 'hover:text-blue-600 hover:border-blue-300 bg-blue-50/70'
    },
    {
      name: 'Instagram',
      handle: '@fayaskhanx',
      url: 'https://www.instagram.com/fayaskhanx',
      icon: Instagram,
      color: 'hover:text-pink-600 hover:border-pink-300 bg-pink-50/70'
    },
    {
      name: 'GitHub',
      handle: '@MohammadFayasKhan',
      url: 'https://github.com/MohammadFayasKhan',
      icon: Github,
      color: 'hover:text-slate-900 hover:border-slate-400 bg-slate-50'
    }
  ];

  const genzTags = [
    { label: 'AI / ML', icon: '🤖' },
    { label: 'DSA', icon: '⚡' },
    { label: 'Web Dev', icon: '🌐' },
    { label: 'IoT', icon: '📡' },
    { label: 'CSE @ LPU', icon: '🎓' }
  ];

  if (isCompact) {
    return (
      <div className={`w-full max-w-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/90 border border-blue-200/80 shadow-apple-sm backdrop-blur-md font-sans ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0 max-w-full">
          <img
            src={myPic}
            alt="Mohammad Fayas Khan"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-blue-300 shadow-apple-xs shrink-0"
          />
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href="https://www.linkedin.com/in/mohammadfayaskhan/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-apple-text font-mono hover:text-apple-blue transition-colors focus-visible:ring-2 focus-visible:ring-apple-blue rounded"
              >
                Mohammad Fayas Khan
              </a>
              <span className="text-[8px] bg-blue-100 text-apple-blue font-bold px-1.5 py-0.2 rounded-full uppercase">
                Creator
              </span>
            </div>
            <p className="text-[10px] text-apple-secondary font-mono">
              Aspiring AI/ML Engineer • CSE @ LPU
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {socialLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl border border-black/5 bg-slate-50 text-apple-secondary hover:text-apple-blue hover:bg-blue-50 transition-all shadow-apple-xs focus-visible:ring-2 focus-visible:ring-apple-blue"
                title={`${link.name}: ${link.handle}`}
                aria-label={`Open ${link.name} profile`}
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`w-full max-w-xl mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50/90 via-white to-slate-50 border border-blue-200/80 p-4 sm:p-6 shadow-apple-md font-sans text-left relative overflow-hidden self-center ${className}`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Badge */}
      <div className="flex flex-wrap items-center justify-between border-b border-black/5 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-apple-blue font-bold shadow-apple-xs shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5 flex-wrap">
              <span>Developer Acknowledgement</span>
              <span className="text-[8px] sm:text-[9px] bg-blue-100 text-apple-blue font-bold px-1.5 py-0.2 rounded-full uppercase">
                Creator
              </span>
            </h3>
            <p className="text-[9px] sm:text-[10px] text-apple-secondary font-mono">
              Designed & Built with Attention to Detail
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-apple-blue bg-white border border-blue-200 px-2 py-0.5 rounded-full shadow-apple-xs font-semibold">
          <Sparkles className="w-3 h-3" />
          <span>Vaswani et al. 2017</span>
        </div>
      </div>

      {/* Developer Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-3">
        {/* Profile Picture */}
        <div className="relative group shrink-0">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-blue-300 shadow-apple-md bg-slate-100 relative">
            <img
              src={myPic}
              alt="Mohammad Fayas Khan"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-apple-xs" title="Active Developer">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
          </div>
        </div>

        {/* Bio & Headline */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
            <a
              href="https://www.linkedin.com/in/mohammadfayaskhan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base sm:text-lg font-bold text-apple-text font-mono hover:text-apple-blue transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-apple-blue rounded"
            >
              <span>Mohammad Fayas Khan</span>
              <ExternalLink className="w-3.5 h-3.5 text-apple-blue" />
            </a>
          </div>
          <p className="text-[11px] sm:text-xs text-apple-blue font-mono font-semibold flex items-center justify-center sm:justify-start gap-1">
            <Terminal className="w-3 h-3" />
            <span>Aspiring AI/ML Engineer | CSE @ LPU</span>
          </p>
          <p className="text-[11px] sm:text-xs text-apple-secondary leading-relaxed font-sans pt-0.5">
            Passionate about <strong>AI/ML</strong>, <strong>DSA</strong>, <strong>Web Dev</strong> & <strong>IoT</strong>. Built this interactive research companion to make the Transformer architecture and mathematical foundations tangible.
          </p>
        </div>
      </div>

      {/* Gen-Z Tech & Focus Chips */}
      <div className="flex items-center gap-1.5 flex-wrap my-3 py-1.5 px-2.5 rounded-xl bg-blue-50/50 border border-blue-100 font-mono text-[10px] sm:text-[11px]">
        <span className="text-[9px] sm:text-[10px] font-bold text-apple-blue uppercase tracking-wider mr-0.5">Focus:</span>
        {genzTags.map((tag) => (
          <span
            key={tag.label}
            className="px-2 py-0.5 rounded-full bg-white border border-blue-200/70 text-apple-text font-semibold shadow-apple-xs flex items-center gap-1"
          >
            <span>{tag.icon}</span>
            <span>{tag.label}</span>
          </span>
        ))}
      </div>

      {/* Social Links Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-black/5">
        {socialLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 sm:p-3 rounded-2xl border border-black/10 transition-all flex items-center justify-between group shadow-apple-xs focus-visible:ring-2 focus-visible:ring-apple-blue ${link.color}`}
              aria-label={`Visit ${link.name} profile (${link.handle})`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="w-4 h-4 text-apple-text group-hover:scale-110 transition-transform shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-apple-text font-mono truncate">{link.name}</div>
                  <div className="text-[10px] text-apple-secondary font-mono truncate">{link.handle}</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-apple-tertiary group-hover:text-apple-blue group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </a>
          );
        })}
      </div>

      {/* Bottom Footer Note */}
      <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-apple-tertiary flex-wrap gap-1">
        <span className="flex items-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>by Mohammad Fayas Khan</span>
        </span>
        <span className="text-apple-secondary font-semibold">2026 Production Release</span>
      </div>
    </motion.div>
  );
};

export default DeveloperCard;
