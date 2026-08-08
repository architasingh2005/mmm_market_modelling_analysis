"""
Retriever Module

Responsible for semantic document retrieval from Pinecone vector database.
"""

import logging
from typing import List, Dict, Any, Optional

from langchain_core.documents import Document

from src.embeddings.embedding_manager import EmbeddingManager
from src.vectorstore.pinecone_manager import PineconeManager

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Retriever:
    """
    Retriever class for querying the vector database.
    """

    def __init__(self):
        """
        Initializes the retriever with the EmbeddingManager and PineconeManager.
        """
        try:
            self.embedding_manager = EmbeddingManager()
            self.pinecone_manager = PineconeManager()
            self.index = self.pinecone_manager.get_index()
            logger.info("Retriever initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Retriever: {e}")
            raise RuntimeError(f"Initialization error: {e}")

    def search(self, query: str, top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[Document]:
        """
        Search for the most relevant documents in Pinecone based on the query.

        Args:
            query (str): The search query string.
            top_k (int, optional): The number of top results to return. Defaults to 5.
            filter_dict (Dict, optional): Metadata filter for Pinecone vector search. Defaults to None.

        Returns:
            List[Document]: A list of LangChain Document objects containing the relevant chunks.

        Raises:
            ValueError: If the query is empty or top_k is invalid.
            RuntimeError: If embedding generation or Pinecone search fails.
        """
        # 1. Validate query and top_k
        if not query or not query.strip():
            raise ValueError("The search query cannot be empty.")
        if top_k <= 0:
            raise ValueError("top_k must be a positive integer.")

        logger.info(f"Searching... Query: '{query}', top_k: {top_k}, filter: {filter_dict}")

        # 2. Generate query embedding
        try:
            query_embedding = self.embedding_manager.embed_query(query)
            logger.info("Embedding generated")
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise RuntimeError(f"Embedding failure: {e}")

        # 3. Search Pinecone
        try:
            query_kwargs = {
                "vector": query_embedding,
                "top_k": top_k,
                "include_metadata": True,
            }
            if filter_dict:
                query_kwargs["filter"] = filter_dict
            response = self.index.query(**query_kwargs)
        except Exception as e:
            logger.error(f"Pinecone search failed: {e}")
            raise RuntimeError(f"Pinecone connection/search failure: {e}")

        # 4. Convert results into LangChain Document objects
        matches = response.get("matches", [])
        retrieved_documents = []

        for match in matches:
            metadata = match.get("metadata", {})
            
            # The page_content should come from metadata["text"]
            # We use pop() to remove it from metadata so it's not duplicated
            page_content = metadata.pop("text", "")
            
            doc = Document(
                page_content=page_content,
                metadata=metadata
            )
            retrieved_documents.append(doc)

        logger.info(f"Retrieved {len(retrieved_documents)} documents")
        
        # 5. Return List[Document]
        return retrieved_documents
