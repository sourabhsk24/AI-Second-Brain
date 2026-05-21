from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load PDF
pdf = PdfReader("../data/ml.pdf")

text = ""

for page in pdf.pages:
    text += page.extract_text()

# Split text into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

chunks = splitter.split_text(text)

# Print first 3 chunks
for i, chunk in enumerate(chunks[:3]):
    print(f"\n--- Chunk {i+1} ---\n")
    print(chunk)