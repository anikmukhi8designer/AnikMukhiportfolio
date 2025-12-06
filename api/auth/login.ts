export default async function handler(_req: any, res: any) {
  // Authentication has been moved to client-side Supabase Auth.
  return res.status(200).json({ 
    success: true, 
    message: "Auth handled client-side" 
  });
}