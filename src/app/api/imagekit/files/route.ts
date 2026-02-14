import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

export const dynamic = "force-dynamic";

function isFileObject(
  item: unknown
): item is { fileId: string; name: string; url: string; thumbnail: string; filePath: string; type?: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    "url" in item &&
    "fileId" in item &&
    ("type" in item ? (item as { type?: string }).type !== "folder" : true)
  );
}

function isFolderObject(
  item: unknown
): item is { folderId: string; name: string; folderPath: string; type: "folder" } {
  return (
    typeof item === "object" &&
    item !== null &&
    "type" in item &&
    (item as { type?: string }).type === "folder" &&
    "folderId" in item &&
    "folderPath" in item
  );
}

export async function GET(request: NextRequest) {
  if (!urlEndpoint || !publicKey || !privateKey) {
    return NextResponse.json(
      { error: "ImageKit is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    100
  );
  const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));

  try {
    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
    const listOptions: {
      path?: string;
      searchQuery?: string;
      limit: number;
      skip: number;
      includeFolder?: boolean;
    } = {
      limit,
      skip,
      includeFolder: true,
    };
    if (path) listOptions.path = path;
    if (search) listOptions.searchQuery = search;

    const result = await imagekit.listFiles(listOptions);
    const list = Array.isArray(result) ? result : (result as { data?: unknown[] })?.data ?? [];
    const files = list.filter(isFileObject).map((f) => ({
      type: "file" as const,
      id: f.fileId,
      name: f.name,
      url: f.url,
      thumbnail: f.thumbnail,
      filePath: f.filePath,
    }));
    const folders = list.filter(isFolderObject).map((f) => ({
      type: "folder" as const,
      id: f.folderId,
      name: f.name,
      path: f.folderPath,
    }));
    return NextResponse.json({ files, folders });
  } catch (e) {
    console.error("ImageKit list files error:", e);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
