from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from finai.rag_pipeline import generate_answer
from finai.embeddings import get_embedding
from finai.vector_store import add_documents

app = FastAPI(title="FinAi API")

# Setup CORS to allow backend/frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str

class InvoiceData(BaseModel):
    invoice_number: str
    vendor: str = "Unknown"
    amount: float = 0.0
    date: str = "Unknown"
    category: str = "Unknown"
    
@app.post("/finai/chat", response_model=QueryResponse)
def finai_chat(request: QueryRequest):
    """
    Endpoint that receives a natural language query about finances/invoices
    and returns a generated answer from the FinAi system.
    """
    answer = generate_answer(request.query)
    return QueryResponse(answer=answer)

@app.post("/finai/index")
def index_new_invoice(invoice: InvoiceData):
    """
    Endpoint to receive newly processed invoices from FinSight and automatically add them to the vector store.
    """
    text = f"Invoice {invoice.invoice_number} from {invoice.vendor} in category {invoice.category} for amount {invoice.amount} on {invoice.date}."
    
    # Generate embedding
    embedding = get_embedding(text)
    
    # Store in ChromaDB
    # Convert Pydantic model to dictionary for metadata
    metadata = invoice.model_dump()
    
    add_documents(
        ids=[invoice.invoice_number],
        documents=[text],
        metadatas=[metadata],
        embeddings=[embedding]
    )
    
    return {"status": "success", "message": f"Invoice {invoice.invoice_number} successfully indexed."}