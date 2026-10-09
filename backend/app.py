import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS

from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

import chromadb
from google import genai


# ---------------- FLASK APP ----------------

app = Flask(__name__)
CORS(app)


# ---------------- GEMINI ----------------

client_ai = genai.Client(
    api_key = os.getenv("GOOGLE_API_KEY")
)


# ---------------- EMBEDDING MODEL ----------------

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# ---------------- CHROMADB ----------------

client_db = chromadb.PersistentClient(
    path="../rag_db"
)

collection = client_db.get_or_create_collection(
    name="study_material"
)


# Latest uploaded PDF
latest_pdf = ""


# ---------------- CHAT ROUTE ----------------

@app.route("/chat", methods=["POST"])
def chat():

    global latest_pdf

    data = request.json

    user_question = data["message"]

    query_embedding = embedding_model.encode(
        user_question
    ).tolist()

    try:

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=5,
        )

        retrieved_docs = results["documents"][0]

        retrieved_sources = results["metadatas"][0]

        context_parts = []

        for doc, meta in zip(
            retrieved_docs,
            retrieved_sources
            ):

            context_parts.append(
                f"""
                Source:
                {meta['source']}

                Content:

                {doc}
            """
            )

            context = "\n\n".join(
                context_parts
            )

    except:

        context = ""

    # Prompt

    if context.strip():

        prompt = f"""
You are an AI study assistant.

Use the retrieved study material below.

If information comes from multiple PDFs,
combine the answer.

Mention PDF names when useful.

If answer does not exist,
say so clearly.

Context:
{context}

Question:
{user_question}
"""

    else:

        prompt = f"""
You are a helpful AI assistant.

User Question:
{user_question}
"""

    # Gemini Response

    try:

        response = client_ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.7,
                "max_output_tokens": 2048
            }
        )

        if hasattr(response, "text") and response.text:

            answer = response.text

        else:

            answer = "No response generated."

    except Exception as e:

        print("================================")
        print("Gemini Error:", repr(e))
        print("================================")

        answer = f"Gemini API Error: {repr(e)}"

    return jsonify({
        "answer": answer
    })


# ---------------- PDF UPLOAD ----------------

@app.route("/upload", methods=["POST"])
def upload_pdf():

    global latest_pdf

    file = request.files["file"]

    filepath = f"../data/{file.filename}"

    file.save(filepath)

    latest_pdf = file.filename

    # Read PDF

    reader = PdfReader(filepath)

    text = ""

    for page in reader.pages:

        extracted = page.extract_text()

        if extracted:

            text += extracted

    # Split

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.split_text(text)

    # Embeddings

    embeddings = embedding_model.encode(
        chunks
    ).tolist()

    # Store in Chroma

    for i, chunk in enumerate(chunks):

        collection.add(
            documents=[chunk],
            embeddings=[embeddings[i]],
            metadatas=[
                {
                    "source": file.filename
                }
            ],
            ids=[
                f"{file.filename}_{i}"
            ]
        )

    return jsonify({
        "message": "PDF uploaded successfully"
    })


# ---------------- ROOT ROUTE ----------------

@app.route("/")
def home():

    return jsonify({
        "status": "AI Second Brain Backend Running"
    })

@app.route("/pdfs", methods=["GET"])
def get_pdfs():

    results = collection.get(
        include=["metadatas"]
    )

    pdfs = list({

        meta["source"]

        for meta in results["metadatas"]

        if "source" in meta

    })

    return jsonify({
        "pdfs": pdfs
    })



# ---------------- RUN ----------------

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )