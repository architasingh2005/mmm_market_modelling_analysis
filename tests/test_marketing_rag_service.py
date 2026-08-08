"""
Standalone integration test for MarketingRAGService using real Pinecone and Mistral AI services.
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.rag.marketing_rag_service import MarketingRAGService


def run_tests():
    passed = 0
    failed = 0
    total = 6

    def record_result(name, action):
        nonlocal passed, failed
        try:
            action()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}")
            failed += 1

    # TEST 1: Initialize MarketingRAGService
    service = None
    def test1():
        nonlocal service
        service = MarketingRAGService()
        if service is None or service.query_engine is None or service.prompt_builder is None or service.llm_client is None:
            raise AssertionError("MarketingRAGService failed to initialize dependencies.")
    record_result("Service initialized", test1)

    # TEST 2: Marketing question
    ans1 = ""
    q1 = "What improved during Q2 marketing performance?"
    def test2():
        nonlocal ans1
        res = service.ask(q1)
        ans1 = res["answer"] if isinstance(res, dict) else res
        if not isinstance(ans1, str):
            raise AssertionError(f"Expected string return type, got {type(ans1)}")
        if not ans1.strip():
            raise AssertionError("Returned answer is empty.")
    record_result("Marketing question", test2)

    # TEST 3: Second question
    ans2 = ""
    q2 = "What is the sales forecast for next quarter?"
    def test3():
        nonlocal ans2
        res = service.ask(q2)
        ans2 = res["answer"] if isinstance(res, dict) else res
        if not isinstance(ans2, str):
            raise AssertionError(f"Expected string return type, got {type(ans2)}")
        if not ans2.strip():
            raise AssertionError("Returned answer is empty.")
    record_result("Second question", test3)

    # TEST 4: Unknown question
    ans4 = ""
    q4 = "Who won the FIFA World Cup in 2018?"
    def test4():
        nonlocal ans4
        res = service.ask(q4)
        ans4 = res["answer"] if isinstance(res, dict) else res
        if not isinstance(ans4, str) or not ans4.strip():
            raise AssertionError("Returned answer for unknown question is empty or not a string.")
        lower_ans = ans4.lower()
        keywords = ["could not find", "not available", "unavailable", "not found", "no information", "cannot find", "marketing reports"]
        if not any(k in lower_ans for k in keywords):
            raise AssertionError(f"Response '{ans4}' did not indicate information unavailability.")
    record_result("Unknown question", test4)

    # TEST 5: Validation
    def test5():
        for invalid in [None, "", "     ", 123]:
            try:
                service.ask(invalid)
                raise AssertionError(f"Expected ValueError for ask({invalid})")
            except ValueError:
                pass
            except Exception as e:
                raise AssertionError(f"Expected ValueError for ask({invalid}), got {type(e)}")
    record_result("Validation", test5)

    # TEST 6: Return type
    def test6():
        if not isinstance(ans1, str) or not isinstance(ans2, str) or not isinstance(ans4, str):
            raise AssertionError("ask() did not consistently return str.")
    record_result("Return type", test6)

    # Summary
    print("\n=====================================")
    print(f"Total Tests : {total}")
    print(f"Passed      : {passed}")
    print(f"Failed      : {failed}")
    print("=====================================\n")

    if passed == total:
        print("MarketingRAGService integration tests completed successfully.")


if __name__ == "__main__":
    run_tests()
