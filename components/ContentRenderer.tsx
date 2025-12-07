
import React from 'react';
import { ContentBlock } from '../types';

interface ContentRendererProps {
  blocks?: ContentBlock[];
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ blocks }) => {
  if (!blocks || blocks.length === 0) return null;

  const renderContent = (content: string) => {
    // Check if content contains list items (bullet points)
    if (content.includes('•') || content.includes('- ')) {
        const items = content.split(/\n|•/).filter(item => item.trim().length > 0 && item.trim() !== '-');
        return (
            <ul className="list-disc pl-5 space-y-2 mt-4 text-lg text-neutral-600 dark:text-neutral-400 marker:text-neutral-300">
                {items.map((item, i) => (
                    <li key={i} className="pl-2">{item.replace(/^-\s*/, '').trim()}</li>
                ))}
            </ul>
        );
    }
    return <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">{content}</p>;
  };

  return (
    <div className="flex flex-col gap-12 max-w-none">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h1':
            return (
              <h3 key={block.id} className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mt-12 mb-4 tracking-tight">
                {block.content}
              </h3>
            );
          case 'h2':
            return (
              <div key={block.id} className="mt-16 first:mt-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2 block">
                      Section {String(index + 1).padStart(2, '0')}
                  </span>
                  <h4 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-6">
                    {block.content}
                  </h4>
                  <div className="w-12 h-1 bg-neutral-900 dark:bg-white mb-8"></div>
              </div>
            );
          case 'paragraph':
            return (
              <div key={block.id}>
                {renderContent(block.content)}
              </div>
            );
          case 'quote':
            return (
              <blockquote key={block.id} className="border-l-4 border-neutral-900 dark:border-white pl-8 py-4 my-12 italic text-2xl md:text-3xl font-medium text-neutral-900 dark:text-white leading-tight">
                "{block.content}"
              </blockquote>
            );
          case 'image':
            return (
              <figure key={block.id} className="my-12 w-full">
                <img 
                  src={block.content} 
                  alt={block.caption || 'Project image'} 
                  className="w-full h-auto rounded-xl shadow-sm bg-neutral-100 dark:bg-neutral-900"
                />
                {block.caption && (
                  <figcaption className="text-center text-sm font-mono text-neutral-400 mt-4 uppercase tracking-widest">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case 'code':
            return (
              <div key={block.id} className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-6 md:p-8 my-8 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
                {block.caption && (
                  <div className="text-xs font-bold text-neutral-400 mb-4 uppercase tracking-widest">
                    {block.caption}
                  </div>
                )}
                <pre className="text-sm font-mono text-neutral-800 dark:text-neutral-300">
                  <code>{block.content}</code>
                </pre>
              </div>
            );
          case 'divider':
            return <div key={block.id} className="w-full h-px bg-neutral-200 dark:bg-neutral-800 my-16"></div>;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default ContentRenderer;
