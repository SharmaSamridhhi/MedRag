import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "./DashboardLayout";
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function StatusBadge({ status }) {
  const map = {
    ready: {
      label: "Ready",
      bg: "#dcf5e7",
      color: "#1a6b3a",
      icon: CheckCircle,
    },
    pending: { label: "Pending", bg: "#fff3dc", color: "#8a5a00", icon: Clock },
    processing: {
      label: "Processing",
      bg: "#fff3dc",
      color: "#8a5a00",
      icon: Clock,
    },
    failed: {
      label: "Failed",
      bg: "#fde8e8",
      color: "#a32d2d",
      icon: AlertCircle,
    },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span
      className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold'
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <Icon className='w-3 h-3' />
      {s.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const PAGE_SIZE = 5;

  const fetchDocuments = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/documents`, {
        credentials: "include",
      });
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch documents:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const hasPending = documents.some(
      (d) => d.status === "pending" || d.status === "processing",
    );
    if (hasPending) {
      pollingRef.current = setInterval(() => fetchDocuments(true), 3000);
    } else {
      clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [documents, fetchDocuments]);

  const uploadFiles = async (files) => {
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) return;

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    pdfs.forEach((f) => formData.append("files", f));

    try {
      setUploadProgress(40);
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      setUploadProgress(80);
      if (res.ok) {
        await fetchDocuments(true);
        setUploadProgress(100);
        setTimeout(() => {
          setUploadProgress(0);
          setUploading(false);
        }, 600);
      } else {
        setUploading(false);
        setUploadProgress(0);
      }
    } catch (e) {
      console.error("Upload failed:", e);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleDelete = async (docId) => {
    try {
      await fetch(`${API_URL}/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(documents.length / PAGE_SIZE));
  const paginated = documents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className='h-full flex flex-col overflow-hidden'>
        {/* Header */}
        <div
          className='flex items-center justify-between px-8 py-5 border-b shrink-0'
          style={{ borderColor: "#cce3de", backgroundColor: "#f6fff8" }}
        >
          <div>
            <h1 className='text-xl font-bold' style={{ color: "#1a2e25" }}>
              Document Library
            </h1>
            <p className='text-sm mt-0.5' style={{ color: "#6b9080" }}>
              Manage and analyze your clinical datasets.
            </p>
          </div>
          <button
            onClick={() => fetchDocuments()}
            disabled={isRefreshing}
            className='flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors'
            style={{
              borderColor: "#cce3de",
              color: "#6b9080",
              backgroundColor: isRefreshing ? "#eaf4f4" : "white",
            }}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-8 py-6 space-y-6'>
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className='border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors'
            style={{
              borderColor: isDragging ? "#6b9080" : "#a4c3b2",
              backgroundColor: isDragging ? "#eaf4f4" : "white",
            }}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='application/pdf'
              multiple
              className='hidden'
              onChange={(e) => uploadFiles(e.target.files)}
            />
            <div
              className='w-12 h-12 rounded-xl flex items-center justify-center mb-3'
              style={{ backgroundColor: "#eaf4f4" }}
            >
              <Upload className='w-5 h-5' style={{ color: "#6b9080" }} />
            </div>
            <p className='text-sm font-semibold' style={{ color: "#1a2e25" }}>
              {uploading ? "Uploading…" : "Drag & Drop Documents"}
            </p>
            <p className='text-xs mt-1' style={{ color: "#6b9080" }}>
              {uploading
                ? "Processing your files"
                : "Validate your clinical reasoning with trusted sources"}
            </p>

            {uploading && (
              <div
                className='w-48 mt-4 h-1.5 rounded-full overflow-hidden'
                style={{ backgroundColor: "#cce3de" }}
              >
                <div
                  className='h-full rounded-full transition-all duration-300'
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: "#6b9080",
                  }}
                />
              </div>
            )}
          </div>

          {/* Document table */}
          <div
            className='rounded-2xl border overflow-hidden'
            style={{ borderColor: "#cce3de" }}
          >
            <div
              className='px-5 py-3 border-b'
              style={{ backgroundColor: "#eaf4f4", borderColor: "#cce3de" }}
            >
              <h2
                className='text-sm font-semibold'
                style={{ color: "#1a2e25" }}
              >
                Main Repository
              </h2>
            </div>

            {documents.length === 0 ? (
              <div
                className='py-16 flex flex-col items-center'
                style={{ backgroundColor: "white" }}
              >
                <FileText
                  className='w-10 h-10 mb-3'
                  style={{ color: "#a4c3b2" }}
                />
                <p className='text-sm' style={{ color: "#6b9080" }}>
                  No documents yet. Upload a PDF above to get started.
                </p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div
                  className='grid grid-cols-[1fr_140px_120px_60px] px-5 py-2.5 text-xs font-semibold tracking-widest uppercase border-b'
                  style={{
                    color: "#6b9080",
                    borderColor: "#cce3de",
                    backgroundColor: "white",
                  }}
                >
                  <span>Filename</span>
                  <span>Upload Date</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {/* Rows */}
                {paginated.map((doc) => (
                  <div
                    key={doc.documentId}
                    className='grid grid-cols-[1fr_140px_120px_60px] px-5 py-3.5 border-b items-center hover:bg-gray-50 transition-colors'
                    style={{ borderColor: "#eaf4f4", backgroundColor: "white" }}
                  >
                    <div className='flex items-center gap-2.5 min-w-0'>
                      <FileText
                        className='w-4 h-4 shrink-0'
                        style={{ color: "#6b9080" }}
                      />
                      <span
                        className='text-sm truncate font-medium'
                        style={{ color: "#1a2e25" }}
                      >
                        {doc.filename}
                      </span>
                    </div>
                    <span className='text-sm' style={{ color: "#6b9080" }}>
                      {formatDate(doc.createdAt)}
                    </span>
                    <StatusBadge status={doc.status} />
                    <button
                      onClick={() => setDeleteConfirm(doc.documentId)}
                      className='p-2 rounded-lg transition-colors hover:bg-red-50 w-fit'
                      style={{ color: "#b05050" }}
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                ))}

                {/* Pagination */}
                <div
                  className='flex items-center justify-between px-5 py-3'
                  style={{ backgroundColor: "white" }}
                >
                  <p className='text-xs' style={{ color: "#6b9080" }}>
                    Showing{" "}
                    {Math.min((page - 1) * PAGE_SIZE + 1, documents.length)}–
                    {Math.min(page * PAGE_SIZE, documents.length)} of{" "}
                    {documents.length} documents
                  </p>
                  <div className='flex gap-2'>
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className='text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40 transition-colors hover:bg-gray-50'
                      style={{ borderColor: "#cce3de", color: "#4a6b5b" }}
                    >
                      Previous
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className='text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40 transition-colors hover:bg-gray-50'
                      style={{ borderColor: "#cce3de", color: "#4a6b5b" }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center'
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <div
            className='bg-white rounded-2xl shadow-xl p-6 w-80'
            style={{ border: "1px solid #cce3de" }}
          >
            <h3
              className='text-base font-semibold mb-2'
              style={{ color: "#1a2e25" }}
            >
              Delete document?
            </h3>
            <p className='text-sm mb-5' style={{ color: "#6b9080" }}>
              This will permanently remove the document and all its embeddings.
              This cannot be undone.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => setDeleteConfirm(null)}
                className='px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-gray-50'
                style={{ borderColor: "#cce3de", color: "#4a6b5b" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className='px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors'
                style={{ backgroundColor: "#c0392b" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
