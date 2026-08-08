"""
MarketingRAGService Module

Orchestrates the end-to-end RAG workflow for marketing analytics queries.
Delegates retrieval to QueryEngine, prompt formatting to PromptBuilder,
and response generation to LLMClient.
"""

import logging
from typing import Any, Optional, Dict, List

from src.rag.llm_client import LLMClient
from src.rag.prompt_builder import PromptBuilder
from src.rag.query_engine import QueryEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MarketingRAGService:
    """
    Main entry point for answering user questions in the Marketing RAG pipeline.
    """

    def __init__(
        self,
        query_engine: Optional[QueryEngine] = None,
        prompt_builder: Optional[PromptBuilder] = None,
        llm_client: Optional[LLMClient] = None,
    ):
        """
        Initialize MarketingRAGService with optional dependency injection.

        Args:
            query_engine (Optional[QueryEngine]): Custom QueryEngine instance.
            prompt_builder (Optional[PromptBuilder]): Custom PromptBuilder instance.
            llm_client (Optional[LLMClient]): Custom LLMClient instance.
        """
        try:
            self.query_engine = query_engine or QueryEngine()
            self.prompt_builder = prompt_builder or PromptBuilder()
            self.llm_client = llm_client or LLMClient()
            logger.info("MarketingRAGService initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize MarketingRAGService: {e}")
            raise RuntimeError(f"Initialization error: {e}")

    def _validate_question(self, question: Any) -> str:
        """
        Validate that user question is a non-empty string.

        Args:
            question (Any): Question to validate.

        Returns:
            str: Stripped question string.

        Raises:
            ValueError: If question is None, non-string, or empty/whitespace.
        """
        if question is None:
            raise ValueError("Question cannot be None.")
        if not isinstance(question, str):
            raise ValueError("Question must be a string.")
        if not question.strip():
            raise ValueError("Question cannot be empty.")
        return question.strip()

    def ask(
        self,
        question: str,
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None,
        documents_override: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """
        Answer a user question by orchestrating QueryEngine, PromptBuilder, and LLMClient.

        Args:
            question (str): The user's question.
            top_k (int, optional): Number of documents to retrieve. Defaults to 5.
            filter_dict (Optional[Dict]): Metadata filter for vector search.
            documents_override (Optional[List]): Pre-supplied documents/chunks.

        Returns:
            Dict[str, Any]: Answer text, retrieved count, and context documents.

        Raises:
            ValueError: If question validation fails.
            RuntimeError: If retrieval or generation fails.
        """
        # Step 1: Validate question
        cleaned_question = self._validate_question(question)
        logger.info(f"Processing question: '{cleaned_question}'")

        # Step 2: Retrieve relevant documents using QueryEngine or documents_override
        if documents_override is not None:
            documents = documents_override
            logger.info(f"Using {len(documents)} pre-supplied document chunks.")
        else:
            logger.info(f"Retrieving documents via QueryEngine with filter={filter_dict}.")
            documents = self.query_engine.search(cleaned_question, top_k=top_k, filter_dict=filter_dict)

        logger.info(f"Retrieved {len(documents)} document chunk(s).")

        # Step 3: Build prompt using PromptBuilder
        logger.info("Building RAG prompt via PromptBuilder.")
        prompt = self.prompt_builder.build_rag_prompt(cleaned_question, documents)

        # Step 4 & 5: Send prompt to LLMClient and return answer
        logger.info("Generating response via LLMClient.")
        answer = self.llm_client.generate(prompt)

        return {
            "answer": answer,
            "retrieved_documents": len(documents),
            "documents": documents,
        }
