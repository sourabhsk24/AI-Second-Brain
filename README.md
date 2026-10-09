\# 🧠 AI Second Brain



An AI-powered personal knowledge assistant that helps users upload documents, retrieve information, and ask questions using natural language.



\## 🚀 Overview



AI Second Brain is a document-based AI assistant designed to make personal knowledge easier to organize and access. Users can upload PDF documents and ask questions about their contents through an interactive chat interface.



The project combines a React frontend with a Flask backend and Retrieval-Augmented Generation (RAG) technologies to provide document-grounded responses.



\## ✨ Features



\- 📄 PDF document upload and processing

\- 💬 Interactive AI chat interface

\- 🔎 Document retrieval for question answering

\- 🧠 Embedding-based semantic search

\- 🤖 Google Gemini integration for AI-generated responses

\- ⚛️ React-based frontend

\- 🐍 Flask backend API

\- 🗃️ ChromaDB vector storage



\## 🛠️ Tech Stack



| Component | Technology |

|---|---|

| Frontend | React, Vite, JavaScript, CSS |

| Backend | Python, Flask |

| AI model | Google Gemini |

| Vector database | ChromaDB |

| Embeddings | Sentence Transformers |

| PDF processing | PyPDF2 |

| Text splitting | LangChain Text Splitters |



\## 📁 Project Structure



```text

AI-Second-Brain/

├── backend/

│   └── app.py

├── frontend-react/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── index.css

│   │   └── main.jsx

│   ├── package.json

│   └── vite.config.js

├── .gitignore

├── package.json

├── package-lock.json

└── README.md

```



\## ⚙️ Getting Started



\### Prerequisites



\- Python 3.12 or compatible version

\- Node.js and npm

\- Google Gemini API key



\### 1. Clone the repository



```bash

git clone https://github.com/sourabhsk24/AI-Second-Brain.git

cd AI-Second-Brain

```



\### 2. Configure the backend



Create and activate a Python virtual environment:



\*\*Windows PowerShell\*\*



```powershell

python -m venv venv

.\\venv\\Scripts\\Activate.ps1

```



Install the required backend dependencies. If a `requirements.txt` file is available in the backend or project root, use its actual location:



```powershell

pip install -r backend/requirements.txt

```



Create a `.env` file in the project root:



```env

GOOGLE\_API\_KEY=your\_gemini\_api\_key

```



Replace the placeholder with your own API key. Never commit the `.env` file to GitHub.



\### 3. Start the backend



Run the Flask application using the correct path for your project:



```powershell

python backend/app.py

```



\### 4. Start the frontend



Open another terminal:



```powershell

cd frontend-react

npm install

npm run dev

```



Open the local URL printed by Vite in your terminal.



\## 🔐 Security



\- Store API keys in environment variables.

\- Keep `.env` out of version control.

\- Never publish private credentials in source code or commit history.



\## 🎯 Project Objective



To build an AI-powered personal knowledge assistant that enables users to interact with their documents, find relevant information quickly, and improve information retrieval through natural language queries.



\## 👨‍💻 Author



\*\*SOURABH KAMBLE\*\*



GitHub: \[@sourabhsk24](https://github.com/sourabhsk24)



\## 📄 License



A license has not yet been specified.

