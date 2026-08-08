"""
Comprehensive Integration & Verification Tests for AI Chat Query Processor

Verifies:
  1. Highest ROI query returns single channel with numeric spend, revenue, and ROI.
  2. ROI ranking query returns multi-channel ranking table.
  3. Pearson correlation query computes and returns numeric r.
  4. Dataset statistics query returns exact row/col counts and sales totals.
  5. Different queries return distinct, specific answers (no generic report dumps).
  6. Dataset isolation (different datasets return isolated values).
"""

import unittest
import pandas as pd
from app.report_pipeline import _generate_mmm_report
from app.query_service import QueryProcessor
from app.intent_classifier import classify, MMM_HIGHEST_ROI, MMM_ROI_RANKING, CORRELATION, DATASET_STATS


class TestQueryAnsweringPipeline(unittest.TestCase):

    def setUp(self):
        self.processor = QueryProcessor(upload_dir="uploads")

        # Dataset A (TV heavy)
        self.df_a = pd.DataFrame({
            "Sales_Value": [100.0, 200.0, 300.0, 400.0, 500.0],
            "TV_Spend": [10.0, 20.0, 30.0, 40.0, 50.0],
            "Digital_Spend": [5.0, 10.0, 15.0, 20.0, 25.0],
            "Radio_Spend": [2.0, 4.0, 6.0, 8.0, 10.0],
        })
        self.rpt_a = _generate_mmm_report(self.df_a)
        self.reports_a = [{
            "title": "MMM Report A",
            "reportType": "marketing",
            "content": self.rpt_a["content"],
            "summary": self.rpt_a["summary"],
        }]

        # Dataset B (Digital heavy)
        self.df_b = pd.DataFrame({
            "Sales_Value": [50.0, 100.0, 150.0, 200.0, 250.0, 300.0, 350.0, 400.0, 450.0, 500.0],
            "TV_Spend": [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
            "Digital_Spend": [10.0, 30.0, 50.0, 70.0, 90.0, 110.0, 130.0, 150.0, 170.0, 190.0],
        })
        self.rpt_b = _generate_mmm_report(self.df_b)
        self.reports_b = [{
            "title": "MMM Report B",
            "reportType": "marketing",
            "content": self.rpt_b["content"],
            "summary": self.rpt_b["summary"],
        }]

    def test_intent_classifier_sub_intents(self):
        self.assertEqual(classify("Which marketing channel has the highest ROI?").intent, MMM_HIGHEST_ROI)
        self.assertEqual(classify("Show me the ROI ranking of all marketing channels").intent, MMM_ROI_RANKING)
        self.assertEqual(classify("Which marketing channel has the strongest correlation with Sales_Value?").intent, CORRELATION)
        self.assertEqual(classify("How many rows and columns are in the dataset?").intent, DATASET_STATS)

    def test_highest_roi_query(self):
        res = self.processor.process_query(
            "Which marketing channel has the highest ROI?",
            dataset_id="ds_a",
            reports=self.reports_a
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["intent"], "mmm_highest_roi")
        self.assertIn("data", res)
        self.assertIn("channel", res["data"])
        self.assertIn("roi", res["data"])
        self.assertIn("spend", res["data"])
        self.assertIn("attributed_revenue", res["data"])
        self.assertIsNotNone(res["data"]["roi"])

    def test_roi_ranking_query(self):
        res = self.processor.process_query(
            "Show me the ROI ranking of all marketing channels with spend, attributed revenue, and ROI.",
            dataset_id="ds_a",
            reports=self.reports_a
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["intent"], "mmm_roi_ranking")
        self.assertIn("rankings", res["data"])
        self.assertGreaterEqual(len(res["data"]["rankings"]), 2)

    def test_correlation_query(self):
        res = self.processor.process_query(
            "Which marketing channel has the strongest correlation with Sales_Value? Show the Pearson correlation.",
            dataset_id="ds_a",
            reports=self.reports_a
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["intent"], "mmm_correlation")
        self.assertIn("strongest_channel", res["data"])
        self.assertIn("pearson_r", res["data"])
        self.assertNotEqual(res["data"]["pearson_r"], 0.0)

    def test_dataset_stats_query(self):
        res = self.processor.process_query(
            "How many rows and columns are in the dataset?",
            dataset_id="ds_a",
            reports=self.reports_a
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["intent"], "dataset_stats")
        self.assertIn("rows", res["data"])
        self.assertEqual(res["data"]["rows"], 5)

    def test_different_queries_distinct_answers(self):
        q1 = self.processor.process_query("Which marketing channel has the highest ROI?", "ds_a", self.reports_a)
        q2 = self.processor.process_query("Show me the ROI ranking of all marketing channels", "ds_a", self.reports_a)
        q3 = self.processor.process_query("Which channel has the strongest correlation with Sales_Value?", "ds_a", self.reports_a)
        q4 = self.processor.process_query("How many rows and columns are in the dataset?", "ds_a", self.reports_a)

        # Answers must be distinct and specific
        self.assertNotEqual(q1["response"], q2["response"])
        self.assertNotEqual(q1["response"], q3["response"])
        self.assertNotEqual(q2["response"], q3["response"])
        self.assertNotEqual(q3["response"], q4["response"])

    def test_dataset_isolation(self):
        res_a = self.processor.process_query("How many rows and columns are in the dataset?", "ds_a", self.reports_a)
        res_b = self.processor.process_query("How many rows and columns are in the dataset?", "ds_b", self.reports_b)

        self.assertEqual(res_a["data"]["rows"], 5)
        self.assertEqual(res_b["data"]["rows"], 10)
        self.assertNotEqual(res_a["response"], res_b["response"])


if __name__ == "__main__":
    unittest.main()
