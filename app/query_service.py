"""
Query Processor Service for AI Chat

Processes user questions against selected dataset context:
  - Answers ROI queries specifically (highest ROI vs ROI ranking table).
  - Computes Pearson correlation directly from dataset if needed.
  - Computes dataset statistics (rows, cols, sales total/mean) directly.
  - Formats query-specific answers without dumping full reports.
  - Returns structured JSON responses and logs debug parameters.
"""

from __future__ import annotations

import os
import re
import logging
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd

from app.intent_classifier import (
    classify, IntentResult,
    MMM_HIGHEST_ROI, MMM_ROI_RANKING, ROI_ATTRIBUTION,
    CORRELATION, BUDGET_ALLOCATION, DATASET_STATS,
    FORECAST, SENTIMENT, DATA_PROFILE, GENERAL
)
from app.mmm_extractor import (
    get_mmm_status, extract_mmm_data,
    MMM_NOT_RUN, MMM_FAILED, MMM_COMPLETED,
    MMMData, ChannelStat
)

logger = logging.getLogger(__name__)


class QueryProcessor:
    """Processes user questions against dataset context and reports."""

    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir

    def load_dataset_dataframe(self, dataset_id: str, reports: List[Dict[str, Any]]) -> Optional[pd.DataFrame]:
        """Try loading dataset CSV from uploads folder or report metadata."""
        if not dataset_id:
            return None

        # Check uploads directory for files matching dataset_id or original filenames
        if os.path.exists(self.upload_dir):
            for fname in os.listdir(self.upload_dir):
                if dataset_id in fname and fname.endswith((".csv", ".xlsx", ".xls")):
                    fpath = os.path.join(self.upload_dir, fname)
                    try:
                        if fname.endswith(".csv"):
                            return pd.read_csv(fpath)
                        else:
                            return pd.read_excel(fpath)
                    except Exception as err:
                        logger.warning(f"Could not load dataset file {fpath}: {err}")

        # Check reports metadata for file path
        for rpt in reports:
            fpath = rpt.get("filePath") or rpt.get("file_path") or (rpt.get("summary") or {}).get("file_path")
            if fpath and os.path.exists(fpath):
                try:
                    if fpath.endswith(".csv"):
                        return pd.read_csv(fpath)
                    else:
                        return pd.read_excel(fpath)
                except Exception as err:
                    logger.warning(f"Could not load dataset file from report path {fpath}: {err}")

        return None

    def process_query(self, message: str, dataset_id: str, reports: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Main query handling logic.

        Returns structured dict:
        {
            "success": True,
            "intent": "...",
            "datasetId": dataset_id,
            "answer": "...",
            "response": "...",
            "data": { ... },
            "sources": [ ... ],
            "debug": { ... }
        }
        """
        msg = message.strip()
        intent_res = classify(msg)
        intent = intent_res.intent

        # Try loading actual dataset dataframe
        df = self.load_dataset_dataframe(dataset_id, reports)
        mmm_status = get_mmm_status(reports)
        mmm_data = extract_mmm_data(reports) if mmm_status == MMM_COMPLETED else None

        used_mmm = False
        used_direct_calc = False
        retrieved_sources = [r.get("title", "Report") for r in reports]

        # ── 1. HIGHEST ROI QUERY ──────────────────────────────────────────────
        if intent == MMM_HIGHEST_ROI:
            used_mmm = True
            return self._handle_highest_roi(dataset_id, mmm_status, mmm_data, retrieved_sources)

        # ── 2. ROI RANKING QUERY ──────────────────────────────────────────────
        elif intent in (MMM_ROI_RANKING, ROI_ATTRIBUTION):
            used_mmm = True
            return self._handle_roi_ranking(dataset_id, mmm_status, mmm_data, retrieved_sources)

        # ── 3. BUDGET ALLOCATION QUERY ───────────────────────────────────────
        elif intent == BUDGET_ALLOCATION:
            used_mmm = True
            return self._handle_budget_allocation(dataset_id, mmm_status, mmm_data, retrieved_sources)

        # ── 4. CORRELATION QUERY ──────────────────────────────────────────────
        elif intent == CORRELATION:
            return self._handle_correlation(msg, dataset_id, mmm_data, df, retrieved_sources)

        # ── 5. DATASET STATISTICS QUERY ───────────────────────────────────────
        elif intent in (DATASET_STATS, DATA_PROFILE):
            used_direct_calc = df is not None
            return self._handle_dataset_stats(msg, dataset_id, mmm_data, df, retrieved_sources)

        # ── 6. FORECAST QUERY ─────────────────────────────────────────────────
        elif intent == FORECAST:
            return self._handle_forecast(msg, dataset_id, reports, retrieved_sources)

        # ── 7. SENTIMENT QUERY ────────────────────────────────────────────────
        elif intent == SENTIMENT:
            return self._handle_sentiment(msg, dataset_id, reports, retrieved_sources)

        # ── 8. GENERAL RAG ────────────────────────────────────────────────────
        else:
            return self._handle_general_rag(msg, dataset_id, reports, retrieved_sources)

    # ── Helper Handlers ───────────────────────────────────────────────────────

    def _handle_highest_roi(self, dataset_id: str, mmm_status: str, mmm_data: Optional[MMMData], sources: List[str]) -> Dict[str, Any]:
        if mmm_status != MMM_COMPLETED or not mmm_data or not mmm_data.ranked_by_roi:
            ans = "MMM analysis has not been run or produced no ROI results for this dataset. Please run MMM analysis first."
            return {
                "success": True,
                "intent": "mmm_highest_roi",
                "datasetId": dataset_id,
                "answer": ans,
                "response": f"### MMM Analysis Required\n\n{ans}",
                "data": {},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": False}
            }

        best = mmm_data.ranked_by_roi[0]
        spend_str = f"${best.spend:,.2f}" if best.spend is not None else "N/A"
        rev_str   = f"${best.attributed_revenue:,.2f}" if best.attributed_revenue is not None else "N/A"
        roi_str   = f"{best.roi:.2f}x" if best.roi is not None else "N/A"
        c_str     = f"{best.contribution_pct:.1f}%" if best.contribution_pct is not None else "N/A"

        response_md = (
            f"### Highest ROI Channel\n\n"
            f"The marketing channel with the highest ROI is **{best.name}** "
            f"with a Return on Investment of **{roi_str}**.\n\n"
            f"**Key Channel Metrics:**\n"
            f"- **Marketing Spend:** {spend_str}\n"
            f"- **Attributed Revenue:** {rev_str}\n"
            f"- **Calculated ROI:** {roi_str} (Attributed Revenue / Spend)\n"
            f"- **Incremental Contribution:** {c_str} of total media-driven sales\n"
        )
        answer = f"{best.name} has the highest ROI at {roi_str} ({rev_str} attributed revenue on {spend_str} spend)."

        return {
            "success": True,
            "intent": "mmm_highest_roi",
            "datasetId": dataset_id,
            "answer": answer,
            "response": response_md,
            "data": {
                "channel": best.name,
                "spend": best.spend,
                "attributed_revenue": best.attributed_revenue,
                "roi": best.roi,
                "contribution_pct": best.contribution_pct,
            },
            "sources": sources,
            "debug": {"mmm_used": True, "direct_calc_used": False}
        }

    def _handle_roi_ranking(self, dataset_id: str, mmm_status: str, mmm_data: Optional[MMMData], sources: List[str]) -> Dict[str, Any]:
        if mmm_status != MMM_COMPLETED or not mmm_data or not mmm_data.ranked_by_roi:
            ans = "MMM analysis has not been completed for this dataset. Please run MMM analysis first."
            return {
                "success": True,
                "intent": "mmm_roi_ranking",
                "datasetId": dataset_id,
                "answer": ans,
                "response": f"### MMM Analysis Required\n\n{ans}",
                "data": {},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": False}
            }

        lines = [
            "### Media Channel ROI Ranking",
            f"**Target variable:** {mmm_data.sales_variable or 'Sales'}",
            "\n| Rank | Channel | Spend | Attributed Revenue | Contribution (%) | ROI (ROAS) | Performance |",
            "|------|---------|-------|--------------------|------------------|------------|-------------|"
        ]

        data_items = []
        for i, ch in enumerate(mmm_data.ranked_by_roi, 1):
            spend_s = f"${ch.spend:,.2f}" if ch.spend is not None else "N/A"
            rev_s   = f"${ch.attributed_revenue:,.2f}" if ch.attributed_revenue is not None else "N/A"
            c_s     = f"{ch.contribution_pct:.1f}%" if ch.contribution_pct is not None else "N/A"
            roi_s   = f"{ch.roi:.2f}x" if ch.roi is not None else "N/A"
            perf    = "Top ROI Performer" if i == 1 else "High Return" if (ch.roi and ch.roi >= 2.0) else "Moderate Return"

            lines.append(f"| {i} | {ch.name} | {spend_s} | {rev_s} | {c_s} | {roi_s} | {perf} |")
            data_items.append({
                "rank": i,
                "channel": ch.name,
                "spend": ch.spend,
                "attributed_revenue": ch.attributed_revenue,
                "contribution_pct": ch.contribution_pct,
                "roi": ch.roi
            })

        best = mmm_data.ranked_by_roi[0]
        roi_str = f"{best.roi:.2f}x" if best.roi is not None else "N/A"
        lines.append(f"\n**Highest ROI Channel:** **{best.name}** ({roi_str} ROI).")

        return {
            "success": True,
            "intent": "mmm_roi_ranking",
            "datasetId": dataset_id,
            "answer": f"Media channels ranked by ROI: {', '.join([c['channel'] + ' (' + str(round(c['roi'] or 0, 2)) + 'x)' for c in data_items])}.",
            "response": "\n".join(lines),
            "data": {"rankings": data_items},
            "sources": sources,
            "debug": {"mmm_used": True, "direct_calc_used": False}
        }

    def _handle_budget_allocation(self, dataset_id: str, mmm_status: str, mmm_data: Optional[MMMData], sources: List[str]) -> Dict[str, Any]:
        if mmm_status != MMM_COMPLETED or not mmm_data or not mmm_data.ranked_by_roi:
            ans = "MMM analysis has not been completed. Please run MMM analysis first for budget recommendations."
            return {
                "success": True,
                "intent": "mmm_budget",
                "datasetId": dataset_id,
                "answer": ans,
                "response": f"### MMM Analysis Required\n\n{ans}",
                "data": {},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": False}
            }

        best = mmm_data.ranked_by_roi[0]
        roi_str = f"{best.roi:.2f}x" if best.roi is not None else "N/A"
        lines = [
            "### Budget Allocation Recommendations",
            f"1. **Reallocate budget toward {best.name}** (ROI: {roi_str}) to maximize incremental sales return.",
            "2. Maintain spend levels in high-contribution channels while monitoring diminishing marginal returns.",
            "3. Audit creative targeting and frequency capping for channels with lower return metrics."
        ]
        return {
            "success": True,
            "intent": "mmm_budget",
            "datasetId": dataset_id,
            "answer": f"Recommend increasing budget allocation to {best.name} ({roi_str} ROI).",
            "response": "\n".join(lines),
            "data": {"recommended_channel": best.name, "roi": best.roi},
            "sources": sources,
            "debug": {"mmm_used": True, "direct_calc_used": False}
        }

    def _handle_correlation(self, message: str, dataset_id: str, mmm_data: Optional[MMMData], df: Optional[pd.DataFrame], sources: List[str]) -> Dict[str, Any]:
        corr_dict = {}
        sales_col = "Sales"
        used_direct_calc = False

        # Compute directly from dataframe if available
        if df is not None:
            num = df.select_dtypes(include=["number"])
            sales_col = next((c for c in num.columns if 'sales' in c.lower()), None) or num.columns[-1]
            media_kw = ['impressions', 'reach', 'spend', 'tv', 'digital', 'facebook', 'instagram', 'youtube', 'radio', 'print']
            media_cols = [c for c in num.columns if any(k in c.lower() for k in media_kw) and c != sales_col]
            if not media_cols:
                media_cols = [c for c in num.columns if c != sales_col]

            if sales_col and media_cols:
                corrs = num[media_cols + [sales_col]].corr()[sales_col].drop(sales_col)
                corr_dict = corrs.to_dict()
                used_direct_calc = True

        # Fallback to mmm_data if dataframe was not loaded
        if not corr_dict and mmm_data and mmm_data.ranked_by_correlation:
            for ch in mmm_data.ranked_by_correlation:
                if ch.sales_corr is not None:
                    corr_dict[ch.name] = ch.sales_corr

        if not corr_dict:
            ans = "Pearson correlation could not be computed because no media/numeric columns were found in the dataset."
            return {
                "success": True,
                "intent": "mmm_correlation",
                "datasetId": dataset_id,
                "answer": ans,
                "response": f"### Correlation Analysis\n\n{ans}",
                "data": {},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": used_direct_calc}
            }

        # Sort channels by absolute correlation descending
        sorted_corrs = sorted(corr_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        top_name, top_r = sorted_corrs[0]

        lines = [
            "### Media Channel Pearson Correlations",
            f"**Target variable:** {sales_col}",
            "\n| Rank | Channel | Pearson r with Target | Interpretation |",
            "|------|---------|-----------------------|----------------|"
        ]

        corr_items = []
        for i, (name, r_val) in enumerate(sorted_corrs[:10], 1):
            direction = "positive" if r_val > 0 else "negative"
            strength = "strong" if abs(r_val) >= 0.7 else "moderate" if abs(r_val) >= 0.4 else "weak"
            interp = f"{strength} {direction} co-movement"
            lines.append(f"| {i} | {name} | {r_val:+.3f} | {interp} |")
            corr_items.append({"channel": name, "pearson_r": round(r_val, 4)})

        lines.append(f"\n**Strongest correlation with {sales_col}:** **{top_name}** (Pearson r = **{top_r:+.3f}**).")

        return {
            "success": True,
            "intent": "mmm_correlation",
            "datasetId": dataset_id,
            "answer": f"{top_name} has the strongest correlation with {sales_col} (Pearson r = {top_r:+.3f}).",
            "response": "\n".join(lines),
            "data": {"strongest_channel": top_name, "pearson_r": round(top_r, 4), "correlations": corr_items},
            "sources": sources,
            "debug": {"mmm_used": not used_direct_calc, "direct_calc_used": used_direct_calc}
        }

    def _handle_dataset_stats(self, message: str, dataset_id: str, mmm_data: Optional[MMMData], df: Optional[pd.DataFrame], sources: List[str]) -> Dict[str, Any]:
        if df is not None:
            rows, cols = df.shape
            num = df.select_dtypes(include=["number"])
            sales_col = next((c for c in num.columns if 'sales' in c.lower()), None)
            total_sales = float(df[sales_col].sum()) if sales_col and sales_col in df.columns else None
            mean_sales = float(df[sales_col].mean()) if sales_col and sales_col in df.columns else None

            ans = f"The dataset contains {rows:,} rows and {cols} columns."
            if total_sales is not None:
                ans += f" Total {sales_col} is ${total_sales:,.2f} with an average of ${mean_sales:,.2f} per period."

            lines = [
                "### Dataset Summary & Statistics",
                f"- **Observations (Rows):** {rows:,}",
                f"- **Variables (Columns):** {cols}",
            ]
            if sales_col:
                lines.extend([
                    f"- **Sales Variable:** {sales_col}",
                    f"- **Total Sales:** ${total_sales:,.2f}",
                    f"- **Average Sales:** ${mean_sales:,.2f}",
                    f"- **Min Sales:** ${df[sales_col].min():,.2f}",
                    f"- **Max Sales:** ${df[sales_col].max():,.2f}",
                ])

            return {
                "success": True,
                "intent": "dataset_stats",
                "datasetId": dataset_id,
                "answer": ans,
                "response": "\n".join(lines),
                "data": {"rows": rows, "columns": cols, "sales_variable": sales_col, "total_sales": total_sales, "mean_sales": mean_sales},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": True}
            }

        # Fallback if dataframe is not loaded
        if mmm_data and mmm_data.rows:
            ans = f"The dataset has {mmm_data.rows:,} observations."
            if mmm_data.total_sales:
                ans += f" Total sales: ${mmm_data.total_sales:,.2f}."
            return {
                "success": True,
                "intent": "dataset_stats",
                "datasetId": dataset_id,
                "answer": ans,
                "response": f"### Dataset Overview\n\n{ans}",
                "data": {"rows": mmm_data.rows, "total_sales": mmm_data.total_sales},
                "sources": sources,
                "debug": {"mmm_used": True, "direct_calc_used": False}
            }

        ans = "Dataset statistics are unavailable. Please select or upload a valid dataset."
        return {
            "success": True,
            "intent": "dataset_stats",
            "datasetId": dataset_id,
            "answer": ans,
            "response": f"### Dataset Statistics\n\n{ans}",
            "data": {},
            "sources": sources,
            "debug": {"mmm_used": False, "direct_calc_used": False}
        }

    def _handle_forecast(self, message: str, dataset_id: str, reports: List[Dict[str, Any]], sources: List[str]) -> Dict[str, Any]:
        fc_reports = [r for r in reports if (r.get("reportType") or "").lower() == "forecast" or "forecast" in (r.get("title") or "").lower()]
        if fc_reports:
            content = fc_reports[-1].get("content") or fc_reports[-1].get("reportContent") or ""
            return {
                "success": True,
                "intent": "forecast",
                "datasetId": dataset_id,
                "answer": "Forecast results retrieved from stored dataset forecast report.",
                "response": f"### Sales Forecast Analysis\n\n{content[:1500]}",
                "data": {"report_title": fc_reports[-1].get("title")},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": False}
            }

        ans = "Forecast report has not been generated for this dataset. Run Forecast Analysis to view future predictions."
        return {
            "success": True,
            "intent": "forecast",
            "datasetId": dataset_id,
            "answer": ans,
            "response": f"### Forecast Report Required\n\n{ans}",
            "data": {},
            "sources": sources,
            "debug": {"mmm_used": False, "direct_calc_used": False}
        }

    def _handle_sentiment(self, message: str, dataset_id: str, reports: List[Dict[str, Any]], sources: List[str]) -> Dict[str, Any]:
        sent_reports = [r for r in reports if (r.get("reportType") or "").lower() == "sentiment" or "sentiment" in (r.get("title") or "").lower()]
        if sent_reports:
            content = sent_reports[-1].get("content") or sent_reports[-1].get("reportContent") or ""
            return {
                "success": True,
                "intent": "sentiment",
                "datasetId": dataset_id,
                "answer": "Sentiment analysis results retrieved from stored report.",
                "response": f"### Customer Sentiment Analysis\n\n{content[:1500]}",
                "data": {"report_title": sent_reports[-1].get("title")},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": False}
            }

        ans = "Sentiment report has not been generated for this dataset. Run Sentiment Analysis to view review insights."
        return {
            "success": True,
            "intent": "sentiment",
            "datasetId": dataset_id,
            "answer": ans,
            "response": f"### Sentiment Report Required\n\n{ans}",
            "data": {},
            "sources": sources,
            "debug": {"mmm_used": False, "direct_calc_used": False}
        }

    def _handle_general_rag(self, message: str, dataset_id: str, reports: List[Dict[str, Any]], sources: List[str]) -> Dict[str, Any]:
        try:
            from src.rag.marketing_rag_service import MarketingRAGService
            service = MarketingRAGService()
            filter_dict = {"dataset_id": dataset_id} if dataset_id else None

            documents_override = None
            if dataset_id and reports:
                try:
                    vector_docs = service.query_engine.search(message, top_k=5, filter_dict=filter_dict)
                    if not vector_docs:
                        from src.knowledge_base.text_chunker import KnowledgeTextChunker
                        from langchain_core.documents import Document
                        chunker = KnowledgeTextChunker(chunk_size=1000, chunk_overlap=200)
                        raw_docs = []
                        for rpt in reports:
                            content = rpt.get("content") or rpt.get("reportContent")
                            if content:
                                raw_docs.append(Document(
                                    page_content=content,
                                    metadata={
                                        "dataset_id": dataset_id,
                                        "title": rpt.get("title", "Report"),
                                        "category": rpt.get("reportType", "general"),
                                    }
                                ))
                        documents_override = chunker.split_documents(raw_docs)[:5] if raw_docs else []
                except Exception:
                    pass

            rag_res = service.ask(
                question=message,
                top_k=5,
                filter_dict=filter_dict if documents_override is None else None,
                documents_override=documents_override,
            )
            answer = rag_res["answer"]
            return {
                "success": True,
                "intent": "general_rag",
                "datasetId": dataset_id,
                "answer": answer,
                "response": answer,
                "data": {},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": False}
            }
        except Exception as rag_err:
            logger.error(f"RAG Service error: {rag_err}")
            ans = f"Could not answer query: {rag_err}"
            return {
                "success": False,
                "intent": "general_rag",
                "datasetId": dataset_id,
                "answer": ans,
                "response": ans,
                "data": {},
                "sources": sources,
                "debug": {"mmm_used": False, "direct_calc_used": False}
            }
