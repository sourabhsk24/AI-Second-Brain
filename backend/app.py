from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import chromadb
from google import genai
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Gemini API
client_ai = genai.Client(
    api_key="AIzaSyAjlESzNSSMkAD5gqLaxTFdNcWU0f1ZR3g"
)

# Embedding model
embedding_model = SentenceTransformer(
    'all-MiniLM-L6-v2'
)

# ChromaDB connection
client_db = chromadb.PersistentClient(
    path="../rag_db"
)

collection = client_db.get_collection(
    name="study_material"
)

@app.route('/chat', methods=['POST'])
def chat():

    data = request.json
    query = data['message']

    # Convert query to embedding
    query_embedding = embedding_model.encode(
        query
    ).tolist()

    # Search relevant chunks
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3
    )

    # Combine context
    context = "\n".join(
        results['documents'][0]
    )

    # Prompt
    prompt = f"""
    Answer the question only from the context below.

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

    return jsonify({
        "answer": response.text
    })

if __name__ == '__main__':
    app.run(debug=True)