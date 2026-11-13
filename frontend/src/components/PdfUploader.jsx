import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  FolderOpen,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file) {
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  return hasPdfExtension && (!file.type || file.type === 'application/pdf');
}

function PdfUploader({
  file,
  error,
  uploadStatus,
  uploadMessage,
  extractedText,
  chunksPreview,
  chunkCount,
  embeddingStatus,
  embeddedChunkCount,
  embeddingModel,
  onUpload,
  onFileSelect,
  onError,
  onRemove,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return undefined;

    function handleCancel() {
      onError('No file selected. Choose a PDF to continue.');
    }

    input.addEventListener('cancel', handleCancel);
    return () => input.removeEventListener('cancel', handleCancel);
  }, [onError]);

  function handleFiles(fileList) {
    const selectedFile = fileList?.[0];
    if (!selectedFile) {
      onError('No file selected. Choose a PDF to continue.');
      return;
    }
    if (fileList.length > 1) {
      onError('Choose one PDF file at a time.');
      return;
    }
    if (!isPdf(selectedFile)) {
      onError('That file type is not supported. Please choose a PDF file.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      onError('This PDF is too large. The maximum file size is 10 MB.');
      return;
    }
    onFileSelect(selectedFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function removeFile() {
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="pdf-uploader">
      {file ? (
        <div className="selected-file">
          <span className="file-type-icon"><FileText size={20} /></span>
          <span className="file-details">
            <span className="file-name" title={file.name}>{file.name}</span>
            <span className="file-size">{formatFileSize(file.size)} · PDF</span>
          </span>
          <button
            className="btn remove-file-button"
            type="button"
            onClick={removeFile}
            disabled={uploadStatus === 'uploading'}
            aria-label={`Remove ${file.name}`}
            title="Remove PDF"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ) : (
        <div
          className={`drop-zone ${isDragging ? 'drop-zone-active' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <span className="drop-icon"><UploadCloud size={22} /></span>
          <p className="drop-title">Drop your PDF here</p>
          <p className="drop-caption">PDF files only</p>
          <button
            className="btn browse-button"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <FolderOpen size={16} /> Browse files
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/pdf,.pdf"
        aria-label="Choose a PDF file"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      {error && <p className="upload-error" role="alert">{error}</p>}
      {file && (
        <button
          className="btn upload-pdf-button"
          type="button"
          onClick={onUpload}
          disabled={uploadStatus === 'uploading'}
        >
          {uploadStatus === 'uploading' ? (
            <>
              <LoaderCircle size={15} className="upload-spinner" />
              Uploading…
            </>
          ) : (
            <>
              <UploadCloud size={15} />
              {uploadStatus === 'success' ? 'Upload again' : 'Upload PDF'}
            </>
          )}
        </button>
      )}
      {uploadMessage && (
        <p
          className={`upload-feedback upload-feedback-${uploadStatus}`}
          role={uploadStatus === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {uploadStatus === 'success' && <CheckCircle2 size={15} />}
          {uploadStatus === 'uploading' && <LoaderCircle size={15} className="upload-spinner" />}
          {uploadMessage}
        </p>
      )}
      {uploadStatus === 'success' && extractedText && (
        <div className="extracted-text-preview">
          <p className="extracted-text-title">Extracted text preview</p>
          <p className="extracted-text-content">
            {extractedText.length > 500
              ? `${extractedText.slice(0, 500).trimEnd()}…`
              : extractedText}
          </p>
          <p className="extracted-text-note">
            Preview only. Full text is not returned; chunks and embeddings remain in backend memory.
          </p>
        </div>
      )}
      {uploadStatus === 'success' && chunkCount > 0 && (
        <div className="chunk-preview-list">
          <p className="extracted-text-title">Text chunks ({chunkCount})</p>
          <p className={`embedding-status embedding-status-${embeddingStatus}`} role="status">
            {embeddingStatus === 'generated'
              ? `Embeddings generated for ${embeddedChunkCount} chunks${embeddingModel ? ` using ${embeddingModel}` : ''}. Stored in backend memory only; retrieval is not implemented.`
              : embeddingStatus === 'not_configured'
                ? 'Embeddings were not generated. Configure the provider and API key in backend/.env.'
                : embeddingStatus === 'no_extractable_text'
                  ? 'Embeddings were not generated because no text could be extracted.'
                  : 'Embeddings were not generated.'}
          </p>
          {chunksPreview.map((chunk) => (
            <div className="chunk-preview" key={chunk.chunkIndex}>
              <span className="chunk-preview-label">
                Chunk {chunk.chunkIndex} · {chunk.filename}
                {chunk.pageNumbers?.length > 0 && ` · Page${chunk.pageNumbers.length > 1 ? 's' : ''} ${chunk.pageNumbers.join(', ')}`}
              </span>
              <p className="chunk-preview-text">{chunk.text}</p>
            </div>
          ))}
          <p className="extracted-text-note mb-0">
            Showing a small preview only. In-memory data is cleared when the backend restarts.
          </p>
        </div>
      )}
    </div>
  );
}

export default PdfUploader;
