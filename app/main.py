import sys
import os
import matplotlib
matplotlib.use('Agg')

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.report_pipeline import run_pipeline, detect_dataset_type
from app.context_builder import build_context, get_system_prompt
from app.intent_classifier import classify as classify_intent
from app.intent_classifier import (
    ROI_ATTRIBUTION, CORRELATION, BUDGET_ALLOCATION,
    FORECAST, SENTIMENT, DATA_PROFILE, GENERAL,
)

app = FastAPI(
    title="MMM AI Engine API",
    description="FastAPI — Market Mix Modeling, Dataset Analysis & RAG Chat",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Request Schemas ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    filePath: str
    datasetId: Optional[str] = None


class ReportData(BaseModel):
    title: str = ""
    reportType: str = "summary"
    content: str = ""
    reportContent: str = ""
    summary: Optional[Dict[str, Any]] = {}


class HistoryTurn(BaseModel):
    role: str = "user"
    content: str = ""
    aiReply: str = ""


class ChatRequest(BaseModel):
    message: str
    datasetId: Optional[str] = None
    filePath: Optional[str] = None
    datasetType: Optional[str] = "generic"
    reports: Optional[List[ReportData]] = []
    metadata: Optional[Dict[str, Any]] = {}
    history: Optional[List[HistoryTurn]] = []   # previous conversation turns


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "online", "message": "MMM AI Engine FastAPI is running", "version": "3.0.0"}


# ── Report Generation Pipeline ───────────────────────────────────────────────

