import sys
import os

# Current file directory (scripts folder)
current_dir = os.path.dirname(__file__)
# backend folder path (parent of scripts)
backend_dir = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.append(backend_dir)

from finai.data_indexer import index_all_invoices

if __name__ == "__main__":
    index_all_invoices()