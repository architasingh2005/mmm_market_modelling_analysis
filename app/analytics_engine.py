"""
Analytics Engine — Dynamic Dataset & Marketing Analytics Processor

Computes dataset quality, KPIs, sales trends, geographic/brand breakdowns,
marketing channel performance, MMM attribution & ROI rankings, and Pearson correlations
from raw dataset DataFrames and stored analysis reports.
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, List, Optional
import pandas as pd
import numpy as np

from app.mmm_extractor import (
    get_mmm_status, extract_mmm_data,
    MMM_NOT_RUN, MMM_COMPLETED, MMM_FAILED,
    MMMData
)

logger = logging.getLogger(__name__)


def generate_dataset_analytics(
    df: Optional[pd.DataFrame],
    dataset_id: str,
    reports: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate comprehensive analytics payload for a given dataset.
    Returns structured JSON with zero hardcoded values.
    """
    reports_dicts = []
    for rpt in (reports or []):
        reports_dicts.append({
            "title":         rpt.get("title", ""),
            "reportType":    rpt.get("reportType", ""),
            "content":       rpt.get("content") or rpt.get("reportContent", ""),
            "reportContent": rpt.get("reportContent") or rpt.get("content", ""),
            "summary":       rpt.get("summary") or {},
        })

    mmm_status = get_mmm_status(reports_dicts)
    mmm_data = extract_mmm_data(reports_dicts) if mmm_status == MMM_COMPLETED else None

    if df is None or df.empty:
        logger.warning(f"[AnalyticsEngine] Raw DataFrame unavailable for dataset {dataset_id}. Falling back to report data.")
        return _build_analytics_from_reports(dataset_id, mmm_status, mmm_data, reports_dicts)

    # ── 1. Dataset Schema & Quality Audit ──────────────────────────────────────
    rows, cols = df.shape
    missing_count = int(df.isnull().sum().sum())
    duplicate_count = int(df.duplicated().sum())

    schema_info = []
    for col in df.columns:
        dtype_str = str(df[col].dtype)
        is_num = pd.api.types.is_numeric_dtype(df[col])
        nulls = int(df[col].isnull().sum())
        uniques = int(df[col].nunique())
        
        col_meta = {
            "name": col,
            "type": "numeric" if is_num else "categorical",
            "dtype": dtype_str,
            "null_count": nulls,
            "unique_count": uniques,
        }
        if is_num:
            non_nulls = df[col].dropna()
            col_meta["mean"] = float(non_nulls.mean()) if not non_nulls.empty else None
            col_meta["min"]  = float(non_nulls.min()) if not non_nulls.empty else None
            col_meta["max"]  = float(non_nulls.max()) if not non_nulls.empty else None
        schema_info.append(col_meta)

    # ── 2. Dynamic Column Classification ──────────────────────────────────────
    num_cols = df.select_dtypes(include=["number"]).columns.tolist()

    # Sales target variable detection
    sales_col = next((c for c in num_cols if 'sales_value' in c.lower()), None)
    if sales_col is None:
        sales_col = next((c for c in num_cols if 'sales' in c.lower() and 'unit' not in c.lower()), None)
    if sales_col is None:
        sales_col = next((c for c in num_cols if 'sales' in c.lower() or 'revenue' in c.lower()), None)
    if sales_col is None and num_cols:
        sales_col = num_cols[-1]

    # Date / Time column detection
    date_col = next((c for c in df.columns if any(k in c.lower() for k in ('week', 'date', 'period', 'month', 'year', 'time'))), None)

    # Geo column detection
    geo_col = next((c for c in df.columns if any(k in c.lower() for k in ('geo', 'region', 'state', 'country', 'city', 'location'))), None)

    # Brand / Category column detection
    brand_col = next((c for c in df.columns if any(k in c.lower() for k in ('brand', 'category', 'product', 'sku'))), None)

    # Distinguish Monetary Spend Columns vs Impression / Activity Columns
    media_spend_cols = [
        c for c in num_cols
        if any(k in c.lower() for k in ('spend', 'cost', 'budget', 'trade_spend'))
        and c != sales_col
    ]

    media_impression_cols = [
        c for c in num_cols
        if any(k in c.lower() for k in ('impression', 'listener', 'readership', 'grp', 'reach', 'views'))
        and c != sales_col
    ]

    # All media variables combined
    all_media_cols = list(dict.fromkeys(media_spend_cols + media_impression_cols))

    # ── 3. Dynamic KPIs ────────────────────────────────────────────────────────
    if sales_col and sales_col in df.columns:
        valid_sales = df[sales_col].dropna()
        total_sales = float(valid_sales.sum())
        mean_sales  = float(valid_sales.mean()) if len(valid_sales) > 0 else 0.0
        min_sales   = float(valid_sales.min())  if len(valid_sales) > 0 else 0.0
        max_sales   = float(valid_sales.max())  if len(valid_sales) > 0 else 0.0
    else:
        total_sales, mean_sales, min_sales, max_sales = 0.0, 0.0, 0.0, 0.0

    # Calculate total monetary marketing spend
    total_spend = 0.0
    if media_spend_cols:
        for c in media_spend_cols:
            total_spend += float(df[c].dropna().sum())

    kpis = {
        "sales_variable": sales_col or "N/A",
        "total_sales": total_sales,
        "mean_sales": mean_sales,
        "min_sales": min_sales,
        "max_sales": max_sales,
        "total_spend": total_spend,
        "media_channel_count": len(all_media_cols),
        "spend_channel_count": len(media_spend_cols),
        "record_count": rows,
        "column_count": cols,
    }

    # ── 4. Sales Performance Breakdown ─────────────────────────────────────────
    sales_trend = []
    if date_col and sales_col and sales_col in df.columns:
        try:
            temp_df = df[[date_col, sales_col]].dropna().copy()
            temp_df[date_col] = temp_df[date_col].astype(str)
            grouped = temp_df.groupby(date_col)[sales_col].sum().reset_index()
            for _, r in grouped.head(30).iterrows():
                sales_trend.append({"date": str(r[date_col]), "sales": float(r[sales_col])})
        except Exception as err:
            logger.warning(f"[AnalyticsEngine] Sales trend error: {err}")

    sales_by_geo = []
    if geo_col and sales_col and sales_col in df.columns:
        try:
            grouped = df.groupby(geo_col)[sales_col].sum().sort_values(ascending=False).head(10).reset_index()
            for _, r in grouped.iterrows():
                sales_by_geo.append({"geo": str(r[geo_col]), "sales": float(r[sales_col])})
        except Exception as err:
            logger.warning(f"[AnalyticsEngine] Sales by geo error: {err}")

    sales_by_brand = []
    if brand_col and sales_col and sales_col in df.columns:
        try:
            grouped = df.groupby(brand_col)[sales_col].sum().sort_values(ascending=False).head(10).reset_index()
            for _, r in grouped.iterrows():
                sales_by_brand.append({"brand": str(r[brand_col]), "sales": float(r[sales_col])})
        except Exception as err:
            logger.warning(f"[AnalyticsEngine] Sales by brand error: {err}")

    # ── 5. Marketing Channel Performance & MMM Attribution ────────────────────
    spend_by_channel = []
    for c in media_spend_cols:
        spend_by_channel.append({
            "channel": c,
            "spend": float(df[c].dropna().sum()),
            "type": "spend"
        })

    mmm_roi_ranking = []
    top_roi_channel = None
    if mmm_data and mmm_data.ranked_by_roi:
        for i, ch in enumerate(mmm_data.ranked_by_roi, 1):
            item = {
                "rank": i,
                "channel": ch.name,
                "spend": ch.spend,
                "attributed_revenue": ch.attributed_revenue,
                "contribution_pct": ch.contribution_pct,
                "roi": ch.roi,
            }
            mmm_roi_ranking.append(item)
        top_roi_channel = mmm_roi_ranking[0]

    # ── 6. Pearson Correlations ────────────────────────────────────────────────
    correlations = []
    if sales_col and sales_col in df.columns and all_media_cols:
        try:
            corr_df = df[all_media_cols + [sales_col]].corr()[sales_col].drop(sales_col).dropna()
            for ch_name, r_val in corr_df.items():
                is_spend = ch_name in media_spend_cols
                correlations.append({
                    "channel": ch_name,
                    "channel_type": "spend" if is_spend else "impression",
                    "pearson_r": round(float(r_val), 4),
                    "interpretation": "strong positive" if r_val >= 0.7 else "moderate positive" if r_val >= 0.4 else "positive" if r_val > 0 else "negative"
                })
            correlations.sort(key=lambda x: abs(x["pearson_r"]), reverse=True)
        except Exception as corr_err:
            logger.warning(f"[AnalyticsEngine] Correlation calculation error: {corr_err}")

    return {
        "success": True,
        "datasetId": dataset_id,
        "kpis": kpis,
        "quality": {
            "rows": rows,
            "columns": cols,
            "missing_values": missing_count,
            "duplicate_rows": duplicate_count,
            "schema": schema_info,
        },
        "sales_performance": {
            "trend": sales_trend,
            "by_geo": sales_by_geo,
            "by_brand": sales_by_brand,
            "has_date": len(sales_trend) > 0,
            "has_geo": len(sales_by_geo) > 0,
            "has_brand": len(sales_by_brand) > 0,
        },
        "marketing_performance": {
            "spend_by_channel": spend_by_channel,
            "mmm_status": mmm_status,
            "top_roi_channel": top_roi_channel,
            "roi_ranking": mmm_roi_ranking,
        },
        "correlations": correlations,
        "available_filters": {
            "has_date": date_col is not None,
            "has_geo": geo_col is not None,
            "has_brand": brand_col is not None,
            "media_channels": all_media_cols,
        }
    }


