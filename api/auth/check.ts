export default async function handler(_req: any, res: any) {
  // Authentication check handled client-side via Supabase.
  return res.status(200).json({ 
    authenticated: true,
    message: "Auth handled client-side"
  });
}