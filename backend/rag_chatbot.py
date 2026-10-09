from sentence_transformers import SentenceTransformer
import chromadb
from google import genai

# Gemini API setup
client_ai = genai.Client(api_key="AIzaSyAjlESzNSSMkAD5gqLaxTFdNcWU0f1ZR3g")

# Embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# ChromaDB connection
client_db = chromadb.PersistentClient(path="../rag_db")

collection = client_db.get_collection(name="study_material")

# User question
query = input("Ask your question: ")

# Convert question to embedding
query_embedding = embedding_model.encode(query).tolist()

# Search relevant chunks
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=3
)


# Combine retrieved chunks
context = "\n".join(results['documents'][0])

# Create prompt
prompt = f"""
Answer the question based only on the context below.

Context:
{context}

Question:
{query}
"""

# Gemini response
response = client_ai.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt
)

# Print final answer
print("\nAI Answer:\n")
print(response.text)