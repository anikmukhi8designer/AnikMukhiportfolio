
// Explicitly define types for Vercel Serverless Functions
interface VercelRequest {
  query: Partial<{ [key: string]: string | string[] }>;
  cookies: Partial<{ [key: string]: string }>;
  body: any;
  method?: string;
  headers: { [key: string]: string | undefined };
  [key: string]: any;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  send(body: any): VercelResponse;
  json(jsonBody: any): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  [key: string]: any;
}

declare const process: {
  env: { [key: string]: string | undefined };
};

declare const Buffer: {
  from: (str: string, encoding?: string) => any;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Kill Cache - Strict
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // 2. CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).send('ok');
    return;
  }

  // 3. Auth Strategy
  const authHeader = req.headers.authorization;
  const token = authHeader 
    ? authHeader.replace('Bearer ', '') 
    : (process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN);
    
  const owner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER;
  const repo = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO;

  if (!token) {
    return res.status(500).json({ error: 'Missing GitHub Token configuration' });
  }

  // 4. Target Path & Branch
  const { path, branch, ref } = req.query;
  const targetPath = Array.isArray(path) ? path[0] : (path || 'src/data.json');
  // Support 'branch' or 'ref' param, default to undefined (which lets GitHub use repo default)
  const targetRef = (Array.isArray(branch) ? branch[0] : branch) || (Array.isArray(ref) ? ref[0] : ref);
  
  const targetOwner = owner; 
  const targetRepo = repo;

  if (!targetOwner || !targetRepo) {
     return res.status(500).json({ error: 'Missing Repository configuration' });
  }

  try {
    const timestamp = Date.now(); 
    // Add randomness to prevent GitHub edge caching
    const cacheBuster = Math.random().toString(36).substring(7);

    // --- HANDLE GET (READ) ---
    if (req.method === 'GET') {
        let ghUrl = `https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${targetPath}?t=${timestamp}&cb=${cacheBuster}`;
        
        // Append ref if provided
        if (targetRef) {
            ghUrl += `&ref=${encodeURIComponent(targetRef)}`;
        }
        
        const ghRes = await fetch(ghUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache'
          }
        });

        if (!ghRes.ok) {
            return res.status(ghRes.status).json({ error: 'GitHub Fetch Failed', status: ghRes.status });
        }

        const data: any = await ghRes.json();
        
        if (data.content && data.encoding === 'base64') {
            const buffer = Buffer.from(data.content, 'base64');
            const jsonString = buffer.toString('utf-8');
            try {
                const json = JSON.parse(jsonString);
                if (typeof json === 'object' && json !== null) {
                    json._sha = data.sha;
                }
                return res.status(200).json(json);
            } catch (e) {
                // If it's not JSON (e.g. image), return raw data structure
                return res.status(200).json(data);
            }
        }
        
        return res.status(200).json(data);
    }

    // --- HANDLE PUT (WRITE) ---
    if (req.method === 'PUT') {
        const ghUrl = `https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${targetPath}`;
        
        const body = req.body;
        // Ensure body includes branch if we are writing to a specific one
        if (targetRef && body && typeof body === 'object') {
            body.branch = targetRef;
        }

        const ghRes = await fetch(ghUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify(body)
        });

        const data = await ghRes.json();

        if (!ghRes.ok) {
            return res.status(ghRes.status).json({ error: data.message || 'GitHub Write Failed', details: data });
        }

        return res.status(200).json({ success: true, content: data.content });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
