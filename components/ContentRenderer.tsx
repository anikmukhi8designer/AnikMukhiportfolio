import React from 'react';
import { ContentBlock } from '../types';
import { getOptimizedSrc, getOptimizedSrcSet } from '../utils/imageOptimizer';

interface ContentRendererProps {
  blocks?: ContentBlock[];
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ blocks }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="w-full">
      {blocks.map((block) => {
        switch (block.type) {
          case 'h1':
            return (
              <div key={block.id} className="px-8 md:px-24 pt-16 pb-8 max-w-5xl">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                    {block.content}
                </h3>
              </div>
            );
          case 'h2':
            return (
              <div key={block.id} className="px-8 md:px-24 pt-12 pb-6 max-w-4xl">
                <h4 className="text-2xl font-bold text-foreground flex items-center gap-4">
                    <span className="w-8 h-px bg-primary"></span>
                    {block.content}
                </h4>
              </div>
            );
          case 'paragraph':
            return (
              <div key={block.id} className="px-8 md:px-24 pb-8 max-w-4xl">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    {block.content}
                </p>
              </div>
            );
          case 'quote':
            return (
              <div key={block.id} className="px-8 md:px-24 py-16 bg-secondary/30 my-12 border-y border-border">
                <blockquote className="text-3xl md:text-5xl font-bold text-foreground text-center tracking-tight leading-tight max-w-5xl mx-auto">
                    "{block.content}"
                </blockquote>
              </div>
            );
          case 'image':
            return (
              <figure key={block.id} className="w-full my-12 group">
                <div className="overflow-hidden">
                    <img 
                    src={getOptimizedSrc(block.content, 1400)}
                    srcSet={getOptimizedSrcSet(block.content)}
                    sizes="100vw"
                    loading="lazy"
                    alt={block.caption || 'Project image'} 
                    className="w-full h-auto object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 hover:scale-[1.01]"
                    />
                </div>
                {block.caption && (
                  <figcaption className="px-8 md:px-24 mt-4 text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-4">
                    <span className="h-px w-8 bg-border"></span>
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case 'code':
            return (
              <div key={block.id} className="px-8 md:px-24 my-12">
                <div className="bg-[#111] rounded-xl p-6 md:p-8 overflow-x-auto border border-neutral-800 shadow-2xl">
                    {block.caption && (
                    <div className="text-[10px] font-mono text-neutral-500 mb-4 pb-2 border-b border-neutral-800 flex justify-between">
                        <span>{block.caption}</span>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                        </div>
                    </div>
                    )}
                    <pre className="text-sm font-mono text-neutral-300 leading-relaxed">
                    <code>{block.content}</code>
                    </pre>
                </div>
              </div>
            );
          case 'divider':
            return <div key={block.id} className="px-8 md:px-24 my-16"><hr className="border-t border-border" /></div>;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default ContentRenderer;