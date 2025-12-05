
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
  // 1. Kill Cache
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  
  // 2. CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).send('ok');
    return;
  }

  // 3. Auth Strategy: Prefer Header Token (from CMS User), Fallback to Env Var
  const authHeader = req.headers.authorization;
  const token = authHeader 
    ? authHeader.replace('Bearer ', '') 
    : (process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN);
    
  const owner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER;
  const repo = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO;

  // Note: For custom CMS users (localStorage), owner/repo might need to be passed in query or body
  // But for the default setup, we use env vars or assume the token has access to the env-configured repo.

  if (!token) {
    return res.status(500).json({ error: 'Missing GitHub Token configuration' });
  }

  // 4. Target Path
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path[0] : (path || 'src/data.json');
  
  // Resolve Repository Context
  // If the request body has specific repo details (optional enhancement), use them.
  // Otherwise default to Env vars.
  const targetOwner = owner; 
  const targetRepo = repo;

  if (!targetOwner || !targetRepo) {
     return res.status(500).json({ error: 'Missing Repository configuration' });
  }

  try {
    const timestamp = Date.now(); 

    // --- HANDLE GET (READ) ---
    if (req.method === 'GET') {
        const ghUrl = `https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${targetPath}?t=${timestamp}`;
        
        const ghRes = await fetch(ghUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
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
                return res.status(500).json({ error: 'Invalid JSON in source file' });
            }
        }
        
        return res.status(200).json(data);
    }

    // --- HANDLE PUT (WRITE) ---
    if (req.method === 'PUT') {
        const ghUrl = `https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${targetPath}`;
        
        // Body is already parsed by Vercel for JSON requests
        const body = req.body;

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