@app.post("/api/analyze")
def analyze_dataset(payload: AnalyzeRequest):
    """Analyzes a CSV file and returns ALL relevant reports based on dataset type."""
    file_path = Path(payload.filePath)

    if not file_path.exists():
        candidate = PROJECT_ROOT / payload.filePath
        if candidate.exists():
            file_path = candidate
        else:
            candidate2 = PROJECT_ROOT / "backend" / payload.filePath
            if candidate2.exists():
                file_path = candidate2

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"CSV file not found: {payload.filePath}")

    try:
        result = run_pipeline(str(file_path))
        return {
            "success":     True,
            "message":     f"Analysis completed — {len(result['reports'])} report(s) generated",
            "datasetId":   payload.datasetId,
            "datasetType": result["datasetType"],
            "summary":     result["summary"],
            "reports":     result["reports"],
        }
    except Exception as e:
        print(f"[FastAPI] /api/analyze error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Multi-Source RAG Chat ─────────────────────────────────────────────────────

@app.post("/api/chat")
def chat_with_dataset(payload: ChatRequest):
    """
    RAG & Analytics powered conversational endpoint using QueryProcessor.
    """
    msg = payload.message.strip()
    dataset_id = payload.datasetId

    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Convert Pydantic report objects to dicts for QueryProcessor
    reports_dicts = []
    report_ids = []
    for rpt in (payload.reports or []):
        reports_dicts.append({
            "title":         rpt.title,
            "reportType":    rpt.reportType,
            "content":       rpt.content or rpt.reportContent,
            "reportContent": rpt.reportContent or rpt.content,
            "summary":       rpt.summary or {},
        })
        report_ids.append(rpt.title or "Report")

    from app.query_service import QueryProcessor
    processor = QueryProcessor(upload_dir="uploads")

    # Process query
    result = processor.process_query(msg, dataset_id, reports_dicts)

    # ── Debug Logging ──────────────────────────────────────────────────────────
    dbg = result.get("debug", {})
    print("=" * 70)
    print(f"[AI Chat Debug Log]")
    print(f"  - datasetId:                        {dataset_id}")
    print(f"  - user query:                       '{msg}'")
    print(f"  - detected query intent:            {result.get('intent')}")
    print(f"  - retrieved report/document IDs:    {report_ids}")
    print(f"  - retrieved context:                {len(reports_dicts)} report(s)")
    print(f"  - whether MMM result was used:      {dbg.get('mmm_used', False)}")
    print(f"  - whether direct dataset calc used: {dbg.get('direct_calc_used', False)}")
    print(f"  - final structured result:          intent={result.get('intent')}, answer='{result.get('answer', '')[:80]}...'")
    print("=" * 70)

    return result


# ── Intent-Aware Analytical Fallback ─────────────────────────────────────────

def _generate_analytical_fallback(
    msg: str,
    dataset_type: str,
    context_str: str,
    reports: List[Dict[str, Any]],
    intent: str = GENERAL,
    file_path_str: Optional[str] = None,
) -> str:
    """
    Intent-aware fallback when Mistral LLM is unavailable.

    STRICT RULES:
    - ROI_ATTRIBUTION intent  : call mmm_extractor. NEVER return correlation as ROI.
    - BUDGET_ALLOCATION intent: use mmm_extractor data if available, else state limitation clearly.
    - CORRELATION intent      : compute and clearly label Pearson r. Never call it ROI.
    - FORECAST intent         : use trend stats extracted from context.
    - SENTIMENT intent        : use sentiment stats from context.
    - DATA_PROFILE intent     : report data quality and structure stats.
    - GENERAL intent          : dataset summary using actual context values only.
    - All values from dataset/context. Nothing hardcoded.
    """
    import re

    def _find_stat(pattern: str, text: str) -> Optional[str]:
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else None

    # Common dataset profile stats (extracted from context, not hardcoded)
    rows_count   = _find_stat(r"Rows\s*[:\=]\s*([0-9,]+)", context_str)
    col_count    = _find_stat(r"Columns\s*[:\=]\s*([0-9]+)", context_str)
    completeness = _find_stat(r"Completeness\s*[:\=]\s*([0-9.]+%)", context_str)
    total_sales  = _find_stat(r"Total Sales\s*[:\=]\s*([0-9,.]+)", context_str)
    weekly_avg   = _find_stat(r"Weekly Avg\s*[:\=]\s*([0-9,.]+)", context_str)

    # ── ROI / Attribution ─────────────────────────────────────────────
    if intent == ROI_ATTRIBUTION:
        try:
            from app.mmm_extractor import (
                get_mmm_status, extract_mmm_data,
                format_mmm_not_run_response, format_mmm_failed_response,
                format_mmm_completed_response,
                MMM_NOT_RUN, MMM_COMPLETED, MMM_FAILED,
            )
            status = get_mmm_status(reports)
            if status == MMM_NOT_RUN:
                return format_mmm_not_run_response("ROI_ATTRIBUTION")
            if status == MMM_FAILED:
                return format_mmm_failed_response()
            # MMM_COMPLETED
            data = extract_mmm_data(reports)
            return format_mmm_completed_response(data, "ROI_ATTRIBUTION")
        except Exception as e:
            return (
                "### ROI Analysis Unavailable\n\n"
                f"An error occurred while reading MMM analysis results: `{e}`\n\n"
                "**Action required:** Run the Market Mix Modeling analysis for this dataset "
                "from the Reports section, then retry your question."
            )

    # ── Budget Allocation ─────────────────────────────────────────────
    if intent == BUDGET_ALLOCATION:
        try:
            from app.mmm_extractor import (
                get_mmm_status, extract_mmm_data,
                format_mmm_not_run_response, format_mmm_failed_response,
                format_mmm_completed_response,
                MMM_NOT_RUN, MMM_COMPLETED, MMM_FAILED,
            )
            status = get_mmm_status(reports)
            if status == MMM_NOT_RUN:
                return format_mmm_not_run_response("BUDGET_ALLOCATION")
            if status == MMM_FAILED:
                return format_mmm_failed_response()
            data = extract_mmm_data(reports)
            return format_mmm_completed_response(data, "BUDGET_ALLOCATION")
        except Exception as e:
            return (
                "### Budget Allocation Analysis Unavailable\n\n"
                f"An error occurred while reading MMM results: `{e}`\n\n"
                "Run MMM analysis first to get reliable channel allocation recommendations."
            )

    # ── Correlation ───────────────────────────────────────────────────────────
    if intent == CORRELATION:
        corr_lines = [
            l.strip() for l in context_str.split("\n")
            if ("pearson_r=" in l.lower() or ("\u2194" in l and "r=" in l))
        ]
        corr_section = (
            "\n".join(f"  - {l}" for l in corr_lines[:12])
            if corr_lines
            else "  No correlation data could be extracted from context."
        )
        return (
            "### Pearson Correlation Analysis\n\n"
            f"From cross-column analysis on **{rows_count or 'N/A'}** rows:\n\n"
            "> WARNING: Correlation measures linear co-movement only. "
            "It is NOT ROI, attribution, or causation.\n\n"
            f"**Top Pearson Correlations:**\n{corr_section}\n\n"
            "**Interpretation:**\n"
            "- |r| >= 0.7: Strong linear relationship\n"
            "- |r| 0.4-0.7: Moderate relationship\n"
            "- |r| < 0.3: Weak or no linear relationship\n\n"
            "**Note:** Run a VIF (Variance Inflation Factor) check before including "
            "all correlated variables in a regression model."
        )

    # ── Forecast ──────────────────────────────────────────────────────────────
    if intent == FORECAST:
        trend_line = next(
            (l.strip() for l in context_str.split("\n")
             if "trend" in l.lower() and ("%" in l or "upward" in l.lower() or "downward" in l.lower())),
            None,
        )
        return (
            "### Sales Forecast & Trend Analysis\n\n"
            f"**Dataset:** {rows_count or 'N/A'} rows | Completeness: {completeness or 'N/A'}\n\n"
            "**Historical Performance:**\n"
            f"- Total Sales: **{total_sales or 'see dataset context'}**\n"
            f"- Period average: **{weekly_avg or 'N/A'}**\n"
            + (f"- Observed trend: **{trend_line}**\n" if trend_line else "")
            + "\n**Forecast Methodology Notes:**\n"
            "1. A naive projection is included in the Sales Forecast Report (if generated).\n"
            "2. For reliable forecasting, use ARIMA, Prophet, or Exponential Smoothing.\n"
            "3. Account for promotional periods, seasonality, and external macro factors.\n"
            "4. Validate forecast accuracy against a holdout set before using for planning."
        )

    # ── Sentiment ─────────────────────────────────────────────────────────────
    if intent == SENTIMENT:
        net_sentiment = _find_stat(r"Net Sentiment Score\s*[:\=]\s*([+\-0-9.]+%)", context_str)
        avg_rating    = _find_stat(r"Mean[:\s]+([0-9.]+)", context_str)
        pos_pct       = _find_stat(r"positive[:\s]+[0-9,]+\s*\(([0-9.]+%)", context_str)
        neg_pct       = _find_stat(r"negative[:\s]+[0-9,]+\s*\(([0-9.]+%)", context_str)
        return (
            "### Customer Sentiment Analysis\n\n"
            f"**Dataset:** {rows_count or 'N/A'} reviews analyzed\n\n"
            "**Sentiment Overview:**\n"
            f"- Net Sentiment Score: **{net_sentiment or 'N/A'}**\n"
            + (f"- Positive Reviews: **{pos_pct}**\n" if pos_pct else "")
            + (f"- Negative Reviews: **{neg_pct}**\n" if neg_pct else "")
            + (f"- Average Rating: **{avg_rating}**\n" if avg_rating else "")
            + "\n**Recommendations:**\n"
            "1. Investigate root causes of negative reviews.\n"
            "2. Use positive feedback highlights in marketing messaging.\n"
            "3. Track Net Sentiment Score as a monthly KPI.\n"
            "4. Set automated alerts for sentiment drops > 5%."
        )

    # ── Data Profile ──────────────────────────────────────────────────────────
    if intent == DATA_PROFILE:
        missing = _find_stat(r"Missing Cells\s*[:\=]\s*[0-9,]+\s*\(([0-9.]+%)", context_str)
        dups    = _find_stat(r"Duplicate Rows\s*[:\=]\s*([0-9,]+)", context_str)
        num_c   = _find_stat(r"Numerical\s*[:\=]\s*([0-9]+)", context_str)
        cat_c   = _find_stat(r"Categorical\s*[:\=]\s*([0-9]+)", context_str)
        return (
            "### Dataset Profile Summary\n\n"
            f"**Dataset Type:** {dataset_type.upper()}\n"
            f"**Rows:** {rows_count or 'N/A'} | **Columns:** {col_count or 'N/A'}\n"
            f"**Data Completeness:** {completeness or 'N/A'}\n"
            + (f"- Missing data: **{missing}** of cells are missing\n" if missing else "")
            + (f"- Duplicate rows: **{dups}**\n" if dups else "")
            + (f"- Numerical columns: **{num_c}** | Categorical columns: **{cat_c}**\n" if num_c else "")
            + "\nFor detailed column statistics, see the Dataset Understanding Report."
        )

    # ── General (all other questions) ─────────────────────────────────────────
    report_names = [r.get("title", "") for r in reports if r.get("title")]
    report_list  = "\n".join(f"  - {t}" for t in report_names) if report_names else "  - None generated yet."
    context_lines = [l.strip() for l in context_str.split("\n") if l.strip() and len(l.strip()) > 15]
    context_excerpt = "\n".join(f"  {l}" for l in context_lines[:8]) if context_lines else "  (No data context available)"

    return (
        "### Dataset Intelligence Response\n\n"
        f"**Question:** *\"{msg}\"*\n\n"
        f"**Dataset Profile:**\n"
        f"- Type: **{dataset_type.upper()}** | Rows: **{rows_count or 'N/A'}** | Columns: **{col_count or 'N/A'}**\n"
        f"- Data Completeness: **{completeness or 'N/A'}**\n\n"
        f"**Available Reports:**\n{report_list}\n\n"
        f"**Relevant Data Context:**\n{context_excerpt}\n\n"
        "*The AI engine is temporarily unavailable. Dataset context has been loaded. "
        "Please retry your question in a moment for a full AI-generated response.*"
    )
