"""
QueryEngine Module

Serves as the dedicated retrieval layer for the RAG pipeline.
Responsible only for retrieving relevant documents from the vector database.
"""

import logging
from typing import Any, List, Tuple, Optional, Dict

from langchain_core.documents import Document
from src.retrieval.retriever import Retriever

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QueryEngine:
    """
    QueryEngine serves as the retrieval layer for the RAG pipeline.
    
    It delegates document retrieval to Retriever and does not generate
    prompts, call LLMs, summarize content, or alter retrieved documents.
    """

    def __init__(self, retriever: Optional[Retriever] = None):
        """
        Initializes QueryEngine with a Retriever instance.

        Args:
            retriever (Retriever, optional): Custom Retriever instance. Defaults to None.
        """
        try:
            self.retriever = retriever or Retriever()
            logger.info("QueryEngine initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize QueryEngine: {e}")
            raise RuntimeError(f"Initialization error: {e}")

    def _validate_query(self, query: Any) -> str:
        """
        Validate that the input query is a non-empty string.

        Args:
            query (Any): Query string to validate.

        Returns:
            str: Stripped query string.

        Raises:
            ValueError: If query is None, non-string, or empty/whitespace-only.
        """
        if query is None:
            raise ValueError("Query cannot be None.")
        if not isinstance(query, str):
            raise ValueError("Query must be a string.")
        if not query.strip():
            raise ValueError("Query cannot be an empty string.")
        return query.strip()

    def search(self, query: str, top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[Document]:
        """
        Retrieve relevant documents for a given query.

        Args:
            query (str): Search query string.
            top_k (int, optional): Number of top results to retrieve. Defaults to 5.
            filter_dict (Dict, optional): Metadata filter dictionary for vector search. Defaults to None.

        Returns:
            List[Document]: List of LangChain Document objects.

        Raises:
            ValueError: If query is invalid.
        """
        self._validate_query(query)
        results = self.retriever.search(query, top_k=top_k, filter_dict=filter_dict)
        return results if results is not None else []

    def search_with_scores(self, query: str, top_k: int = 5) -> List[Tuple[Document, float]]:
        """
        Retrieve relevant documents along with their similarity scores.

        Args:
            query (str): Search query string.
            top_k (int, optional): Number of top results to retrieve. Defaults to 5.

        Returns:
            List[Tuple[Document, float]]: List of (Document, score) tuples.

        Raises:
            ValueError: If query is invalid.
        """
        self._validate_query(query)

        # 1. Reuse existing Retriever implementation if search_with_scores is supported
        if hasattr(self.retriever, "search_with_scores") and callable(getattr(self.retriever, "search_with_scores")):
            results = self.retriever.search_with_scores(query, top_k=top_k)
            return results if results is not None else []

        # 2. Fetch scores from Pinecone index if retriever exposes index & embedding_manager
        if hasattr(self.retriever, "index") and hasattr(self.retriever, "embedding_manager"):
            try:
                query_embedding = self.retriever.embedding_manager.embed_query(query)
                response = self.retriever.index.query(
                    vector=query_embedding,
                    top_k=top_k,
                    include_metadata=True
                )
                matches = response.get("matches", []) if isinstance(response, dict) else getattr(response, "matches", [])

                results = []
                for match in matches:
                    if isinstance(match, dict):
                        metadata = match.get("metadata", {}).copy()
                        score = float(match.get("score", 0.0))
                    else:
                        metadata = getattr(match, "metadata", {}).copy()
                        score = float(getattr(match, "score", 0.0))

                    page_content = metadata.pop("text", "")
                    doc = Document(page_content=page_content, metadata=metadata)
                    results.append((doc, score))
                return results
            except Exception as e:
                logger.error(f"Error querying scores via Pinecone index: {e}")

        # 3. Fallback using search()
        docs = self.search(query, top_k=top_k)
        return [(doc, float(getattr(doc, "metadata", {}).get("score", 0.0))) for doc in docs]

    def count_results(self, query: str, top_k: int = 5) -> int:
        """
        Return the number of retrieved documents for a given query.

        Args:
            query (str): Search query string.
            top_k (int, optional): Number of top results to retrieve. Defaults to 5.

        Returns:
            int: Number of retrieved documents.

        Raises:
            ValueError: If query is invalid.
        """
        self._validate_query(query)
        docs = self.search(query, top_k=top_k)
        return len(docs)
