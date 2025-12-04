// Explicitly define types to avoid dependency on @vercel/node and @types/node
// which might be missing in the build environment.

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

// Declare Node.js globals that are missing from the "DOM" lib configuration
declare const process: {
  env: { [key: string]: string | undefined };
};

declare const Buffer: {
  from: (str: string, encoding?: string) => any;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Set aggressive headers to prevent Vercel and Browser caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // 2. Retrieve Environment Variables (Support both VITE_ prefixed and standard names)
  const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const owner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER;
  const repo = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return res.status(500).json({ 
      error: 'Server Misconfiguration', 
      details: 'Missing GitHub Environment Variables (TOKEN, OWNER, or REPO). Check Vercel Project Settings.' 
    });
  }

  // 3. Determine the file path (default to src/data.json)
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path[0] : (path || 'src/data.json');

  try {
    // 4. Fetch from GitHub API (Always fresh)
    const timestamp = Date.now();
    const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}?t=${timestamp}`;
    
    // Use global fetch (available in Node 18+)
    const ghRes = await fetch(ghUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!ghRes.ok) {
        // If file not found, try generic data.json if requested src/data.json failed
        if (ghRes.status === 404 && targetPath === 'src/data.json') {
             // Let the client handle the fallback logic or retry here. 
             // Returning 404 allows client to try the next path.
             return res.status(404).json({ error: 'File not found' });
        }
        return res.status(ghRes.status).json({ error: 'GitHub Fetch Failed', status: ghRes.status });
    }

    const data: any = await ghRes.json();
    
    // 5. Decode Content (GitHub returns Base64)
    if (data.content && data.encoding === 'base64') {
        const buffer = Buffer.from(data.content, 'base64');
        const jsonString = buffer.toString('utf-8');
        
        try {
            const json = JSON.parse(jsonString);
            
            // INJECT SHA: This allows the frontend to track versions even via Proxy
            if (typeof json === 'object' && json !== null) {
                json._sha = data.sha;
            }
            
            return res.status(200).json(json);
        } catch (parseError) {
            return res.status(500).json({ error: 'Invalid JSON in source file' });
        }
    }
    
    // Fallback if content isn't base64 (unlikely for file contents API)
    return res.status(200).json(data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}