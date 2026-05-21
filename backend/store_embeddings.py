from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb

# Load PDF
pdf = PdfReader("../data/ml.pdf")

text = ""

for page in pdf.pages:
    text += page.extract_text()

# Split text
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

chunks = splitter.split_text(text)

# Load embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Create embeddings
embeddings = embedding_model.encode(chunks)

# Create ChromaDB client
client = chromadb.PersistentClient(path="../rag_db")

collection = client.get_or_create_collection(name="study_material")

# Store chunks + embeddings
for i, chunk in enumerate(chunks):
    collection.add(
        documents=[chunk],
        embeddings=[embeddings[i].tolist()],
        ids=[str(i)]
    )

print("Embeddings stored successfully!")