def _build_analytics_from_reports(
    dataset_id: str,
    mmm_status: str,
    mmm_data: Optional[MMMData],
    reports: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Fallback analytics payload constructed from saved reports when raw CSV is missing."""
    rows = mmm_data.rows if mmm_data else None
    sales_var = mmm_data.sales_variable if mmm_data else "Sales_Value"
    total_sales = mmm_data.total_sales if mmm_data else 0.0

    mmm_roi_ranking = []
    top_roi_channel = None
    if mmm_data and mmm_data.ranked_by_roi:
        for i, ch in enumerate(mmm_data.ranked_by_roi, 1):
            item = {
                "rank": i,
                "channel": ch.name,
                "spend": ch.spend,
                "attributed_revenue": ch.attributed_revenue,
                "contribution_pct": ch.contribution_pct,
                "roi": ch.roi,
            }
            mmm_roi_ranking.append(item)
        top_roi_channel = mmm_roi_ranking[0]

    return {
        "success": True,
        "datasetId": dataset_id,
        "kpis": {
            "sales_variable": sales_var,
            "total_sales": total_sales,
            "mean_sales": (total_sales / rows) if (total_sales and rows) else 0.0,
            "min_sales": 0.0,
            "max_sales": 0.0,
            "total_spend": sum(ch.spend for ch in mmm_data.channels if ch.spend) if mmm_data else 0.0,
            "media_channel_count": len(mmm_data.channels) if mmm_data else 0,
            "record_count": rows or 0,
            "column_count": 0,
        },
        "quality": {
            "rows": rows or 0,
            "columns": 0,
            "missing_values": 0,
            "duplicate_rows": 0,
            "schema": [],
        },
        "sales_performance": {
            "trend": [],
            "by_geo": [],
            "by_brand": [],
            "has_date": False,
            "has_geo": False,
            "has_brand": False,
        },
        "marketing_performance": {
            "spend_by_channel": [],
            "mmm_status": mmm_status,
            "top_roi_channel": top_roi_channel,
            "roi_ranking": mmm_roi_ranking,
        },
        "correlations": [],
        "available_filters": {
            "has_date": False,
            "has_geo": False,
            "has_brand": False,
            "media_channels": [],
        }
    }
