"""
Unit tests for the Analytics Engine.

Verifies dynamic KPI calculation, sales performance extraction, MMM ROI rankings,
Pearson correlation calculations, and dataset quality auditing across diverse schemas.
"""

import unittest
import pandas as pd
import numpy as np

from app.analytics_engine import generate_dataset_analytics


class TestAnalyticsEngine(unittest.TestCase):

    def test_mmm_dataset_analytics(self):
        """Test analytics extraction on a standard MMM dataset."""
        df = pd.DataFrame({
            "Week": pd.date_range("2024-01-01", periods=10, freq="W"),
            "TV_Spend": [100, 150, 200, 120, 180, 220, 130, 170, 190, 210],
            "Digital_Spend": [50, 60, 80, 55, 75, 90, 65, 85, 95, 100],
            "Sales_Value": [1000, 1200, 1500, 1100, 1400, 1600, 1250, 1450, 1550, 1650],
            "Geo": ["North", "South", "North", "South", "North", "South", "North", "South", "North", "South"],
        })

        reports = [{
            "title": "MMM Analysis Results",
            "reportType": "marketing",
            "content": "4. MEDIA CHANNEL ATTRIBUTION & ROI ANALYSIS\nTV_Spend: spend=1620.0 attributed_revenue=8100.0 contrib=60.0% roi=5.00x\nDigital_Spend: spend=750.0 attributed_revenue=3750.0 contrib=40.0% roi=5.00x\nDetailed analysis of media attribution decomposition.",
            "summary": {
                "channel_attribution": [
                    {"channel": "TV_Spend", "spend": 1620.0, "attributed_revenue": 8100.0, "roi": 5.00, "contribution_pct": 60.0},
                    {"channel": "Digital_Spend", "spend": 750.0, "attributed_revenue": 3750.0, "roi": 5.00, "contribution_pct": 40.0},
                ]
            }
        }]

        res = generate_dataset_analytics(df, "ds-mmm-001", reports)

        self.assertTrue(res["success"])
        self.assertEqual(res["datasetId"], "ds-mmm-001")
        self.assertEqual(res["quality"]["rows"], 10)
        self.assertEqual(res["quality"]["columns"], 5)
        self.assertAlmostEqual(res["kpis"]["total_sales"], 13700.0)
        self.assertTrue(res["sales_performance"]["has_date"])
        self.assertTrue(res["sales_performance"]["has_geo"])
        self.assertEqual(res["marketing_performance"]["mmm_status"], "MMM_COMPLETED")
        self.assertEqual(len(res["marketing_performance"]["roi_ranking"]), 2)
        self.assertGreater(len(res["correlations"]), 0)

    def test_review_dataset_analytics(self):
        """Test analytics extraction on a non-MMM customer review dataset."""
        df = pd.DataFrame({
            "Review_ID": [1, 2, 3, 4, 5],
            "Rating": [5, 4, 1, 2, 5],
            "Review_Text": ["Great product", "Good value", "Terrible", "Bad quality", "Loved it"],
            "Sales_Value": [100, 80, 0, 20, 100],
        })

        res = generate_dataset_analytics(df, "ds-review-002", [])

        self.assertTrue(res["success"])
        self.assertEqual(res["quality"]["rows"], 5)
        self.assertEqual(res["kpis"]["total_sales"], 300.0)
        self.assertEqual(res["marketing_performance"]["mmm_status"], "MMM_NOT_RUN")
        self.assertEqual(len(res["marketing_performance"]["roi_ranking"]), 0)

    def test_sparse_dataset_analytics(self):
        """Test analytics extraction on a sparse dataset with missing optional columns."""
        df = pd.DataFrame({
            "Sales": [500, 600, 700],
        })

        res = generate_dataset_analytics(df, "ds-sparse-003", [])

        self.assertTrue(res["success"])
        self.assertEqual(res["kpis"]["total_sales"], 1800.0)
        self.assertFalse(res["sales_performance"]["has_date"])
        self.assertFalse(res["sales_performance"]["has_geo"])
        self.assertFalse(res["sales_performance"]["has_brand"])


if __name__ == "__main__":
    unittest.main()
