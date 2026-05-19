import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

base_dir = os.path.dirname(os.path.abspath(__file__))

pdf_path = os.path.join(base_dir, "..", "docs", "chefbot_livre_de_recettes_fr.pdf")

loader = PyPDFLoader(pdf_path)
documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=50 
)
chunks = text_splitter.split_documents(documents)

print(f"Nombre total de chunks créés : {len(chunks)}")
print(f"Exemple du premier chunk :\n{chunks[0].page_content}")

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

print("Transformation des chunks en vecteurs et création de FAISS...")
db = FAISS.from_documents(chunks, embeddings)

db.save_local("faiss_index")
print("Base vectorielle FAISS sauvegardée avec succès dans le dossier 'faiss_index' !")

new_db = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

query = "Je cherche une recette de dessert rapide ou de gâteau"

print(f"Recherche pour : '{query}'")
docs = new_db.similarity_search(query, k=3)

for i, doc in enumerate(docs):
    print(f"\n[Résultat {i+1}] (Page {doc.metadata.get('page', 'inconnue')}) :")
    print(doc.page_content)