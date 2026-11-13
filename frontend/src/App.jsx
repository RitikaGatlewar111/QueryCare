import { useEffect, useRef, useState } from 'react';
import { ArrowUp, FileText, MessageCircle } from 'lucide-react';
import ChatMessage from './components/ChatMessage.jsx';
import Header from './components/Header.jsx';
import PdfUploader from './components/PdfUploader.jsx';
import Sidebar from './components/Sidebar.jsx';
import SourceReference from './components/SourceReference.jsx';
import SuggestedQuestions from './components/SuggestedQuestions.jsx';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [healthCheckAttempt, setHealthCheckAttempt] = useState(0);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pdf, setPdf] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [chunksPreview, setChunksPreview] = useState([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [embeddingStatus, setEmbeddingStatus] = useState('idle');
  const [embeddedChunkCount, setEmbeddedChunkCount] = useState(0);
  const [embeddingModel, setEmbeddingModel] = useState('');
  const uploadInProgressRef = useRef(false);
  const chatRequestControllerRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function checkApiHealth() {
      setApiStatus('checking');
      try {
        const response = await fetch(`${API_BASE_URL}/`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Health check failed with HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.status !== 'running') {
          throw new Error('The API returned an unexpected health-check response');
        }

        setApiStatus('connected');
      } catch (error) {
        if (error.name !== 'AbortError') {
          setApiStatus('error');
        }
      }
    }

    checkApiHealth();
    return () => controller.abort();
  }, [healthCheckAttempt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  useEffect(
    () => () => {
      chatRequestControllerRef.current?.abort();
    },
    [],
  );

  async function sendQuestion(value = question) {
    const message = value.trim();
    if (!message || chatRequestControllerRef.current) return;

    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: message }]);
    setQuestion('');
    setIsTyping(true);
    const controller = new AbortController();
    chatRequestControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message }),
        signal: controller.signal,
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('The server returned an invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(result.message || `The request failed with HTTP ${response.status}.`);
      }
      if (typeof result.answer !== 'string' || !result.answer.trim()) {
        throw new Error('The server did not return an answer. Please try again.');
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          role: 'assistant',
          text: result.answer,
          sources: Array.isArray(result.sources) ? result.sources : [],
        },
      ]);
    } catch (error) {
      if (error.name !== 'AbortError') {
        const errorMessage = error instanceof TypeError
          ? 'Unable to connect to QueryCare. Check that the backend is running on port 5000 and try again.'
          : error.message || 'Unable to get an answer. Please try again.';
        setMessages((current) => [
          ...current,
          {
            id: Date.now(),
            role: 'assistant',
            text: errorMessage,
            isError: true,
          },
        ]);
      }
    } finally {
      if (chatRequestControllerRef.current === controller) {
        chatRequestControllerRef.current = null;
        setIsTyping(false);
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion();
  }

  function handleQuestionKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendQuestion();
    }
  }

  function chooseSuggestion(suggestion) {
    if (isTyping) return;
    sendQuestion(suggestion);
    inputRef.current?.focus();
  }

  function startNewChat() {
    chatRequestControllerRef.current?.abort();
    chatRequestControllerRef.current = null;
    setMessages([]);
    setQuestion('');
    setIsTyping(false);
    inputRef.current?.focus();
  }

  async function uploadPdf() {
    if (!pdf || uploadInProgressRef.current) return;

    uploadInProgressRef.current = true;
    setUploadStatus('uploading');
    setUploadMessage('Uploading PDF and preparing chunks and embeddings when configured…');
    setPdfError('');
    setExtractedText('');
    setChunksPreview([]);
    setChunkCount(0);
    setEmbeddingStatus('idle');
    setEmbeddedChunkCount(0);
    setEmbeddingModel('');

    try {
      const formData = new FormData();
      formData.append('pdf', pdf);
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('The server returned an invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(result.message || `Upload failed with HTTP ${response.status}.`);
      }

      setUploadStatus('success');
      setUploadMessage(`${result.message} Received ${result.filename} (${result.size} bytes).`);
      setExtractedText(
        typeof result.extractedTextPreview === 'string' ? result.extractedTextPreview : '',
      );
      setChunksPreview(Array.isArray(result.chunksPreview) ? result.chunksPreview : []);
      setChunkCount(Number.isInteger(result.chunkCount) ? result.chunkCount : 0);
      setEmbeddingStatus(typeof result.embeddingStatus === 'string'
        ? result.embeddingStatus
        : 'not_reported');
      setEmbeddedChunkCount(
        Number.isInteger(result.embeddedChunkCount) ? result.embeddedChunkCount : 0,
      );
      setEmbeddingModel(typeof result.embeddingModel === 'string' ? result.embeddingModel : '');
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error.message || 'Unable to upload the PDF. Check the backend connection and try again.');
    } finally {
      uploadInProgressRef.current = false;
    }
  }

  function clearUploadState() {
    setUploadStatus('idle');
    setUploadMessage('');
    setExtractedText('');
    setChunksPreview([]);
    setChunkCount(0);
    setEmbeddingStatus('idle');
    setEmbeddedChunkCount(0);
    setEmbeddingModel('');
  }

  return (
    <div className="app-shell">
      <Sidebar onNewChat={startNewChat} />

      <main className="workspace-main">
        <Header
          apiStatus={apiStatus}
          onRetry={() => setHealthCheckAttempt((attempt) => attempt + 1)}
        />
        <div className="workspace-content">
          <div className="row g-4 workspace-grid">
            <aside className="col-xl-4" id="documents">
              <section className="card upload-card h-100" aria-labelledby="document-heading">
                <div className="card-body">
                  <div className="section-heading">
                    <span className="section-icon"><FileText size={19} /></span>
                    <div>
                      <h2 id="document-heading" className="section-title">Knowledge base</h2>
                      <p className="section-subtitle mb-0">Add a PDF to your demo workspace</p>
                    </div>
                  </div>

                  <PdfUploader
                    file={pdf}
                    error={pdfError}
                    uploadStatus={uploadStatus}
                    uploadMessage={uploadMessage}
                    extractedText={extractedText}
                    chunksPreview={chunksPreview}
                    chunkCount={chunkCount}
                    embeddingStatus={embeddingStatus}
                    embeddedChunkCount={embeddedChunkCount}
                    embeddingModel={embeddingModel}
                    onUpload={uploadPdf}
                    onFileSelect={(selectedFile) => {
                      setPdf(selectedFile);
                      setPdfError('');
                      clearUploadState();
                    }}
                    onError={(message) => {
                      setPdfError(message);
                      clearUploadState();
                    }}
                    onRemove={() => {
                      setPdf(null);
                      setPdfError('');
                      clearUploadState();
                    }}
                  />

                  <div className="upload-status" role="status" aria-live="polite">
                    <span className={`status-dot ${pdf ? 'status-dot-ready' : ''}`} />
                    <span>
                      {!pdf
                        ? 'Waiting for a PDF'
                        : uploadStatus === 'uploading'
                          ? 'Preparing PDF text and embeddings'
                          : uploadStatus === 'success'
                            ? extractedText
                              ? 'Text extracted · available to chat'
                              : 'PDF received · no extractable text'
                            : uploadStatus === 'error'
                              ? 'Upload failed'
                              : 'PDF selected · not uploaded or processed'}
                    </span>
                  </div>
                  <p className="upload-disclaimer mb-0">
                    Text is extracted in memory only. The PDF and text are not stored or used for answers.
                  </p>

                  <details className="source-example">
                    <summary>Preview a source reference</summary>
                    <p className="source-example-note">
                      Example only — this mock citation was not retrieved from a document.
                    </p>
                    <SourceReference
                      source={{ filename: 'sample-policy.pdf', page: 2 }}
                      isMock
                    />
                  </details>
                </div>
              </section>
            </aside>

            <section className="col-xl-8" id="chat-area" aria-labelledby="chat-heading">
              <div className="card chat-card">
                <div className="chat-card-header">
                  <div className="section-heading mb-0">
                    <span className="section-icon chat-icon"><MessageCircle size={19} /></span>
                    <div>
                      <h2 id="chat-heading" className="section-title">Ask QueryCare</h2>
                      <p className="section-subtitle mb-0">Your AI support assistant</p>
                    </div>
                  </div>
                  <span className="online-indicator"><span /> AI assistant</span>
                </div>

                <div className="chat-content" aria-live="polite">
                  {messages.length === 0 ? (
                    <div className="welcome-screen">
                      <div className="welcome-orbit" aria-hidden="true">
                        <span className="welcome-sparkle"><MessageCircle size={29} /></span>
                        <span className="orbit-dot orbit-dot-one" />
                        <span className="orbit-dot orbit-dot-two" />
                      </div>
                      <p className="welcome-overline">YOUR SUPPORT ASSISTANT</p>
                      <h3 className="welcome-title">Hello! How can I help?</h3>
                      <p className="welcome-text">
                        Ask a question about your uploaded documents. QueryCare will search their
                        content and show the sources used for its answer.
                      </p>
                      <div className="suggestions-area">
                        <p className="suggestions-label">START WITH A QUESTION</p>
                        <SuggestedQuestions onSelect={chooseSuggestion} disabled={isTyping} />
                      </div>
                    </div>
                  ) : (
                    <div className="conversation-view">
                      <div className="message-list">
                        {messages.map((message) => (
                          <ChatMessage key={message.id} message={message} />
                        ))}
                      </div>
                      {isTyping && (
                        <div
                          className="typing-row"
                          role="status"
                          aria-label="QueryCare is searching your documents"
                        >
                          <span className="typing-avatar"><MessageCircle size={15} /></span>
                          <span className="typing-bubble"><i /><i /><i /></span>
                          <span className="typing-label">Searching documents and preparing an answer…</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                      <div className="suggestions-area conversation-suggestions">
                        <p className="suggestions-label">TRY ANOTHER QUESTION</p>
                        <SuggestedQuestions onSelect={chooseSuggestion} disabled={isTyping} />
                      </div>
                    </div>
                  )}
                  {messages.length === 0 && isTyping && (
                    <div
                      className="typing-row welcome-typing"
                      role="status"
                      aria-label="QueryCare is searching your documents"
                    >
                      <span className="typing-avatar"><MessageCircle size={15} /></span>
                      <span className="typing-bubble"><i /><i /><i /></span>
                      <span className="typing-label">Searching documents and preparing an answer…</span>
                    </div>
                  )}
                </div>

                <form className="chat-composer" onSubmit={handleSubmit}>
                  <label className="visually-hidden" htmlFor="question-input">
                    Type your support question
                  </label>
                  <textarea
                    ref={inputRef}
                    id="question-input"
                    className="form-control chat-input"
                    placeholder="Ask anything about your customer policy…"
                    rows="1"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={handleQuestionKeyDown}
                    disabled={isTyping}
                  />
                  <button
                    className="btn send-button"
                    type="submit"
                    aria-label="Send question"
                    disabled={!question.trim() || isTyping}
                  >
                    <ArrowUp size={19} strokeWidth={2.4} />
                  </button>
                  <p className="composer-hint">Enter to send · Shift + Enter for a new line</p>
                </form>
              </div>
            </section>
          </div>

          <footer className="page-footer">
            <span>QueryCare customer support</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
