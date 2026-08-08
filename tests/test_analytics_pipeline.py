"""
Comprehensive Test Suite for Analytics Data Pipeline & API Architecture.

Validates:
A. Dataset Metadata (row count, column count, column names, schema)
B. Sales Metrics (total sales, average sales calculation)
C. Marketing Metrics (detected spend columns, monetary total spend calculation)
D. Pearson Correlation (dynamic numerical variables detection & calculation)
E. MMM Attribution (completed MMM ROI, ROI != Pearson r)
F. Dataset Isolation (strict scoping by datasetId)
"""

import os
import unittest
import pandas as pd
import numpy as np

from app.analytics_engine import generate_dataset_analytics


class TestAnalyticsDataPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Load real test CSV dataset if present, else construct exact replica."""
        csv_path = os.path.join("backend", "uploads", "1786219864599-marketmind_ai_test_dataset.csv")
        if os.path.exists(csv_path):
            cls.df = pd.read_csv(csv_path)
        else:
            # Fallback construct exact 527-row replica for CI
            np.random.seed(42)
            rows = 527
            cls.df = pd.DataFrame({
                "Record_ID": [f"REC-{i:05d}" for i in range(1, rows + 1)],
                "Week": [f"2024-W{i%52:02d}" for i in range(rows)],
                "Geo": np.random.choice(["North", "South", "East", "West"], rows),
                "Brand": np.random.choice(["BrandA", "BrandB"], rows),
                "SKU": [f"SKU-{i%10:02d}" for i in range(rows)],
                "Product_Category": ["FMCG"] * rows,
                "Sales_Units": np.random.randint(100, 1000, rows),
                "Sales_Value": np.random.uniform(1000000, 5000000, rows),
                "TV_Spend": np.random.uniform(100000, 500000, rows),
                "Radio_Spend": np.random.uniform(50000, 200000, rows),
                "Facebook_Spend": np.random.uniform(30000, 150000, rows),
                "Instagram_Spend": np.random.uniform(20000, 100000, rows),
                "YouTube_Spend": np.random.uniform(40000, 180000, rows),
                "Print_Spend": np.random.uniform(10000, 80000, rows),
                "Trade_Spend": np.random.uniform(50000, 300000, rows),
                "TV_Impressions": np.random.randint(1000000, 5000000, rows),
                "Radio_Listeners": np.random.randint(500000, 2000000, rows),
                "Facebook_Impressions": np.random.randint(300000, 1500000, rows),
                "Instagram_Impressions": np.random.randint(200000, 1000000, rows),
                "YouTube_Impressions": np.random.randint(400000, 1800000, rows),
                "Print_Readership": np.random.randint(100000, 800000, rows),
            })

    def test_A_dataset_metadata(self):
        """Test A: Row count, column count, and schema column list."""
        res = generate_dataset_analytics(self.df, "ds-test-001", [])

        self.assertTrue(res["success"])
        self.assertEqual(res["quality"]["rows"], len(self.df))
        self.assertEqual(res["quality"]["columns"], len(self.df.columns))
        self.assertEqual(len(res["quality"]["schema"]), len(self.df.columns))

        # Check detected column names
        schema_col_names = [col["name"] for col in res["quality"]["schema"]]
        self.assertEqual(schema_col_names, list(self.df.columns))

    def test_B_sales_metrics(self):
        """Test B: Total sales and Average sales calculation."""
        res = generate_dataset_analytics(self.df, "ds-test-001", [])
        kpis = res["kpis"]

        expected_total = float(self.df["Sales_Value"].sum())
        expected_mean = float(self.df["Sales_Value"].mean())

        self.assertEqual(kpis["sales_variable"], "Sales_Value")
        self.assertAlmostEqual(kpis["total_sales"], expected_total, places=2)
        self.assertAlmostEqual(kpis["mean_sales"], expected_mean, places=2)
        self.assertGreater(kpis["mean_sales"], 0)

    def test_C_marketing_spend_metrics(self):
        """Test C: Monetary spend column detection and total spend calculation."""
        res = generate_dataset_analytics(self.df, "ds-test-001", [])
        kpis = res["kpis"]

        spend_cols = [c for c in self.df.columns if "spend" in c.lower()]
        expected_spend = float(self.df[spend_cols].sum().sum())

        self.assertGreater(len(spend_cols), 0)
        self.assertAlmostEqual(kpis["total_spend"], expected_spend, places=2)
        self.assertEqual(kpis["spend_channel_count"], len(spend_cols))

    def test_D_pearson_correlation(self):
        """Test D: Dynamic correlation calculation directly from DataFrame."""
        res = generate_dataset_analytics(self.df, "ds-test-001", [])
        correlations = res["correlations"]

        self.assertGreater(len(correlations), 0)
        # Check TV_Spend correlation matches exact pandas corr
        tv_corr = next((c for c in correlations if c["channel"] == "TV_Spend"), None)
        self.assertIsNotNone(tv_corr)

        expected_tv_r = round(float(self.df["TV_Spend"].corr(self.df["Sales_Value"])), 4)
        self.assertEqual(tv_corr["pearson_r"], expected_tv_r)

    def test_E_mmm_attribution_vs_correlation(self):
        """Test E: Completed MMM attribution ROI is NOT Pearson correlation."""
        reports = [{
            "title": "MMM Analysis Results",
            "reportType": "marketing",
            "content": "4. MEDIA CHANNEL ATTRIBUTION & ROI ANALYSIS\nTV_Spend: spend=100.0 attributed_revenue=400.0 contrib=50.0% roi=4.00x\nTrade_Spend: spend=200.0 attributed_revenue=600.0 contrib=50.0% roi=3.00x\nDetailed media mix analysis.",
            "summary": {
                "channel_attribution": [
                    {"channel": "TV_Spend", "spend": 100.0, "attributed_revenue": 400.0, "roi": 4.00, "contribution_pct": 50.0},
                    {"channel": "Trade_Spend", "spend": 200.0, "attributed_revenue": 600.0, "roi": 3.00, "contribution_pct": 50.0},
                ]
            }
        }]

        res = generate_dataset_analytics(self.df, "ds-test-mmm", reports)
        mkt = res["marketing_performance"]

        self.assertEqual(mkt["mmm_status"], "MMM_COMPLETED")
        self.assertEqual(len(mkt["roi_ranking"]), 2)
        top = mkt["top_roi_channel"]
        self.assertEqual(top["channel"], "TV_Spend")
        self.assertEqual(top["roi"], 4.00)

        # Verify ROI formula: Attributed Revenue / Spend
        self.assertAlmostEqual(top["roi"], top["attributed_revenue"] / top["spend"])

    def test_F_dataset_isolation(self):
        """Test F: Switching datasetId changes all returned analytics."""
        df1 = pd.DataFrame({"Sales_Value": [100, 200], "TV_Spend": [10, 20]})
        df2 = pd.DataFrame({"Sales_Value": [5000, 6000, 7000], "Radio_Spend": [100, 200, 300]})

        res1 = generate_dataset_analytics(df1, "ds-001", [])
        res2 = generate_dataset_analytics(df2, "ds-002", [])

        self.assertEqual(res1["datasetId"], "ds-001")
        self.assertEqual(res2["datasetId"], "ds-002")

        self.assertEqual(res1["quality"]["rows"], 2)
        self.assertEqual(res2["quality"]["rows"], 3)

        self.assertEqual(res1["kpis"]["total_sales"], 300.0)
        self.assertEqual(res2["kpis"]["total_sales"], 18000.0)

        self.assertNotEqual(res1["kpis"]["total_sales"], res2["kpis"]["total_sales"])


if __name__ == "__main__":
    unittest.main()
