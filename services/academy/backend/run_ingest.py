from app.rag_chatbot.ingest import build_vector_index


if __name__ == "__main__":
    print("📚 Starting vector index build from PDFs...")
    build_vector_index()
    print("✅ Vector index successfully built and stored in ChromaDB.")
