"use client";

import { useState, useEffect, useCallback } from "react";
import { upload } from "@imagekit/react";

const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";
const buttonClass =
  "rounded border border-zinc-600 px-3 py-2 text-zinc-300 hover:bg-zinc-700 text-sm";

interface ImageUrlFieldProps {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  label?: string;
}

type ImageKitAuth = {
  token: string;
  expire: string;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
};

type ImageKitFile = {
  type: "file";
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  filePath: string;
};

type ImageKitFolder = {
  type: "folder";
  id: string;
  name: string;
  path: string;
};

export function ImageUrlField({
  value,
  onChange,
  placeholder = "Paste image URL or use ImageKit",
  label,
}: ImageUrlFieldProps) {
  const [imageKitAvailable, setImageKitAvailable] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "browse">("upload");
  const [auth, setAuth] = useState<ImageKitAuth | null>(null);
  const [files, setFiles] = useState<ImageKitFile[]>([]);
  const [folders, setFolders] = useState<ImageKitFolder[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [uploadFolderPath, setUploadFolderPath] = useState("");
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderPickerPath, setFolderPickerPath] = useState("");
  const [folderPickerFolders, setFolderPickerFolders] = useState<ImageKitFolder[]>([]);
  const [folderPickerLoading, setFolderPickerLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/imagekit/auth")
      .then((r) => {
        if (cancelled) return;
        setImageKitAvailable(r.ok);
      })
      .catch(() => {
        if (!cancelled) setImageKitAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchAuth = useCallback(async () => {
    const res = await fetch("/api/imagekit/auth");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "ImageKit not configured");
    }
    return res.json() as Promise<ImageKitAuth>;
  }, []);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setTab("upload");
    setError(null);
    setAuth(null);
    setFiles([]);
    setFolders([]);
    setCurrentPath("");
    setUploadFolderPath("");
    setShowFolderPicker(false);
    setNewFolderName("");
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setError(null);
    setUploadProgress(0);
  }, []);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setError(null);
      setLoading(true);
      setUploadProgress(0);
      try {
        const authParams = auth ?? (await fetchAuth());
        if (!auth) setAuth(authParams);
        const uploadOptions: Parameters<typeof upload>[0] = {
          file,
          fileName: file.name,
          token: authParams.token,
          expire: Number(authParams.expire),
          signature: authParams.signature,
          publicKey: authParams.publicKey,
          onProgress: (ev) => {
            if (ev.total) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          },
        };
        if (uploadFolderPath) {
          uploadOptions.folder = uploadFolderPath.endsWith("/") ? uploadFolderPath : uploadFolderPath + "/";
        }
        const result = await upload(uploadOptions);
        const url = (result as { url?: string })?.url;
        if (url) {
          onChange(url);
          closeModal();
        } else {
          setError("Upload succeeded but no URL returned");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    },
    [auth, fetchAuth, onChange, closeModal, uploadFolderPath]
  );

  const openFolderPicker = useCallback(() => {
    setShowFolderPicker(true);
    setFolderPickerPath(uploadFolderPath);
    setFolderPickerFolders([]);
    setFolderPickerLoading(true);
    const path = uploadFolderPath || "";
    const url = path
      ? `/api/imagekit/files?limit=50&path=${encodeURIComponent(path)}`
      : "/api/imagekit/files?limit=50";
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data: { folders?: ImageKitFolder[] }) => {
        setFolderPickerFolders(data.folders ?? []);
      })
      .catch(() => setFolderPickerFolders([]))
      .finally(() => setFolderPickerLoading(false));
  }, [uploadFolderPath]);

  const closeFolderPicker = useCallback(() => setShowFolderPicker(false), []);

  const useFolderPickerFolder = useCallback((path: string) => {
    setUploadFolderPath(path);
    setShowFolderPicker(false);
  }, []);

  const folderPickerGoTo = useCallback((path: string) => {
    setFolderPickerPath(path);
    setFolderPickerLoading(true);
    const url = path
      ? `/api/imagekit/files?limit=50&path=${encodeURIComponent(path)}`
      : "/api/imagekit/files?limit=50";
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data: { folders?: ImageKitFolder[] }) => {
        setFolderPickerFolders(data.folders ?? []);
      })
      .catch(() => setFolderPickerFolders([]))
      .finally(() => setFolderPickerLoading(false));
  }, []);

  const fetchFiles = useCallback(async (path?: string, cacheBust = false) => {
    setError(null);
    setLoading(true);
    try {
      const base =
        path !== undefined && path !== ""
          ? `/api/imagekit/files?limit=50&path=${encodeURIComponent(path)}`
          : "/api/imagekit/files?limit=50";
      const url = cacheBust ? `${base}&_t=${Date.now()}` : base;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to list files");
      }
      const data = (await res.json()) as {
        files?: ImageKitFile[];
        folders?: ImageKitFolder[];
      };
      setFiles(data.files ?? []);
      setFolders(data.folders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
      setFiles([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setError(null);
    setCreatingFolder(true);
    try {
      const parentPath = !currentPath ? "/" : currentPath.endsWith("/") ? currentPath : currentPath + "/";
      const res = await fetch("/api/imagekit/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderName: name,
          parentFolderPath: parentPath,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create folder");
      }
      setNewFolderName("");
      // Brief delay so ImageKit can include the new folder in the list, then refetch with cache-bust
      await new Promise((r) => setTimeout(r, 400));
      await fetchFiles(currentPath || undefined, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName, currentPath, fetchFiles]);

  const goToFolder = useCallback(
    (path: string) => {
      setCurrentPath(path);
      setError(null);
      setLoading(true);
      const url = `/api/imagekit/files?limit=50&path=${encodeURIComponent(path)}`;
      fetch(url)
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error ?? "Failed to list")));
          return res.json();
        })
        .then((data: { files?: ImageKitFile[]; folders?: ImageKitFolder[] }) => {
          setFiles(data.files ?? []);
          setFolders(data.folders ?? []);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load");
          setFiles([]);
          setFolders([]);
        })
        .finally(() => setLoading(false));
    },
    []
  );

  const handleSelectFile = useCallback(
    (file: ImageKitFile) => {
      onChange(file.url);
      closeModal();
    },
    [onChange, closeModal]
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) =>
            onChange(e.target.value.trim() === "" ? undefined : e.target.value)
          }
          placeholder={placeholder}
          className={inputClass}
        />
        {imageKitAvailable && (
          <button
            type="button"
            onClick={openModal}
            className={buttonClass + " shrink-0"}
          >
            From ImageKit…
          </button>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="imagekit-modal-title"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="rounded-lg border border-zinc-600 bg-zinc-800 p-6 max-w-lg w-full shadow-xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2
                id="imagekit-modal-title"
                className="text-lg font-medium text-zinc-200"
              >
                Upload or choose from ImageKit
              </h2>
              <a
                href="https://imagekit.io/dashboard/media-library"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass + " shrink-0 text-xs"}
              >
                Open ImageKit →
              </a>
            </div>

            <div className="flex gap-2 border-b border-zinc-600 mb-4">
              <button
                type="button"
                onClick={() => {
                  setTab("upload");
                  setError(null);
                }}
                className={`px-3 py-2 text-sm -mb-px ${
                  tab === "upload"
                    ? "border-b-2 border-amber-500 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("browse");
                  setError(null);
                  setCurrentPath("");
                  if (files.length === 0 && folders.length === 0 && !loading) fetchFiles();
                }}
                className={`px-3 py-2 text-sm -mb-px ${
                  tab === "browse"
                    ? "border-b-2 border-amber-500 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Browse
              </button>
            </div>

            {error && (
              <p className="text-amber-400 text-sm mb-3" role="alert">
                {error}
              </p>
            )}

            {tab === "upload" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 text-sm">Upload to folder</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-zinc-300 text-sm truncate flex-1">
                      {!uploadFolderPath || uploadFolderPath === "/"
                        ? "Root"
                        : uploadFolderPath.replace(/\/$/, "")}
                    </span>
                    <button
                      type="button"
                      onClick={openFolderPicker}
                      className={buttonClass + " shrink-0"}
                    >
                      Choose folder
                    </button>
                  </div>
                </div>
                {showFolderPicker && (
                  <div className="rounded border border-zinc-600 bg-zinc-900/80 p-3 flex flex-col gap-2 max-h-48 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-zinc-500 text-xs">Select folder:</span>
                      <button
                        type="button"
                        onClick={closeFolderPicker}
                        className="text-zinc-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex gap-1 items-center flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => folderPickerGoTo("")}
                        className="text-zinc-400 hover:text-white"
                      >
                        Root
                      </button>
                      {folderPickerPath &&
                        folderPickerPath.split("/").filter(Boolean).map((seg, i, arr) => {
                          const p = arr.slice(0, i + 1).join("/") + "/";
                          return (
                            <span key={p} className="flex items-center gap-1">
                              <span className="text-zinc-600">/</span>
                              <button
                                type="button"
                                onClick={() => folderPickerGoTo(p)}
                                className="text-zinc-400 hover:text-white"
                              >
                                {seg}
                              </button>
                            </span>
                          );
                        })}
                    </div>
                    {folderPickerLoading ? (
                      <p className="text-zinc-500 text-xs">Loading…</p>
                    ) : (
                      <div className="flex flex-wrap gap-1 overflow-y-auto min-h-[60px]">
                        <button
                          type="button"
                          onClick={() => useFolderPickerFolder(folderPickerPath || "/")}
                          className="rounded border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-xs text-amber-200"
                        >
                          Use this folder
                        </button>
                        {folderPickerFolders.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => folderPickerGoTo(f.path)}
                            className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            {f.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <label className="flex flex-col gap-1">
                  <span className="text-zinc-400 text-sm">
                    Choose a file to upload
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={loading}
                    className="text-zinc-300 text-sm file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-zinc-600 file:text-zinc-200"
                  />
                </label>
                {loading && uploadProgress > 0 && (
                  <p className="text-zinc-500 text-sm">
                    Uploading… {uploadProgress}%
                  </p>
                )}
              </div>
            )}

            {tab === "browse" && (
              <div className="flex-1 overflow-y-auto min-h-[200px] flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-zinc-500 text-sm">Path:</span>
                  <button
                    type="button"
                    onClick={() => goToFolder("")}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Root
                  </button>
                  {currentPath &&
                    currentPath.split("/").filter(Boolean).map((segment, i, arr) => {
                      const path = arr.slice(0, i + 1).join("/") + "/";
                      return (
                        <span key={path} className="flex items-center gap-1">
                          <span className="text-zinc-500">/</span>
                          <button
                            type="button"
                            onClick={() => goToFolder(path)}
                            className="text-sm text-zinc-400 hover:text-white"
                          >
                            {segment}
                          </button>
                        </span>
                      );
                    })}
                </div>
                <div className="flex gap-2 items-end">
                  <label className="flex-1 flex flex-col gap-1">
                    <span className="text-zinc-400 text-xs">New folder</span>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createFolder())}
                      placeholder="Folder name"
                      className={inputClass + " py-1.5 text-sm"}
                      disabled={creatingFolder}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={createFolder}
                    disabled={!newFolderName.trim() || creatingFolder}
                    className={buttonClass + " shrink-0"}
                  >
                    {creatingFolder ? "Creating…" : "Create"}
                  </button>
                </div>
                {loading && files.length === 0 && folders.length === 0 ? (
                  <p className="text-zinc-500 text-sm">Loading…</p>
                ) : files.length === 0 && folders.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    This folder is empty. Create a folder or upload in the Upload tab.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => goToFolder(folder.path)}
                        className="rounded border border-zinc-600 overflow-hidden hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 flex flex-col items-center justify-center min-h-[80px] p-2"
                      >
                        <svg className="w-8 h-8 text-zinc-500 mb-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="block truncate text-xs text-zinc-400 w-full text-center">
                          {folder.name}
                        </span>
                      </button>
                    ))}
                    {files.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handleSelectFile(file)}
                        className="rounded border border-zinc-600 overflow-hidden hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <img
                          src={file.thumbnail || file.url}
                          alt=""
                          className="w-full aspect-square object-cover"
                        />
                        <span className="block truncate text-xs text-zinc-400 p-1">
                          {file.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className={buttonClass}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
