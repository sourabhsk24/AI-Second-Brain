from sentence_transformers import SentenceTransformer
import chromadb

# Load embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Connect to ChromaDB
client = chromadb.PersistentClient(path="../rag_db")

collection = client.get_collection(name="study_material")

# User query
query = input("Ask a question: ")

# Convert query to embedding
query_embedding = embedding_model.encode(query).tolist()

# Search similar chunks
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=3
)

# Print results
for i, doc in enumerate(results['documents'][0]):
    print(f"\n--- Result {i+1} ---\n")
    print(doc)