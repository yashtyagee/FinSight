from sentence_transformers import SentenceTransformer

# Initialize the embedding model
# Using the model specified by the user
model_name = "BAAI/bge-small-en-v1.5"
try:
    embedding_model = SentenceTransformer(model_name)
except Exception as e:
    print(f"Error loading embedding model: {e}")
    embedding_model = None

def get_embedding(text: str) -> list[float]:
    """Generates an embedding for the given text."""
    if not embedding_model:
        raise ValueError("Embedding model is not initialized.")
    
    # Generate the embedding. Output is a numpy array.
    embedding = embedding_model.encode(text)
    
    # Return as a pure list of floats for ChromaDB compatibility
    return embedding.tolist()