from django.core.management.base import BaseCommand
from django.conf import settings
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os

class Command(BaseCommand):
    help = 'Ingest medical PDFs into the Vector Database'

    def handle(self, *args, **kwargs):
        docs_path = os.path.join(settings.BASE_DIR, 'medical_docs')
        if not os.path.exists(docs_path):
            os.makedirs(docs_path)
            self.stdout.write(self.style.WARNING(f"Created folder {docs_path}. Please put PDFs there and run again."))
            return

        self.stdout.write("Loading PDFs...")
        loader = DirectoryLoader(docs_path, glob="**/*.pdf", loader_cls=PyPDFLoader)
        documents = loader.load()
        
        if not documents:
            self.stdout.write(self.style.ERROR("No PDFs found in medical_docs/"))
            return

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        texts = text_splitter.split_documents(documents)

        persist_dir = os.path.join(settings.BASE_DIR, "chroma_db")
        embeddings = OpenAIEmbeddings()
        
        self.stdout.write("Creating Embeddings (this may cost OpenAI credits)...")
        vectordb = Chroma.from_documents(documents=texts, embedding=embeddings, persist_directory=persist_dir)
        vectordb.persist()
        
        self.stdout.write(self.style.SUCCESS('Successfully ingested documents into ChromaDB!'))