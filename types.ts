
export type ProjectLanguage = 
  | 'Polyglot'
  | 'Solidity'
  | 'Vyper'
  | 'C++' 
  | 'Rust' 
  | 'Swift' 
  | 'Go' 
  | 'Python' 
  | 'Java' 
  | 'TypeScript' 
  | 'JavaScript'
  | 'Kotlin' 
  | 'C#' 
  | 'Scala' 
  | 'Ruby'
  | 'Nim' 
  | 'D';

export type AppType = 
  | 'Smart Contract'
  | 'DeFi Protocol'
  | 'Microservices'
  | 'Web Service' 
  | 'CLI Tool' 
  | 'System Utility' 
  | 'GUI App' 
  | 'Library/Framework' 
  | 'Embedded/IoT';

export interface CodeSnippet {
  title: string;
  language: string;
  code: string;
  description: string;
}

export interface ProjectSpec {
  name: string;
  language: ProjectLanguage;
  type: AppType;
  description: string;
  keyFeatures: string[];
  performanceRequirements: string;
  testingStrategy: string;
  deploymentPlan: string;
  recommendedLibraries: string[];
  architectureOverview: string;
  folderStructure: string;
  codeSnippets: CodeSnippet[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
