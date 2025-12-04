// Explicitly define types for Vercel Serverless Functions
interface VercelRequest {
  query: Partial<{ [key: string]: string | string[] }>;
  cookies: Partial<{ [key: string]: string }>;
  body: any;
  method?: string;
  [key: string]: any;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  send(body: any): VercelResponse;
  json(jsonBody: any): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  [key: string]: any;
}

// Declare Node.js globals
declare const process: {
  env: { [key: string]: string | undefined };
};

declare const Buffer: {
  from: (str: string, encoding?: string) => any;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CRITICAL: Kill all caching layers
  // This tells Vercel Edge, the Browser, and any intermediate CDNs to NEVER store this response.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store'); // Specific to Vercel

  // 2. Retrieve Environment Variables
  const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const owner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER;
  const repo = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return res.status(500).json({ 
      error: 'Server Misconfiguration', 
      details: 'Missing GitHub Environment Variables (TOKEN, OWNER, or REPO). Check Vercel Project Settings.' 
    });
  }

  // 3. Determine the file path
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path[0] : (path || 'src/data.json');

  try {
    // 4. Fetch from GitHub API with Cache Busting
    // The 't' parameter forces GitHub's internal varnish cache to miss.
    const timestamp = Date.now(); 
    const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}?t=${timestamp}`;
    
    // Use global fetch
    const ghRes = await fetch(ghUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache' // Signal to node-fetch
      }
    });

    if (!ghRes.ok) {
        // Fallback: If src/data.json doesn't exist, try data.json (root)
        if (ghRes.status === 404 && targetPath === 'src/data.json') {
             // We return 404 so the client can try the fallback path logic
             return res.status(404).json({ error: 'File not found', path: targetPath });
        }
        return res.status(ghRes.status).json({ error: 'GitHub Fetch Failed', status: ghRes.status });
    }

    const data: any = await ghRes.json();
    
    // 5. Decode Content and Inject SHA
    // The SHA is critical for the frontend to know if data has changed (Versioning)
    if (data.content && data.encoding === 'base64') {
        const buffer = Buffer.from(data.content, 'base64');
        const jsonString = buffer.toString('utf-8');
        
        try {
            const json = JSON.parse(jsonString);
            
            // Inject SHA for version tracking
            if (typeof json === 'object' && json !== null) {
                json._sha = data.sha;
                json._served_at = timestamp; // Debugging helper
            }
            
            return res.status(200).json(json);
        } catch (parseError) {
            return res.status(500).json({ error: 'Invalid JSON in source file' });
        }
    }
    
    return res.status(200).json(data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}