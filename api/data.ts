
import { Buffer } from 'buffer';

export default async function handler(req: any, res: any) {
  const { owner, repo, branch = 'main' } = req.query;
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !owner || !repo) {
    return res.status(401).json({ error: 'GitHub credentials required' });
  }

  const GITHUB_API = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    if (req.method === 'GET') {
      const path = 'src/data.json';
      const ghRes = await fetch(`${GITHUB_API}/contents/${path}?ref=${branch}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });

      if (!ghRes.ok) return res.status(ghRes.status).json({ error: 'Data file not found' });

      const data = await ghRes.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const json = JSON.parse(content);
      json._sha = data.sha;
      return res.status(200).json(json);
    }

    if (req.method === 'PUT') {
      const payload = req.body;
      const commitMessage = payload._commitMessage || "Update content via CMS";
      const sha = payload._sha;

      // Clean payload for JSON storage
      const dataToStore = { ...payload };
      delete dataToStore._sha;
      delete dataToStore._commitMessage;

      const jsonContent = JSON.stringify(dataToStore, null, 2);

      // 1. Update src/data.json
      const putJson = await fetch(`${GITHUB_API}/contents/src/data.json`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(jsonContent).toString('base64'),
          sha,
          branch
        })
      });

      if (!putJson.ok) {
        const err = await putJson.json();
        throw new Error(`JSON update failed: ${err.message}`);
      }

      const jsonResult = await putJson.json();

      // 2. Sync to src/data.ts for static build compatibility
      const tsFile = await fetch(`${GITHUB_API}/contents/src/data.ts?ref=${branch}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let tsSha = null;
      if (tsFile.ok) {
        const tsData = await tsFile.json();
        tsSha = tsData.sha;
      }

      const tsTemplate = `
import { Project, Experience, SocialLink, Client, SkillCategory, GlobalConfig } from './types';

export const LAST_UPDATED = "${new Date().toISOString()}";

export const INITIAL_CONFIG: GlobalConfig = ${JSON.stringify(dataToStore.config, null, 2)};

export const PROJECTS: Project[] = ${JSON.stringify(dataToStore.projects, null, 2)};

export const EXPERIENCE: Experience[] = ${JSON.stringify(dataToStore.experience, null, 2)};

export const CLIENTS: Client[] = ${JSON.stringify(dataToStore.clients, null, 2)};

export const SKILLS: SkillCategory[] = ${JSON.stringify(dataToStore.skills, null, 2)};

export const SOCIALS: SocialLink[] = ${JSON.stringify(dataToStore.socials, null, 2)};
`;

      await fetch(`${GITHUB_API}/contents/src/data.ts`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${commitMessage} (Sync TS)`,
          content: Buffer.from(tsTemplate).toString('base64'),
          sha: tsSha,
          branch
        })
      });

      return res.status(200).json({ success: true, newSha: jsonResult.content.sha });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
