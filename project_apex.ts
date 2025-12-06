import { Project } from './types';

export const PROJECT_APEX: Project = {
    id: "apex-logistics-2023",
    title: "Apex Logistics",
    client: "Apex Global",
    roles: ["Product Design", "UX Research"],
    description: "Real-time logistics tracking platform for global supply chains.",
    year: 2023,
    heroImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    tags: ["SaaS", "B2B", "Logistics"],
    link: "#",
    published: true,
    content: [
      { id: '1', type: 'h2', content: 'Overview' },
      { id: '2', type: 'paragraph', content: 'Apex Global manages thousands of shipments daily. Their existing tools were fragmented, leading to operational inefficiencies. We built a unified dashboard to centralize tracking.' },
      { id: '3', type: 'h2', content: 'Key Features' },
      { id: '4', type: 'paragraph', content: '• Real-time map visualization of assets\n• Automated delay risk alerts\n• One-click document generation' },
      { id: '5', type: 'image', content: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop', caption: 'Shipment Detail View' }
    ]
};