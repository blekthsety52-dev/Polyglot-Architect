
import React from 'react';
import { 
  Terminal, 
  Globe, 
  Settings, 
  Layout, 
  Package, 
  Cpu,
  Network,
  Blocks,
  Wallet
} from 'lucide-react';
import { AppType, ProjectLanguage } from './types';

export const LANGUAGES: ProjectLanguage[] = [
  'Polyglot',
  'Solidity', 'Vyper', 'Rust', 'Go', 'Python',
  'TypeScript', 'JavaScript', 'Java', 'C++', 'C#', 
  'Swift', 'Kotlin', 'Scala', 'Ruby', 'Nim', 'D'
];

export const APP_TYPES: { type: AppType; icon: React.ReactNode; description: string }[] = [
  { 
    type: 'Smart Contract', 
    icon: <Blocks className="w-5 h-5" />, 
    description: 'Decentralized logic on blockchain networks.' 
  },
  { 
    type: 'DeFi Protocol', 
    icon: <Wallet className="w-5 h-5" />, 
    description: 'Financial primitives and autonomous money markets.' 
  },
  { 
    type: 'Microservices', 
    icon: <Network className="w-5 h-5" />, 
    description: 'Distributed systems with independent services.' 
  },
  { 
    type: 'Web Service', 
    icon: <Globe className="w-5 h-5" />, 
    description: 'High-performance backends and APIs.' 
  },
  { 
    type: 'CLI Tool', 
    icon: <Terminal className="w-5 h-5" />, 
    description: 'Command-line interfaces and developer tools.' 
  },
  { 
    type: 'Library/Framework', 
    icon: <Package className="w-5 h-5" />, 
    description: 'Reusable code modules for other developers.' 
  },
  { 
    type: 'GUI App', 
    icon: <Layout className="w-5 h-5" />, 
    description: 'Native desktop applications with graphical interfaces.' 
  },
  { 
    type: 'System Utility', 
    icon: <Settings className="w-5 h-5" />, 
    description: 'Low-level tools interacting with OS internals.' 
  },
  { 
    type: 'Embedded/IoT', 
    icon: <Cpu className="w-5 h-5" />, 
    description: 'Software for resource-constrained hardware.' 
  },
];
