# Developer Specification: Portfolio "Work" Section

## 1. Functional Specification
The "Work / Experience" section is the core of the portfolio, designed to showcase the designer's capabilities through a clean, gallery-style interface. Users can browse a grid of selected projects. Hovering over a project card provides immediate visual feedback (scale, opacity change) to encourage interaction. Clicking a project opens a full-screen or large modal (Case Study View) without navigating away from the landing page, ensuring a seamless single-page application (SPA) feel. The Experience section follows as a structured list, detailing professional history in a scannable format.

**New**: The "Clients" section has been added to provide social proof, utilizing a minimalist border-grid layout to showcase brands worked with.

## 2. Component Breakdown

### `WorkSection` (Container)
- **Purpose**: Holds the grid of project cards and section headers.
- **Props**: `projects: Project[]`, `onProjectClick: (id) => void`.
- **Behavior**: Responsive grid (1 col mobile, 2 col desktop).

### `ClientsSection`
- **Purpose**: Displays a grid of client logos/names.
- **Layout**: 4-column (Desktop), 3-column (Tablet), 2-column (Mobile).
- **Style**: Monochromatic typography, hover-to-darken interaction.
- **Data Source**: `CLIENTS` array in `data.ts`.

### `ProjectCard`
- **Purpose**: Individual entry for a project.
- **Props**: `title`, `category`, `image`, `year`, `tags`.
- **Interactions**: 
  - **Hover**: Image scales up (1.05x), overlaid meta-data becomes clearer or an icon appears.
  - **Click**: Triggers the Modal.

### `Modal` / `CaseStudy`
- **Purpose**: Detailed view of a project.
- **Props**: `isOpen`, `projectData`, `onClose`.
- **Behavior**: 
  - Backdrop blur.
  - Scroll lock on body.
  - Sections for Hero Image, Description, Role, Tech Stack, and Gallery.
  - "Visit Site" CTA.

### `ExperienceSection`
- **Purpose**: Chronological list of work history.
- **Props**: `jobs: Experience[]`.
- **Layout**: Two-column layout on desktop (Left: Company/Date, Right: Role/Description).

## 3. CMS / JSON Data Schema

**Project Object:**
```json
{
  "id": "string (unique-slug)",
  "title": "string",
  "client": "string",
  "roles": ["string"],
  "description": "string (short summary)",
  "year": 2024,
  "heroImage": "url",
  "thumb": "url",
  "tags": ["string"],
  "link": "url (optional external link)",
  "images": ["url"] (array of detailed shots)
}
```

**Client Object:**
```json
{
  "id": "string",
  "name": "string",
  "logo": "url (optional)",
  "url": "url (optional)"
}
```

## 4. Responsive & Interaction Specs

- **Desktop (1024px+)**: 
  - Grid: 2 columns, large gutter (32px+).
  - Hover: Smooth scale (0.4s ease-out).
- **Tablet (768px)**:
  - Grid: 1 or 2 columns depending on density.
  - Margins: 24px.
- **Mobile (<768px)**:
  - Grid: 1 column stack.
  - Hover effects: Disabled or simplified (active state).
  - Touch targets: Minimum 44px.
- **Accessibility**:
  - Semantic HTML (`<section>`, `<article>`, `<h1>`-`<h3>`).
  - Keyboard navigation: Tabindex on cards. Enter key opens modal. Escape key closes modal.
  - Images: `alt` text required for all content images.

## 5. Assets & Optimization

- **Images**: 
  - Thumbnails: 800x600px (WebP/JPG), ~80KB.
  - Hero Images: 1920x1080px, ~200KB.
  - Use `loading="lazy"` on all images below the fold.
- **Icons**: SVG (Lucide React recommended).
