import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ExternalLink, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Layers, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Award,
  BookOpen,
  Globe
} from 'lucide-react';
import type { SupportedLanguage } from '../../lib/i18n';
import { getTranslation } from '../../lib/i18n';

interface DlicomRolesHubProps {
  themeMode: 'dark' | 'light';
  onThemeToggle: () => void;
  onBackToSettings?: () => void;
  lang?: SupportedLanguage;
}

type RoleId = 'dliever' | 'dcoded' | 'dco' | 'golden';

interface RoleThreadData {
  id: RoleId;
  number: string;
  subtitle: string;
  title: string;
  tag: string;
  tagColor: string;
  imageSrc: string;
  shortDesc: string;
  threadSteps: Array<{
    stepNumber: string;
    stepTitle: string;
    stepContent: string;
    keyPoints: string[];
  }>;
}

const ROLES_DATA: RoleThreadData[] = [
  {
    id: 'dliever',
    number: '01',
    subtitle: 'The first signal',
    title: 'Dliever',
    tag: 'ENTRY',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    imageSrc: '/roles/dliever.jpg',
    shortDesc: 'Step in, explore the network, and start leaving a thoughtful trail behind you.',
    threadSteps: [
      {
        stepNumber: '1.0',
        stepTitle: 'Entering the Ecosystem and Setting Up Your Profile',
        stepContent: 'The Dliever role is the foundation of the Dlicom and Aether networks. It represents your initial signal as an active explorer ready to contribute authentic value without spam.',
        keyPoints: [
          'Create and complete your profile with avatar, banner, display name, and bio.',
          'Verify your account credentials and establish your public identity.',
          'Connect with active network participants and follow core channels.'
        ]
      },
      {
        stepNumber: '1.1',
        stepTitle: 'Leaving Your First Meaningful Trails',
        stepContent: 'Dliever members start participating in discussions, sharing original thoughts, upvoting valuable contributions, and engaging in constructive comment threads.',
        keyPoints: [
          'Publish consistent, original posts and technical/ecosystem insights.',
          'Engage thoughtfully in discussion comments rather than one-word replies.',
          'Support fellow creators with upvotes and thoughtful feedback.'
        ]
      },
      {
        stepNumber: '1.2',
        stepTitle: 'Transition Path to Dcoded',
        stepContent: 'Once your activity proves consistent quality over consecutive weeks, your signal index climbs, preparing you for the Dcoded evaluation.',
        keyPoints: [
          'Maintain an active positive voting ratio across multiple weeks.',
          'Avoid repetitive or automated interactions.',
          'Prepare your portfolio of posts for peer evaluation.'
        ]
      }
    ]
  },
  {
    id: 'dcoded',
    number: '02',
    subtitle: 'The trusted voice',
    title: 'Dcoded',
    tag: 'CONSISTENT',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    imageSrc: '/roles/dcoded.jpg',
    shortDesc: 'Show up with intent. Consistent, high-quality work turns your signal into reputation.',
    threadSteps: [
      {
        stepNumber: '2.0',
        stepTitle: 'Establishing Recognized Expertise',
        stepContent: 'The Dcoded role identifies trusted community members who consistently contribute valuable technical, creative, or organizational work across the network.',
        keyPoints: [
          'Demonstrate sustained contribution history with high peer engagement.',
          'Author in-depth guides, original analysis, and high-reputation posts.',
          'Help onboard new Dlievers and moderate discussion quality.'
        ]
      },
      {
        stepNumber: '2.1',
        stepTitle: 'Community Signal and Evaluation',
        stepContent: 'Dcoded status requires peer recognition and community validation. Your contributions are indexed based on organic reach and net upvotes.',
        keyPoints: [
          'Top 10% leaderboard standing or verified community endorsement.',
          'Constructive participation in direct collaboration threads.',
          'Adherence to strict quality guidelines with zero spam history.'
        ]
      },
      {
        stepNumber: '2.2',
        stepTitle: 'Transition Path to DCO',
        stepContent: 'Dcoded members who take leadership initiatives, organize community sprints, or build tools become candidates for the inner circle DCO role.',
        keyPoints: [
          'Lead community discussions and coordinate collaborative initiatives.',
          'Build tools, write documentation, or create platform integrations.',
          'Prepare for consensus invitation into the core council.'
        ]
      }
    ]
  },
  {
    id: 'dco',
    number: '03',
    subtitle: 'The inner orbit',
    title: 'DCO',
    tag: 'CORE',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    imageSrc: '/roles/dco.jpg',
    shortDesc: 'Shape culture, lead collaborations, and help the community decide what comes next.',
    threadSteps: [
      {
        stepNumber: '3.0',
        stepTitle: 'Core Stewardship and Governance',
        stepContent: 'DCO represents the inner orbit of leaders, core contributors, and platform stewards shaping the future roadmap, ecosystem culture, and strategic initiatives.',
        keyPoints: [
          'Direct involvement in governance proposals and ecosystem direction.',
          'Coordination of major community campaigns and feature feedback.',
          'Exclusive access to developer and council working groups.'
        ]
      },
      {
        stepNumber: '3.1',
        stepTitle: 'Unlocking Golden Checkmark & VIP Lounge',
        stepContent: 'DCO members are automatically eligible for the prestigious Golden Checkmark distinction and full access to the encrypted Aether Chat lounge.',
        keyPoints: [
          'Permanent Golden Checkmark verification applied to profile and posts.',
          'Full real-time broadcast messaging access in Aether Chat.',
          'Priority visibility on global leaderboards and public feeds.'
        ]
      },
      {
        stepNumber: '3.2',
        stepTitle: 'Maintaining High-Standard Council Status',
        stepContent: 'As a DCO steward, maintaining active leadership and mentoring emerging contributors ensures the continuous health and vibrancy of the network.',
        keyPoints: [
          'Review and mentor emerging Dcoded and Dliever contributors.',
          'Represent the community in external integrations and partnerships.',
          'Uphold the highest standard of discourse and integrity across all platforms.'
        ]
      }
    ]
  }
];

