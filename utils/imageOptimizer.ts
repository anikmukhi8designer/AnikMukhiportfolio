
export const getOptimizedSrc = (src: string, width: number) => {
    if (!src) return '';
    if (src.includes('images.unsplash.com')) {
        const baseUrl = src.split('?')[0];
        return `${baseUrl}?w=${width}&q=80&auto=format&fit=crop`;
    }
    return src;
};

export const getOptimizedSrcSet = (src: string) => {
    if (!src) return undefined;
    if (src.includes('images.unsplash.com')) {
        const baseUrl = src.split('?')[0];
        return `
            ${baseUrl}?w=400&q=80&auto=format&fit=crop 400w,
            ${baseUrl}?w=800&q=80&auto=format&fit=crop 800w,
            ${baseUrl}?w=1200&q=80&auto=format&fit=crop 1200w,
            ${baseUrl}?w=1600&q=80&auto=format&fit=crop 1600w,
            ${baseUrl}?w=2000&q=80&auto=format&fit=crop 2000w
        `;
    }
    return undefined;
};
