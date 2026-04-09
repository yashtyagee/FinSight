import chromadb
import os

# Initialize ChromaDB Client
# Create DB in the backend directory
db_path = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')
chroma_client = chromadb.PersistentClient(path=db_path)

# Name of the collection
COLLECTION_NAME = "invoices"

def get_or_create_collection():
    return chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"} # Use cosine similarity
    )

def add_documents(ids: list[str], documents: list[str], metadatas: list[dict], embeddings: list[list[float]]):
    """Adds documents and their embeddings to the vector store."""
    collection = get_or_create_collection()
    
    # ChromaDB accepts batches, we're adding them here
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings
    )

def query_documents(query_embeddings: list[float], n_results: int = 5):
    """Queries the vector store for the closest match."""
    collection = get_or_create_collection()
    results = collection.query(
        query_embeddings=[query_embeddings],
        n_results=n_results
    )
    return results