export const DlicomRolesHub: React.FC<DlicomRolesHubProps> = ({
  themeMode,
  onThemeToggle,
  onBackToSettings,
  lang,
}) => {
  const [activeThreadRole, setActiveThreadRole] = useState<RoleThreadData | null>(null);
  const [activeTabNav, setActiveTabNav] = useState<'roles' | 'how' | 'card' | 'links'>('roles');

  return (
    <div className="w-full bg-[#0B132B] text-white min-h-screen pb-16">
      
      {/* Top Dlicom Header Navigation Bar (Matches Screenshot 1) */}
      <header className="w-full border-b border-[#334155]/60 bg-[#0B132B]/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          {onBackToSettings && (
            <button
              onClick={onBackToSettings}
              className="p-1.5 rounded-xl border border-[#334155] bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Back to Settings Hub"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 font-black tracking-widest text-base sm:text-lg">
            <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-xs font-mono font-bold tracking-normal">
              DLICOM
            </span>
            <span className="text-white hidden sm:inline">ROLES & PATH</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button 
            onClick={() => {
              setActiveThreadRole(null);
              setActiveTabNav('roles');
            }}
            className={`transition-colors cursor-pointer ${activeTabNav === 'roles' ? 'text-white font-bold' : 'hover:text-white'}`}
          >
            Roles
          </button>
          <button 
            onClick={() => {
              setActiveThreadRole(ROLES_DATA[0]);
              setActiveTabNav('how');
            }}
            className={`transition-colors cursor-pointer ${activeTabNav === 'how' ? 'text-white font-bold' : 'hover:text-white'}`}
          >
            How it works
          </button>
          <button 
            onClick={() => {
              setActiveThreadRole(ROLES_DATA[1]);
              setActiveTabNav('card');
            }}
            className={`transition-colors cursor-pointer ${activeTabNav === 'card' ? 'text-white font-bold' : 'hover:text-white'}`}
          >
            Make a card
          </button>
          <button 
            onClick={() => {
              setActiveThreadRole(ROLES_DATA[2]);
              setActiveTabNav('links');
            }}
            className={`transition-colors cursor-pointer ${activeTabNav === 'links' ? 'text-white font-bold' : 'hover:text-white'}`}
          >
            Official links
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl border border-[#334155] bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>

          <a
            href="https://dlicom.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <span>Get the app</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* VIEW A: 3 Roles Cards Overview (Exact Match to Screenshot 1) */}
        {!activeThreadRole ? (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Headline Banner */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Three roles. One path.
              </h1>
              <p className="text-sm text-slate-400 font-mono">
                ...you bring to the network.
              </p>
            </div>

            {/* Gradient Line Progress Indicator */}
            <div className="w-full max-w-xl mx-auto h-1.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-purple-500 opacity-80" />

            {/* 3 Cards Grid (Matches Screenshot 1 Pixel Style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {ROLES_DATA.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setActiveThreadRole(role)}
                  className="bg-[#141E33] border border-[#334155] hover:border-blue-500/60 rounded-3xl p-5 shadow-2xl transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col group"
                >
                  {/* Top Bar on Card: Number & Subtitle */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-4 pb-2 border-b border-[#334155]/40">
                    <span className="w-6 h-6 rounded-full bg-[#1E293B] border border-slate-700 flex items-center justify-center font-bold text-white text-[10px]">
                      {role.number}
                    </span>
                    <span className="tracking-wide uppercase">{role.subtitle}</span>
                  </div>

                  {/* Character Pixel Mascot Card */}
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[#0B132B] border border-[#334155]/80 relative mb-4 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                    <img
                      src={role.imageSrc}
                      alt={role.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-mono text-slate-300 uppercase tracking-wider">
                      DLICOM ROLE / {role.number}
                    </div>
                  </div>

                  {/* Title & Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
                      {role.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${role.tagColor}`}>
                      {role.tag}
                    </span>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-400 leading-relaxed flex-1 mb-5">
                    {role.shortDesc}
                  </p>

                  {/* Open Thread Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveThreadRole(role);
                    }}
                    className="w-full py-2.5 px-4 bg-[#1C2541] group-hover:bg-blue-600 text-slate-200 group-hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#334155] group-hover:border-blue-500 cursor-pointer"
                  >
                    <span>Open Guide Thread</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Footer Badge (Matches GOOD STUFF! in Screenshot 1) */}
            <div className="pt-8 flex justify-start">
              <span className="px-3 py-1 bg-lime-400 text-slate-950 font-black text-[11px] font-mono rounded-lg tracking-wider uppercase shadow-sm">
                GOOD STUFF!
              </span>
            </div>

          </div>
        ) : (
          
          /* VIEW B: In-Depth Thread-Like Guide for Selected Role */
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            
            {/* Back Button to Cards Overview */}
            <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
              <button
                onClick={() => setActiveThreadRole(null)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back to 3 Roles Overview</span>
              </button>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${activeThreadRole.tagColor}`}>
                ROLE {activeThreadRole.number} &bull; {activeThreadRole.tag}
              </span>
            </div>

            {/* Thread Header Card */}
            <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl flex flex-col sm:flex-row items-center gap-6 shadow-xl">
              <img
                src={activeThreadRole.imageSrc}
                alt={activeThreadRole.title}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-blue-500/40 shadow-glow-sm shrink-0"
              />
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {activeThreadRole.title}
                  </h2>
                  <span className="text-xs font-mono text-slate-400">
                    ({activeThreadRole.subtitle})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeThreadRole.shortDesc}
                </p>
              </div>
            </div>

            {/* Thread Step-by-Step Sections */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Verification & Progression Thread</span>
              </h3>

              {activeThreadRole.threadSteps.map((step, idx) => (
                <div 
                  key={idx}
                  className="p-5 bg-[#141E33] border border-[#334155] rounded-2xl space-y-3 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono font-bold text-xs">
                      Step {step.stepNumber}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {step.stepTitle}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {step.stepContent}
                  </p>

                  {/* Checklist Points */}
                  <div className="space-y-2 pt-2 border-t border-[#334155]/40">
                    {step.keyPoints.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-[#1C2541] border border-[#334155] rounded-2xl flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400 font-mono">
                Ready to contribute and build your reputation on Aether?
              </p>
              <button
                onClick={() => {
                  if (onBackToSettings) onBackToSettings();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all cursor-pointer shrink-0"
              >
                Return to Workspace
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
