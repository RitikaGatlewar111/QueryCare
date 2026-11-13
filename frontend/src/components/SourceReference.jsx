import { FileText } from 'lucide-react';

function SourceReference({ source, isMock = false }) {
  if (!source?.filename) return null;

  const pages = Array.isArray(source.pageNumbers)
    ? source.pageNumbers
    : source.page == null
      ? []
      : [source.page];

  return (
    <div className="source-reference">
      <span className="source-icon"><FileText size={15} /></span>
      <span className="source-copy">
        <span className="source-label">{isMock ? 'Mock source' : 'Source'}</span>
        <span className="source-filename">{source.filename}</span>
      </span>
      {pages.length > 0 && (
        <span className="source-page">
          {pages.length > 1 ? 'Pages' : 'Page'} {pages.join(', ')}
        </span>
      )}
    </div>
  );
}

export default SourceReference;
