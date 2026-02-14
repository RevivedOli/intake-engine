import { NextResponse } from "next/server";
import ImageKit from "imagekit";

const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

export const dynamic = "force-dynamic";

export async function GET() {
  if (!urlEndpoint || !publicKey || !privateKey) {
    return NextResponse.json(
      { error: "ImageKit is not configured" },
      { status: 503 }
    );
  }

  try {
    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
    const auth = imagekit.getAuthenticationParameters();
    return NextResponse.json({
      ...auth,
      publicKey,
      urlEndpoint,
    });
  } catch (e) {
    console.error("ImageKit auth error:", e);
    return NextResponse.json(
      { error: "Failed to generate upload credentials" },
      { status: 500 }
    );
  }
}
