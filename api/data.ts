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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).send('ok');
    return;
  }

  // 3. Env Vars
  const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const owner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER;
  const repo = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return res.status(500).json({ error: 'Missing Server Environment Variables' });
  }

  // 4. Target Path (Default to src/data.json)
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path[0] : (path || 'src/data.json');

  try {
    // 5. Fetch from GitHub API
    const timestamp = Date.now(); 
    const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}?t=${timestamp}`;
    
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
    
    // 6. Decode Base64 Content
    if (data.content && data.encoding === 'base64') {
        const buffer = Buffer.from(data.content, 'base64');
        const jsonString = buffer.toString('utf-8');
        try {
            const json = JSON.parse(jsonString);
            // Inject SHA for version tracking
            if (typeof json === 'object' && json !== null) {
                json._sha = data.sha;
            }
            return res.status(200).json(json);
        } catch (e) {
            return res.status(500).json({ error: 'Invalid JSON in source file' });
        }
    }
    
    return res.status(200).json(data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
