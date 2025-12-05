
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

// --- Github API Helpers ---
const GITHUB_API = "https://api.github.com";

async function getFileSha(token: string, owner: string, repo: string, path: string, branch: string) {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache' // Critical for validating sync
        }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
}

async function updateFile(token: string, owner: string, repo: string, path: string, content: string, message: string, branch: string, sha?: string) {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
    const body: any = {
        message,
        content: Buffer.from(content).toString('base64'),
        branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Failed to update ${path}`);
    }
    return await res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Kill Cache - Strict Headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  
  // 2. CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('ok');
  }

  // 3. Auth Extraction
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : (process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN);
  const owner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER;
  const repo = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return res.status(500).json({ error: 'Missing GitHub Configuration' });
  }

  const { branch = 'main' } = req.query;
  const branchName = Array.isArray(branch) ? branch[0] : branch;

  try {
    // --- READ (GET) ---
    if (req.method === 'GET') {
        const path = 'src/data.json';
        const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branchName}&t=${Date.now()}`;
        
        const ghRes = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-store'
            }
        });

        if (!ghRes.ok) return res.status(ghRes.status).json({ error: 'Failed to fetch data' });

        const data: any = await ghRes.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const json = JSON.parse(content);
        
        // Append SHA for optimistic locking
        json._sha = data.sha;
        
        return res.status(200).json(json);
    }

    // --- WRITE (PUT) ---
    if (req.method === 'PUT') {
        const payload = req.body;
        
        // 1. Validate Payload Structure
        if (!payload.projects || !payload.config) {
            return res.status(400).json({ error: "Invalid Data Schema" });
        }

        const commitMessage = payload._commitMessage || "Update content via CMS";
        const clientSha = payload._sha; // The SHA the client *thinks* exists

        // 2. Get Current SHA (Concurrency Check)
        const currentJsonSha = await getFileSha(token, owner, repo, 'src/data.json', branchName);
        
        // Safety: If client provided a SHA, and it doesn't match server, reject.
        // This prevents overwriting if someone else pushed code in the meantime.
        if (clientSha && currentJsonSha && clientSha !== currentJsonSha) {
             return res.status(409).json({ 
                 error: "Conflict detected. The data has changed on the server since you loaded it. Please refresh.",
                 serverSha: currentJsonSha,
                 clientSha: clientSha
             });
        }

        // 3. Update src/data.json (Runtime Data)
        // Remove internal flags before saving
        const dataToSave = { ...payload };
        delete dataToSave._sha;
        delete dataToSave._commitMessage;
        
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const jsonResult = await updateFile(token, owner, repo, 'src/data.json', jsonString, commitMessage, branchName, currentJsonSha || undefined);

        // 4. Update src/data.ts (Source Code)
        // We generate the TS file programmatically to ensure the repo stays buildable
        const tsContent = `import { Project, Experience, SocialLink, Client, SkillCategory, GlobalConfig } from './types';

export const LAST_UPDATED = "${new Date().toISOString()}";

export const INITIAL_CONFIG: GlobalConfig = ${JSON.stringify(payload.config, null, 2)};

export const PROJECTS: Project[] = ${JSON.stringify(payload.projects, null, 2)};

export const EXPERIENCE: Experience[] = ${JSON.stringify(payload.experience, null, 2)};

export const CLIENTS: Client[] = ${JSON.stringify(payload.clients, null, 2)};

export const SKILLS: SkillCategory[] = ${JSON.stringify(payload.skills, null, 2)};

export const SOCIALS: SocialLink[] = ${JSON.stringify(payload.socials, null, 2)};
`;
        // We don't strictly lock SHA on .ts file as it is derivative, we just overwrite
        const currentTsSha = await getFileSha(token, owner, repo, 'src/data.ts', branchName);
        await updateFile(token, owner, repo, 'src/data.ts', tsContent, commitMessage, branchName, currentTsSha || undefined);

        return res.status(200).json({ 
            success: true, 
            newSha: jsonResult.content.sha,
            timestamp: Date.now()
        });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error: any) {
    console.error("API Error", error);
    return res.status(500).json({ error: error.message });
  }
}
