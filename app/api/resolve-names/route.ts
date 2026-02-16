import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ name: null });
  }

  // Try Farcaster name via Neynar API (requires NEYNAR_API_KEY env var)
  const neynarKey = process.env.NEYNAR_API_KEY;
  if (neynarKey) {
    try {
      const resp = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address.toLowerCase()}`,
        {
          headers: {
            'api_key': neynarKey,
            'accept': 'application/json',
          },
          next: { revalidate: 3600 },
        }
      );
      const data = await resp.json();
      const users = data[address.toLowerCase()];
      if (Array.isArray(users) && users.length > 0 && users[0].username) {
        return NextResponse.json({ name: users[0].username });
      }
    } catch {
      // Farcaster resolution failed, return null
    }
  }

  return NextResponse.json({ name: null });
}
