import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!urlEndpoint || !publicKey || !privateKey) {
    return NextResponse.json(
      { error: "ImageKit is not configured" },
      { status: 503 }
    );
  }

  let body: { folderName?: string; parentFolderPath?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const folderName =
    typeof body.folderName === "string" ? body.folderName.trim() : "";
  const parentFolderPath =
    typeof body.parentFolderPath === "string"
      ? body.parentFolderPath.trim() || "/"
      : "/";

  if (!folderName) {
    return NextResponse.json(
      { error: "folderName is required" },
      { status: 400 }
    );
  }

  try {
    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
    await imagekit.createFolder({
      folderName,
      parentFolderPath,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("ImageKit create folder error:", e);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
