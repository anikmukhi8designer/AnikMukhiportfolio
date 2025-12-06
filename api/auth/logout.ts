export default async function handler(_req: any, res: any) {
  // Logout handled client-side via Supabase.
  return res.status(200).json({ success: true });
}
