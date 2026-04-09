from google import genai
import os
from .embeddings import get_embedding
from .vector_store import query_documents
from dotenv import load_dotenv, find_dotenv

# Load env variables
load_dotenv(find_dotenv())

# Initialize Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Error initializing Gemini client: {e}")
    client = None

def generate_answer(query: str) -> str:
    if not client:
        return "Error: Gemini client is not configured properly."
    
    # 1. Embed the user's natural language query
    query_embedding = get_embedding(query)
    
    # 2. Query the vector store for most relevant invoices (top 5)
    results = query_documents(query_embedding, n_results=5)
    
    # 3. Extract the metadata (JSON context) from the results
    context_data = []
    if results and results.get("metadatas") and len(results["metadatas"]) > 0:
        context_data = results["metadatas"][0]
        
    if not context_data:
        return "I couldn't find any relevant invoices to answer your query."
    
    # 4. Construct a prompt that contains the system instructions, context, and user query
    context_str = "\n".join([str(item) for item in context_data])
    
    prompt = f"""You are FinAi, an intelligent financial assistant for the 'FinSight' invoice processing system.
Your job is to answer user queries accurately based ONLY on the provided invoice data context. Do not make up any numbers.
If the context doesn't contain the answer, say "I don't have enough data to answer that."

INVOICE DATA CONTEXT:
{context_str}

USER QUERY:
{query}

ANSWER:"""

    # 5. Call the Gemini LLM
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return "Sorry, I encountered an error while trying to process your request."