# Cuisine PDFs

Place the official cuisine PDF corpus here.

This folder is the source input for the local RAG pipeline. Keep the files stable and versioned if the corpus is meant to be shared with the team.

After adding or updating PDFs, rebuild the local index with:

```bash
python scripts/bootstrap_backend.py
python scripts/rag_demo.py --skip-llm
```