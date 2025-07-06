# Import required FastAPI components for building the API
import sys
import os
# Add the parent directory to the Python path to import aimakerspace
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
from typing import Optional, List, Dict, Union
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.embedding import EmbeddingModel
import tempfile
import shutil
import asyncio

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

class ChatMessagesRequest(BaseModel):
    messages: List[Dict[str, str]]  # List of {role, content} dicts
    model: Optional[str] = "gpt-4.1-mini"
    api_key: str

class PDFChatRequest(BaseModel):
    query: str
    api_key: str
    model: Optional[str] = "gpt-4.1-mini"
    top_k: Optional[int] = 3

# Global in-memory storage for the PDF index (prototype)
pdf_vector_db = None
pdf_chunks = None

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form(...)):
    """
    Accepts a PDF file upload, extracts and chunks its text, and builds an in-memory vector index.
    Returns the number of chunks indexed.
    """
    global pdf_vector_db, pdf_chunks
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        # Save uploaded file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        # Extract text from PDF
        loader = PDFLoader(tmp_path)
        texts = loader.load_documents()  # List of extracted text (usually one item)
        # Chunk the text with smaller chunks to avoid token limits
        splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = splitter.split_texts(texts)
        pdf_chunks = chunks  # Store for later retrieval
        # Build vector database asynchronously, using the provided api_key
        embedding_model = EmbeddingModel(api_key=api_key)
        vector_db = VectorDatabase(embedding_model)
        await vector_db.abuild_from_list(chunks)
        pdf_vector_db = vector_db
        # Clean up temp file
        os.remove(tmp_path)
        return {"status": "success", "chunks_indexed": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.post("/api/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts image file uploads (PNG, JPEG, HEIF, HEIC) for home repair Q&A.
    Returns success status and file information.
    """
    # Define supported image types
    supported_types = [
        "image/png",
        "image/jpeg", 
        "image/heif",
        "image/heic"
    ]
    
    if file.content_type not in supported_types:
        raise HTTPException(
            status_code=400, 
            detail="Only PNG, JPEG, HEIF, HEIC image files are supported."
        )
    
    try:
        # Save uploaded file to a temporary location
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        # For now, we'll just store the file info and return success
        # In a full implementation, you might want to:
        # 1. Process the image with computer vision
        # 2. Extract text or identify objects
        # 3. Store in a database for later retrieval
        
        # Clean up temp file
        os.remove(tmp_path)
        
        return {
            "status": "success", 
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "developer", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat-messages")
async def chat_messages(request: ChatMessagesRequest):
    try:
        client = OpenAI(api_key=request.api_key)
        # Inject the fixed system prompt as the first message
        system_prompt = (
            "You are a knowledgeable and helpful home repair assistant. "
            "You specialize in helping people fix things around the house, from simple DIY projects to more complex repairs. "
            "You provide clear, step-by-step instructions and safety advice. "
            "You are respectful, patient, and always prioritize safety. "
            "When users upload images of problems, you can help diagnose issues and suggest solutions. "
            "You recommend appropriate tools and materials, and always suggest calling a professional for complex electrical, plumbing, or structural issues. "
            "You are rooted in practical knowledge and best practices for home maintenance and repair."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            *request.messages
        ]
        async def generate():
            stream = client.chat.completions.create(
                model=request.model,
                messages=messages,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        return StreamingResponse(generate(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat-pdf")
async def chat_pdf(request: PDFChatRequest):
    """
    Accepts a user query, retrieves relevant chunks from the indexed PDF, and generates an answer using OpenAI and the retrieved context.
    """
    global pdf_vector_db, pdf_chunks
    if pdf_vector_db is None or pdf_chunks is None:
        raise HTTPException(status_code=400, detail="No PDF has been uploaded and indexed yet.")
    try:
        # Retrieve top-k relevant chunks
        top_k = request.top_k or 3
        results = pdf_vector_db.search_by_text(request.query, k=top_k, return_as_text=True)
        context = "\n---\n".join(results)
        # Compose prompt for OpenAI
        prompt = (
            f"You are a helpful assistant. Use the following PDF context to answer the user's question.\n"
            f"Context:\n{context}\n\nQuestion: {request.query}\nAnswer:"
        )
        client = OpenAI(api_key=request.api_key)
        # Streaming response
        async def generate():
            stream = client.chat.completions.create(
                model=request.model,
                messages=[{"role": "system", "content": prompt}],
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        return StreamingResponse(generate(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to chat with PDF: {str(e)}")

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
