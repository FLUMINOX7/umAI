from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from huggingface_hub import HfApi
import faiss, numpy as np, pickle, os

#Extraction texte des PDF et découpage en chunks
def extract_text(pdf_folder):
    chunks_data = []
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    for filename in os.listdir(pdf_folder):
        if filename.endswith(".pdf"):
            reader = PdfReader(f"{pdf_folder}/{filename}")
            text = " ".join(page.extract_text() for page in reader.pages)
            chunks = splitter.split_text(text)
            for i, chunk in enumerate(chunks):
                chunks_data.append({"source": filename, "chunk_index": i, "content": chunk})
    return chunks_data

# Génération embeddings et index FAISS
def build_index(chunks_data):
    model = SentenceTransformer("all-MiniLM-L6-v2")
    texts = [c["content"] for c in chunks_data]
    embeddings = model.encode(texts, show_progress_bar=True)
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings))
    return index, chunks_data

# Sauvegarde 
index, chunks = build_index(extract_text("./pdfs"))
faiss.write_index(index, "faiss_index.bin")
with open("chunks_metadata.pkl", "wb") as f:
    pickle.dump(chunks, f)

# Upload sur Hugging Face
api = HfApi()
api.upload_file(path_or_fileobj="faiss_index.bin",
                path_in_repo="faiss_index.bin",
                repo_id="ton-username/chatbot-recettes",
                repo_type="dataset")
api.upload_file(path_or_fileobj="chunks_metadata.pkl",
                path_in_repo="chunks_metadata.pkl",
                repo_id="ton-username/chatbot-recettes",
                repo_type="dataset")