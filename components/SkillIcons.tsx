import React from 'react';
import { 
  Code, PenTool, Layout, Terminal, Globe, 
  Cpu, Box, Hexagon, GitBranch, Wrench, Circle, Layers,
  Zap, Command
} from 'lucide-react';

export const SKILL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  // Design Tools
  "Figma": ({ className }) => (
    <svg viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M19 28.5C19 25.9804 20.0009 23.5641 21.7825 21.7825C23.5641 20.0009 25.9804 19 28.5 19C31.0196 19 33.4359 20.0009 35.2175 21.7825C36.9991 23.5641 38 25.9804 38 28.5C38 31.0196 36.9991 33.4359 35.2175 35.2175C33.4359 36.9991 31.0196 38 28.5 38L19 38V28.5Z" fill="#1ABCFE"/>
      <path d="M0 47.5C0 44.9804 1.00089 42.5641 2.78249 40.7825C4.56408 39.0009 6.98044 38 9.5 38L19 38V57C16.4804 57 14.0641 55.9991 12.2825 54.2175C10.5009 52.4359 9.5 50.0196 9.5 47.5L0 47.5Z" fill="#0ACF83"/>
      <path d="M19 0V9.5L9.5 9.5C6.98044 9.5 4.56408 10.5009 2.78249 12.2825C1.00089 14.0641 0 16.4804 0 19C0 21.5196 1.00089 23.9359 2.78249 25.7175C4.56408 27.4991 6.98044 28.5 9.5 28.5L19 28.5V19V0Z" fill="#F24E1E"/>
      <path d="M0 28.5L9.5 28.5L19 28.5V38H9.5C6.98044 38 4.56408 37.0001 2.78249 35.2185C1.00089 33.4369 0 31.0206 0 28.5Z" fill="#A259FF"/>
      <path d="M19 0L28.5 0C31.0196 0 33.4359 1.00089 35.2175 2.78249C36.9991 4.56408 38 6.98044 38 9.5C38 12.0196 36.9991 14.4359 35.2175 16.2175C33.4359 18.0001 31.0196 19 28.5 19L19 19V0Z" fill="#FF7262"/>
    </svg>
  ),
  "Adobe": ({ className }) => <span className={`font-bold text-[#FF0000] flex items-center justify-center border-2 border-[#FF0000] rounded ${className}`}>A</span>,
  "Sketch": ({ className }) => <Hexagon className={`${className} text-yellow-500`} />,
  "Framer": ({ className }) => <Layout className={`${className} text-black`} />,
  "Webflow": ({ className }) => <Layers className={`${className} text-blue-500`} />,
  "Spline": ({ className }) => <Box className={`${className} text-pink-500`} />,
  "Arc": ({ className }) => <Globe className={`${className} text-red-400`} />,
  "Linear": ({ className }) => <Zap className={`${className} text-purple-600`} />,
  "Raycast": ({ className }) => <Command className={`${className} text-red-500`} />,
  "Notion": ({ className }) => <span className={`font-serif font-bold text-black text-xl ${className}`}>N</span>,
  
  // Development
  "React": ({ className }) => <Cpu className={`${className} text-blue-500`} />,
  "TypeScript": ({ className }) => <span className={`font-bold text-blue-600 border border-blue-600 rounded px-1 flex items-center ${className}`}>TS</span>,
  "Tailwind": ({ className }) => <span className={`font-bold text-cyan-500 ${className}`}>~</span>,
  "Next.js": ({ className }) => <span className={`font-bold text-black ${className}`}>N</span>,
  "Git": ({ className }) => <GitBranch className={`${className} text-orange-600`} />,
  "VS Code": ({ className }) => <Code className={`${className} text-blue-500`} />,
  "Node.js": ({ className }) => <Hexagon className={`${className} text-green-600`} />,
  "Python": ({ className }) => <Terminal className={`${className} text-yellow-600`} />,
  "Vite": ({ className }) => <Zap className={`${className} text-yellow-400`} />,
  
  // General/Fallback
  "Design": PenTool,
  "Code": Code,
  "Tools": Wrench,
  "Default": Circle
};

export const ICON_KEYS = Object.keys(SKILL_ICONS);

export const SkillIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => {
  // Try to find icon by exact name match, otherwise Default
  const IconComponent = SKILL_ICONS[icon] || SKILL_ICONS["Default"];
  return <IconComponent className={className} />;
};

export default SkillIcon;