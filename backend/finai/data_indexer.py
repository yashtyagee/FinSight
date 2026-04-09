import json
import os
from .embeddings import get_embedding
from .vector_store import add_documents, get_or_create_collection

def index_all_invoices():
    # Path to the data file
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'invoices_structured.json')
    
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}")
        return

    with open(data_path, 'r') as f:
        invoices = json.load(f)

    if not invoices:
        print("No invoices found to index.")
        return

    # Check which invoices are already indexed
    collection = get_or_create_collection()
    existing_items = collection.get()
    existing_ids = set(existing_items['ids'])

    ids = []
    documents = []
    metadatas = []
    embeddings = []

    for invoice in invoices:
        invoice_id = invoice.get('invoice_number')
        
        # Skip if already exists
        if invoice_id in existing_ids:
            continue
            
        vendor = invoice.get('vendor', 'Unknown')
        amount = invoice.get('amount', 0)
        date = invoice.get('date', 'Unknown')
        category = invoice.get('category', 'Unknown')

        # Create a descriptive text for the embedding model to understand
        text = f"Invoice {invoice_id} from {vendor} in category {category} for amount {amount} on {date}."
        
        # Generate embedding
        embedding = get_embedding(text)

        ids.append(invoice_id)
        documents.append(text)
        metadatas.append(invoice) # Store full raw metadata to be used in context
        embeddings.append(embedding)

    if ids:
        add_documents(ids, documents, metadatas, embeddings)
        print(f"Successfully indexed {len(ids)} new invoices.")
    else:
        print("No new invoices to index.")