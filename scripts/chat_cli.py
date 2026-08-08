"""
Command-line Chat Interface for the RAG System

Run:
    python scripts/chat_cli.py
or
    python -m scripts.chat_cli
"""

import logging
import os
import sys
import time
from pathlib import Path

import colorama
from colorama import Fore, Style

# Initialize colorama
colorama.init(autoreset=True)

# Determine the project root dynamically
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

# Suppress verbose HTTP logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

from src.rag.marketing_rag_service import MarketingRAGService


def print_banner() -> None:
    print("====================================================")
    print("Marketing Analytics AI Assistant")
    print("\nType your question below.\n")
    print("Commands\n")
    print("exit")
    print("quit")
    print("clear")
    print("help")
    print("====================================================")


def print_help() -> None:
    print("\nCommands:")
    print("exit, quit  - Terminate the application")
    print("clear       - Clear the terminal screen")
    print("help        - Display this help message")


def clear_screen() -> None:
    os.system('cls' if os.name == 'nt' else 'clear')


def ask_question() -> str:
    try:
        user_input = input(f"\n{Fore.GREEN}You > {Style.RESET_ALL}").strip()
        return user_input
    except (KeyboardInterrupt, EOFError):
        return "exit"


def display_answer(question: str, answer: str, elapsed_time: float) -> None:
    print("----------------------------------------------------")
    print("Question")
    print(f"{question}")
    print("----------------------------------------------------")
    print("Answer")
    print(f"{answer}")
    print("----------------------------------------------------")
    print("Response Time")
    print(f"{elapsed_time:.2f} seconds")
    print("====================================================")


def main() -> None:
    print("Initializing RAG Service...")
    try:
        service = MarketingRAGService()
        print("Ready.")
    except Exception as e:
        print(f"\n{Fore.RED}Error{Style.RESET_ALL}")
        if "MISTRAL_API_KEY" in str(e):
            print("Missing API key. Please set MISTRAL_API_KEY in your .env file.")
        else:
            print(f"Service initialization failed: {e}")
        sys.exit(1)

    print_banner()

    while True:
        question = ask_question()
        
        if not question:
            continue
            
        lower_q = question.lower()
        if lower_q in ['exit', 'quit']:
            break
        elif lower_q == 'clear':
            clear_screen()
            print_banner()
            continue
        elif lower_q == 'help':
            print_help()
            continue

        try:
            start_time = time.time()
            res = service.ask(question)
            answer = res["answer"] if isinstance(res, dict) else res
            end_time = time.time()
            
            elapsed = end_time - start_time
            display_answer(question, answer, elapsed)
            
        except Exception as e:
            error_str = str(e)
            print(f"\n{Fore.RED}Error{Style.RESET_ALL}")
            
            if "429" in error_str or "Rate limit" in error_str:
                print("Rate limit exceeded.")
                print("Please wait a few seconds and try again.")
            elif "Mistral" in error_str:
                print("Mistral API failure. Please check your connection or API key limits.")
            elif "Pinecone" in error_str:
                print("Pinecone failure. Please check your vector database connection.")
            elif "Retriever" in error_str or "QueryEngine" in error_str:
                print("Retriever failure. Could not fetch documents from the vector database.")
            else:
                print("An unexpected error occurred:")
                print(error_str)
                
            print("====================================================")


if __name__ == "__main__":
    main()
