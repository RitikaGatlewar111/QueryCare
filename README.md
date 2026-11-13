# QueryCare – RAG-Based Customer Support Chatbot

QueryCare is an AI-powered document question-answering chatbot built using the **Retrieval-Augmented Generation (RAG)** approach. It allows users to upload PDF documents and ask questions based on their content.

The application extracts text from uploaded PDFs, divides it into smaller chunks, generates embeddings, and retrieves relevant information using semantic similarity. Google Gemini then uses the retrieved document context to generate answers with source references.

## Features

- **PDF Upload:** Upload PDF documents through the React interface.
- **PDF Text Extraction:** Extract readable text from uploaded documents.
- **Text Chunking:** Divide extracted text into smaller, overlapping chunks.
- **Local Embeddings:** Generate text embeddings using `all-MiniLM-L6-v2`.
- **Semantic Search:** Retrieve relevant document chunks using cosine similarity.
- **AI-Powered Answers:** Generate contextual answers using the Google Gemini API.
- **Source References:** Display source filenames and available page numbers with answers.
- **Error Handling:** Handle invalid uploads, empty questions, and API errors.
- **Interactive Chat Interface:** Ask questions and view AI-generated responses through a simple chat interface.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Embedding Model | Xenova/all-MiniLM-L6-v2 |
| AI Model | Google Gemini |
| PDF Processing | PDF text extraction library |
| Similarity Search | Cosine Similarity |
| Data Storage | In-memory storage |
| API Testing | Postman |
| Development Tools | VS Code, Git, GitHub |

## How It Works

QueryCare follows a simple RAG pipeline:

1. **PDF Upload:** The user uploads a PDF document.
2. **Text Extraction:** The backend extracts text from the PDF.
3. **Text Chunking:** Extracted text is divided into smaller chunks with overlapping content.
4. **Embedding Generation:** Each chunk is converted into a numerical vector using the MiniLM embedding model.
5. **In-Memory Storage:** Text chunks, metadata, and embeddings are stored in backend memory.
6. **Question Processing:** The user's question is converted into an embedding using the same model.
7. **Semantic Retrieval:** Cosine similarity is used to identify the most relevant document chunks.
8. **Answer Generation:** Retrieved chunks are sent as context to Google Gemini.
9. **Source References:** The generated answer is displayed along with available document filename and page references.

## Project Structure

```text
QueryCare/
│
├── backend/
│   ├── app.js
│   ├── server.js
│   ├── .env.example
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── utils/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.css
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
```

*Note: The structure above is illustrative. Adjust it to match the actual folders and files in your repository.*

## Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project:

```bash
cd QueryCare
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder.

Add the following configuration:

```env
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_configured_gemini_model
```

Replace the API key and model with your own configuration.

**Important:** Never upload your actual `.env` file or API key to GitHub.

Start the backend using the development script configured in your project.

### 3. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder if required:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check backend server status |
| POST | `/api/documents/upload` | Upload and process a PDF |
| POST | `/api/retrieval/search` | Retrieve relevant document chunks |
| POST | `/api/chat` | Generate an answer using retrieved context |

### Example Chat Request

**Endpoint:**

```http
POST /api/chat
```

**Request Body:**

```json
{
  "question": "Which technologies are mentioned in the document?"
}
```

The response contains the generated answer, source references, model information, and retrieval count.

## Example Use Case

Upload a job description PDF and ask:

```text
Which programming languages are mentioned in the document?
```

QueryCare retrieves relevant content from the uploaded PDF and generates an answer using the retrieved context.

## Current Limitations

- Uploaded documents and embeddings are stored in memory only.
- Document data is cleared when the backend server restarts.
- Documents need to be uploaded again after a backend restart.
- Scanned PDFs and image-only documents are not supported because OCR is not implemented.
- Retrieval currently uses a simple cosine similarity approach with a limited number of relevant chunks.
- The application does not use a permanent database or external vector database.

## Future Improvements

- Support multiple PDF documents simultaneously.
- Add persistent document and embedding storage.
- Implement OCR for scanned PDF documents.
- Add document management features.
- Improve retrieval accuracy and ranking.
- Add user authentication and document-specific access.

## Learning Outcomes

Through this project, I explored and implemented:

- Retrieval-Augmented Generation (RAG).
- PDF text extraction and processing.
- Text chunking and overlapping techniques.
- Semantic search and vector embeddings.
- Cosine similarity.
- Integration of AI APIs with a Node.js backend.
- React frontend and Express REST API integration.
- Source-based answer generation.

## Author

**Ritika Gatlewar**

B.Tech – Computer Science and Engineering (2026)

---

