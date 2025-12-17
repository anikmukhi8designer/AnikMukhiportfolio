import React from 'react';
import { ContentBlock } from '../types';
import { getOptimizedSrc, getOptimizedSrcSet } from '../utils/imageOptimizer';

interface ContentRendererProps {
  blocks?: ContentBlock[];
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ blocks }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-6 max-w-none">
      {blocks.map((block) => {
        switch (block.type) {
          case 'h1':
            return (
              <h3 key={block.id} className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
                {block.content}
              </h3>
            );
          case 'h2':
            return (
              <h4 key={block.id} className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mt-6 mb-3">
                {block.content}
              </h4>
            );
          case 'paragraph':
            return (
              <p key={block.id} className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {block.content}
              </p>
            );
          case 'quote':
            return (
              <blockquote key={block.id} className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-6 py-2 my-8 italic text-xl text-neutral-700 dark:text-neutral-300">
                "{block.content}"
              </blockquote>
            );
          case 'image':
            return (
              <figure key={block.id} className="my-8">
                <img 
                  src={getOptimizedSrc(block.content, 1000)}
                  srcSet={getOptimizedSrcSet(block.content)}
                  sizes="(max-width: 768px) 100vw, 800px"
                  loading="lazy"
                  alt={block.caption || 'Project image'} 
                  className="w-full rounded-lg bg-neutral-100 dark:bg-neutral-800"
                />
                {block.caption && (
                  <figcaption className="text-center text-sm text-neutral-400 mt-2">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case 'code':
            return (
              <div key={block.id} className="bg-neutral-900 rounded-lg p-6 my-6 overflow-x-auto">
                {block.caption && (
                  <div className="text-xs font-mono text-neutral-400 mb-2 pb-2 border-b border-neutral-800">
                    {block.caption}
                  </div>
                )}
                <pre className="text-sm font-mono text-neutral-200">
                  <code>{block.content}</code>
                </pre>
              </div>
            );
          case 'divider':
            return <hr key={block.id} className="border-t border-neutral-200 dark:border-neutral-800 my-12" />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default ContentRenderer;