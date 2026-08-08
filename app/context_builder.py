"""
DataContextBuilder — Multi-Source, Intent-Aware Retrieval for Chat RAG Pipeline

This module builds a rich, unified context for every chat query by fusing:

  Source 1 — Raw Dataset Statistics
    Full column-level profiling: type, missing values, range, mean/median/std,
    distribution skewness, unique value counts, and sample values.

  Source 2 — Dataset-Specific Domain Analysis
    MMM:       Media channel stats, sales performance, adstock-relevant metrics,
               spend vs impressions, geo/brand breakdowns.
               IMPORTANT: correlation data is ALWAYS clearly labelled as
               Pearson correlation and never presented as ROI or ROAS.
    Sentiment: Polarity distribution, rating histograms, review length analysis,
               top positive/negative keywords (word frequency).
    Generic:   Top variance features, category distributions, pairwise stats.

  Source 2b — Intent-Specific Blocks
    ROI_ATTRIBUTION  : Uses mmm_extractor to check MMM analysis status.
                       If MMM is completed: surfaces actual channel stats and
                       correlations from the MMM report.
                       If MMM not run: injects a clear "run MMM first" block.
                       OLS regression is NEVER used as a fallback.
    CORRELATION      : Pure Pearson correlation block, clearly labelled.
    BUDGET_ALLOCATION: Same as ROI_ATTRIBUTION via mmm_extractor.

  Source 3 — Cross-Column Intelligence (Feature Engineering)
    Top correlations (all column pairs ranked by |Pearson r|).
    Outlier flags (IQR method) per numerical column.
    Seasonality / temporal trend (if a date column exists).
    Category-sliced numerical aggregations.

  Source 4 — Generated Report Summaries
    All MongoDB report summaries + first 2,000 chars of content per report.
    These capture the pre-generated AI-written analysis narratives.

  Source 5 — Dataset Metadata
    Filename, type, upload info, rows × columns, file size, completeness.

The builder is query-aware: it scores each column block and source section
against the user's query keywords, so the most relevant chunks are promoted
to the top of the returned context string while less-relevant sections are
placed below. This keeps the LLM prompt focused even for very wide datasets.

Usage:
    from app.context_builder import build_context
    context_str = build_context(
        question="Which channel has the highest ROI?",
        file_path="/abs/path/to/file.csv",
        dataset_type="mmm",
        intent="ROI_ATTRIBUTION",
        reports=[{"title": "...", "content": "...", "summary": {...}}, ...]
    )
"""

from __future__ import annotations

import re
import math
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

# Intent constants (mirrors app/intent_classifier.py — imported lazily to avoid circular)
INTENT_ROI          = "ROI_ATTRIBUTION"
INTENT_CORRELATION  = "CORRELATION"
INTENT_BUDGET       = "BUDGET_ALLOCATION"
INTENT_FORECAST     = "FORECAST"
INTENT_SENTIMENT    = "SENTIMENT"
INTENT_DATA_PROFILE = "DATA_PROFILE"
INTENT_GENERAL      = "GENERAL"


# ── Token budget (approximate char limit per context block) ──────────────────

_BLOCK_LIMIT       = 2000   # max chars per individual source block
_REPORT_LIMIT      = 1800   # max chars per report content chunk
_TOTAL_LIMIT       = 14000  # max total context chars sent to LLM


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe(val, fmt="{:.2f}") -> str:
    """Safely format a numeric value."""
    try:
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return "N/A"
        return fmt.format(float(val))
    except Exception:
        return str(val)


def _pct(part, total) -> str:
    try:
        return f"{part / total * 100:.1f}%"
    except Exception:
        return "N/A"


def _trunc(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "\n… [truncated for context limit]"


def _score_relevance(block: str, keywords: List[str]) -> int:
    """Count how many query keywords appear in a context block."""
    b = block.lower()
    return sum(1 for kw in keywords if kw in b)


def _extract_keywords(question: str) -> List[str]:
    """Extract meaningful keywords from the user question."""
    stopwords = {"what", "how", "which", "is", "the", "a", "an", "of", "for",
                 "in", "are", "and", "or", "do", "does", "can", "please",
                 "tell", "me", "give", "show", "list", "my", "our", "this"}
    words = re.findall(r"[a-z0-9]+", question.lower())
    return [w for w in words if w not in stopwords and len(w) > 2]


# ── Source 1: Dataset Overview & Column Profiles ──────────────────────────────

def _build_overview_block(df: pd.DataFrame, filename: str, dataset_type: str) -> str:
    rows, cols = df.shape
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    date_cols = df.select_dtypes(include=["datetime"]).columns.tolist()
    miss_total = int(df.isnull().sum().sum())
    dups = int(df.duplicated().sum())
    completeness = _pct((rows * cols - miss_total), rows * cols)

    lines = [
        "== DATASET OVERVIEW ==",
        f"File          : {filename}",
        f"Dataset Type  : {dataset_type.upper()}",
        f"Rows          : {rows:,}",
        f"Columns       : {cols}",
        f"Numerical     : {len(num_cols)} — {', '.join(num_cols[:12])}{'...' if len(num_cols) > 12 else ''}",
        f"Categorical   : {len(cat_cols)} — {', '.join(cat_cols[:8])}{'...' if len(cat_cols) > 8 else ''}",
        f"Date Columns  : {len(date_cols)} — {', '.join(date_cols) if date_cols else 'none detected'}",
        f"Missing Cells : {miss_total:,}  ({_pct(miss_total, rows * cols)})",
        f"Duplicate Rows: {dups:,}  ({_pct(dups, rows)})",
        f"Completeness  : {completeness}",
        "",
        "== COLUMN STATISTICS ==",
    ]

    # Per-column stats
    for col in df.columns[:30]:
        series = df[col].dropna()
        n_missing = int(df[col].isnull().sum())
        n_unique  = int(df[col].nunique())
        if df[col].dtype in [np.float64, np.float32, np.int64, np.int32, np.int16, np.int8]:
            lines.append(
                f"  [{col}]  numeric  unique={n_unique}  missing={n_missing}  "
                f"min={_safe(series.min())}  max={_safe(series.max())}  "
                f"mean={_safe(series.mean())}  median={_safe(series.median())}  "
                f"std={_safe(series.std())}  sum={_safe(series.sum(), '{:.1f}')}"
            )
        else:
            top_vals = series.value_counts().head(5).index.tolist()
            top_str = ", ".join(str(v) for v in top_vals)
            lines.append(
                f"  [{col}]  categorical  unique={n_unique}  missing={n_missing}  "
                f"top_values=[{top_str}]"
            )

    if len(df.columns) > 30:
        lines.append(f"  ... and {len(df.columns) - 30} more columns not shown.")

    return _trunc("\n".join(lines), _BLOCK_LIMIT * 2)


# ── Source 2: Domain-Specific Analysis ───────────────────────────────────────

def _build_mmm_block(df: pd.DataFrame) -> str:
    """
    Deep MMM-domain statistics: media channels, sales, spend efficiency.

    IMPORTANT LABELLING RULES (enforced here):
    - Pearson correlation is clearly labelled as CORRELATION, not ROI.
    - No recommendation to "increase budget to highest-correlation channel"
      is included here — that conflates correlation with attribution.
    - ROI calculation is handled separately by _build_roi_context_block().
    """
    lines = ["== MMM DOMAIN ANALYSIS =="]

    # Detect columns by keyword
    media_kw   = ['tv', 'digital', 'youtube', 'facebook', 'instagram', 'radio', 'print',
                  'impressions', 'listenership', 'readership', 'reach', 'spend', 'adstock']
    sales_kw   = ['sales', 'revenue', 'units']
    trade_kw   = ['trade', 'promotion', 'discount', 'price', 'mrp']
    geo_kw     = ['geo', 'region', 'zone', 'state', 'city']
    brand_kw   = ['brand', 'sku', 'product', 'category']

    def _find_cols(kw_list):
        return [c for c in df.columns if any(k in c.lower() for k in kw_list)]

    media_cols = _find_cols(media_kw)
    sales_cols = _find_cols(sales_kw)
    trade_cols = _find_cols(trade_kw)
    geo_cols   = _find_cols(geo_kw)
    brand_cols = _find_cols(brand_kw)

    num = df.select_dtypes(include=[np.number]).columns

    # Media channel summary (raw activity stats only)
    if media_cols:
        lines.append("\nMedia Channel Activity (raw stats — NOT ROI):")
        for col in media_cols:
            if col in num:
                s = df[col].dropna()
                lines.append(
                    f"  {col}: total={_safe(s.sum(), '{:,.0f}')}  mean={_safe(s.mean())}  "
                    f"max={_safe(s.max())}  zero_rows={int((s == 0).sum())}"
                )

    # Sales summary
    sales_col = next((c for c in sales_cols if c in num), None)
    if sales_col:
        s = df[sales_col].dropna()
        lines.append(f"\nSales Variable: {sales_col}")
        lines.append(f"  Total Sales   : {_safe(s.sum(), '{:,.2f}')}")
        lines.append(f"  Weekly Avg    : {_safe(s.mean())}")
        lines.append(f"  Peak Sales    : {_safe(s.max())}")
        lines.append(f"  Min Sales     : {_safe(s.min())}")
        lines.append(f"  Std Dev       : {_safe(s.std())}")
        lines.append(f"  CoV (volatility): {_pct(s.std(), s.mean())}")

    # Correlation: media vs sales — ALWAYS clearly labelled
    if sales_col and media_cols:
        num_media = [c for c in media_cols if c in num]
        if num_media:
            corr_series = df[num_media + [sales_col]].corr()[sales_col].drop(sales_col).sort_values(ascending=False)
            lines.append(
                f"\n[CORRELATION ONLY — NOT ROI] Media → {sales_col} Pearson r:"
                "\n  (Pearson r measures linear co-movement, not attribution or return on spend.)"
            )
            for col, r in corr_series.items():
                lines.append(f"  {col}: Pearson_r={r:+.4f}")

    # Geo/Brand sales breakdown
    for geo_col in geo_cols[:1]:
        if geo_col in df.columns and sales_col:
            agg = df.groupby(geo_col)[sales_col].sum().sort_values(ascending=False).head(8)
            lines.append(f"\nSales by {geo_col}:")
            for k, v in agg.items():
                lines.append(f"  {k}: {_safe(v, '{:,.2f}')}")

    for brand_col in brand_cols[:1]:
        if brand_col in df.columns and sales_col:
            agg = df.groupby(brand_col)[sales_col].sum().sort_values(ascending=False).head(8)
            lines.append(f"\nSales by {brand_col}:")
            for k, v in agg.items():
                lines.append(f"  {k}: {_safe(v, '{:,.2f}')}")

    # Trade spend summary
    for tc in trade_cols[:2]:
        if tc in num:
            s = df[tc].dropna()
            lines.append(f"\nTrade/Price Column [{tc}]: total={_safe(s.sum(), '{:,.1f}')}  mean={_safe(s.mean())}  range=[{_safe(s.min())}, {_safe(s.max())}]")

    return _trunc("\n".join(lines), _BLOCK_LIMIT)


# ── Intent-Specific Context Blocks ────────────────────────────────────────────

def _build_roi_context_block(
    df: Optional[pd.DataFrame],
    reports: List[Dict[str, Any]],
    intent: str = "ROI_ATTRIBUTION",
) -> str:
    """
    Build a context block specifically for ROI and budget attribution questions.

    STRICTLY uses actual MMM analysis results from completed reports.
    - If MMM report EXISTS: extracts and surfaces real channel data.
    - If MMM report MISSING: tells the LLM to ask user to run MMM first.
    - OLS regression is NEVER used as a fallback here.
    """
    try:
        from app.mmm_extractor import build_mmm_context_block
        return build_mmm_context_block(reports, intent)
    except Exception as e:
        return (
            "== MMM ANALYSIS STATUS: ERROR ==\n\n"
            f"Failed to check MMM status: {e}\n\n"
            "Tell the user to check whether MMM analysis has been run for this dataset."
        )


def _build_pure_correlation_block(df: pd.DataFrame) -> str:
    """
    Build a context block for correlation-specific questions.
    Clearly labels everything as Pearson correlation.
    Never implies any causal or ROI relationship.
    """
    lines = [
        "== PEARSON CORRELATION ANALYSIS ==",
        "(Correlation measures linear co-movement between variables.",
        " It does NOT measure ROI, attribution, or causation.)",
    ]
    num = df.select_dtypes(include=[np.number])
    if len(num.columns) >= 2:
        corr_matrix = num.corr().abs()
        upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
        pairs = upper.stack().sort_values(ascending=False).head(15)
        lines.append("\nTop Pearson Correlations (|r|):")
        for (c1, c2), _ in pairs.items():
            original_r = num[[c1, c2]].corr().iloc[0, 1]
            strength = (
                "strong" if abs(original_r) >= 0.7
                else "moderate" if abs(original_r) >= 0.4
                else "weak"
            )
            lines.append(f"  {c1} ↔ {c2}: r={original_r:+.4f} ({strength} linear relationship)")
    else:
        lines.append("  Insufficient numerical columns for correlation analysis.")
    return "\n".join(lines)


def _build_sentiment_block(df: pd.DataFrame) -> str:
    """Deep Sentiment/Review domain statistics."""
    lines = ["== SENTIMENT DOMAIN ANALYSIS =="]

    sent_col   = next((c for c in df.columns if c.lower() in {'sentiment', 'label', 'polarity', 'rating_label', 'sentiment_label'}), None)
    rating_col = next((c for c in df.columns if c.lower() in {'rating', 'score', 'stars', 'star_rating'}), None)
    text_col   = next((c for c in df.columns if any(k in c.lower() for k in ['review', 'text', 'comment', 'feedback', 'opinion', 'review_text'])), None)

    rows = len(df)

    if sent_col:
        dist = df[sent_col].value_counts()
        lines.append(f"\nSentiment Column: {sent_col}")
        for lbl, cnt in dist.items():
            lines.append(f"  {lbl}: {cnt:,} ({_pct(cnt, rows)})")

        pos_kw = {'positive', 'pos', 'good', '5', '4'}
        neg_kw = {'negative', 'neg', 'bad', '1', '2'}
        pos_count = sum(c for l, c in dist.items() if str(l).lower() in pos_kw)
        neg_count = sum(c for l, c in dist.items() if str(l).lower() in neg_kw)
        net_score = (pos_count - neg_count) / rows * 100
        lines.append(f"  Net Sentiment Score: {net_score:+.1f}%")

    if rating_col and rating_col in df.select_dtypes(include=[np.number]).columns:
        rc = df[rating_col].dropna()
        lines.append(f"\nRating Column: {rating_col}")
        lines.append(f"  Mean: {_safe(rc.mean())}  Median: {_safe(rc.median())}  Std: {_safe(rc.std())}")
        lines.append(f"  Min:  {_safe(rc.min())}  Max: {_safe(rc.max())}")
        rating_dist = rc.astype(int).value_counts().sort_index()
        lines.append("  Distribution:")
        for k, v in rating_dist.items():
            bar_len = int(v / rows * 20)
            lines.append(f"    {k}★: {'█' * bar_len}{' ' * (20 - bar_len)} {v:,} ({_pct(v, rows)})")

    if text_col:
        txt = df[text_col].dropna().astype(str)
        wc = txt.str.split().str.len()
        lines.append(f"\nReview Text Column: {text_col}")
        lines.append(f"  Count: {len(txt):,}  Avg Words: {_safe(wc.mean())}  Max Words: {int(wc.max())}")

        # Simple word frequency (top 20 words excluding stopwords)
        stop = {'the','a','an','is','in','it','and','to','of','for','this','that','was','with','i',
                'my','we','have','had','not','be','on','at','by','but','as','are','so','me','they',
                'very','really','just','from','get','got','did','was','were','has'}
        all_words = " ".join(txt.head(200)).lower()
        word_freq = {}
        for w in re.findall(r"[a-z]{3,}", all_words):
            if w not in stop:
                word_freq[w] = word_freq.get(w, 0) + 1
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:20]
        lines.append(f"  Top Keywords: {', '.join(f'{w}({c})' for w, c in top_words)}")

    return _trunc("\n".join(lines), _BLOCK_LIMIT)


def _build_generic_domain_block(df: pd.DataFrame) -> str:
    """Generic dataset: value distributions across categorical dimensions."""
    lines = ["== GENERAL DATA ANALYSIS =="]
    num = df.select_dtypes(include=[np.number])
    cat = df.select_dtypes(include=['object'])

    if len(num.columns) > 0:
        # Top 5 highest-variance numerical columns
        top_var = num.var().sort_values(ascending=False).head(5)
        lines.append("\nTop Features by Variance:")
        for col, var in top_var.items():
            s = num[col].dropna()
            lines.append(f"  {col}: var={_safe(var, '{:.2f}')}  mean={_safe(s.mean())}  sum={_safe(s.sum(), '{:.1f}')}")

    if len(cat.columns) > 0:
        lines.append("\nCategorical Value Distributions (top 5 per column):")
        for col in cat.columns[:6]:
            top = df[col].value_counts().head(5)
            lines.append(f"  {col}: " + "  |  ".join(f"{k}={v}" for k, v in top.items()))

    return _trunc("\n".join(lines), _BLOCK_LIMIT)


# ── Source 3: Cross-Column Feature Engineering ────────────────────────────────

def _build_feature_engineering_block(df: pd.DataFrame, dataset_type: str) -> str:
    """Correlations, outliers, temporal trends, category-sliced aggregations."""
    lines = ["== FEATURE ENGINEERING & CROSS-COLUMN INTELLIGENCE =="]

    num = df.select_dtypes(include=[np.number])
    cat = df.select_dtypes(include=['object'])

    # 1. Top pairwise correlations
    if len(num.columns) >= 2:
        corr_matrix = num.corr().abs()
        upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
        pairs = upper.stack().sort_values(ascending=False).head(12)
        lines.append("\nTop Correlations (|Pearson r|):")
        for (c1, c2), r in pairs.items():
            original_r = num[[c1, c2]].corr().iloc[0, 1]
            lines.append(f"  {c1} ↔ {c2}: r={original_r:+.4f}")

    # 2. Outlier detection (IQR method)
    if len(num.columns) > 0:
        lines.append("\nOutlier Flags (IQR method, % of rows):")
        for col in num.columns[:12]:
            s = num[col].dropna()
            if len(s) < 10:
                continue
            q1, q3 = s.quantile(0.25), s.quantile(0.75)
            iqr = q3 - q1
            outlier_count = int(((s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)).sum())
            if outlier_count > 0:
                lines.append(f"  {col}: {outlier_count} outliers ({_pct(outlier_count, len(s))})")

    # 3. Temporal trend detection
    date_col = None
    for col in df.columns:
        sample = df[col].dropna().head(20).astype(str)
        if sample.str.match(r'\d{4}-\d{2}').any():
            date_col = col
            break

    if date_col:
        try:
            df_temp = df.copy()
            df_temp[date_col] = pd.to_datetime(df_temp[date_col], errors='coerce')
            df_temp = df_temp.dropna(subset=[date_col]).sort_values(date_col)
            lines.append(f"\nTemporal Range ({date_col}):")
            lines.append(f"  Start: {df_temp[date_col].min()}")
            lines.append(f"  End  : {df_temp[date_col].max()}")
            lines.append(f"  Periods: {len(df_temp[date_col].unique()):,}")

            # Trend in top numerical column
            top_num_col = num.var().idxmax() if len(num.columns) > 0 else None
            if top_num_col and top_num_col in df_temp.columns:
                first_half = df_temp.head(len(df_temp) // 2)[top_num_col].mean()
                second_half = df_temp.tail(len(df_temp) // 2)[top_num_col].mean()
                delta = (second_half - first_half) / first_half * 100 if first_half else 0
                lines.append(f"  {top_num_col} trend: {delta:+.1f}% (first half avg={_safe(first_half)} → second half avg={_safe(second_half)})")
        except Exception:
            pass

    # 4. Category-sliced aggregation for MMM/generic
    if len(cat.columns) > 0 and len(num.columns) > 0:
        top_num = num.var().sort_values(ascending=False).index[0]
        cat_col = cat.columns[0]
        try:
            agg = df.groupby(cat_col)[top_num].agg(['mean', 'sum']).sort_values('sum', ascending=False).head(8)
            lines.append(f"\n{top_num} aggregated by {cat_col}:")
            for idx, row in agg.iterrows():
                lines.append(f"  {idx}: sum={_safe(row['sum'], '{:,.1f}')}  mean={_safe(row['mean'])}")
        except Exception:
            pass

    return _trunc("\n".join(lines), _BLOCK_LIMIT)


# ── Source 4: Report Summaries & Content Chunks ───────────────────────────────

def _build_reports_block(reports: List[Dict[str, Any]]) -> str:
    if not reports:
        return ""

    lines = ["== GENERATED REPORT INTELLIGENCE =="]
    lines.append(f"Total reports available: {len(reports)}")

    for rpt in reports:
        title   = rpt.get("title", "Unknown Report")
        rtype   = rpt.get("reportType", "summary")
        summary = rpt.get("summary", {})
        content = rpt.get("content", rpt.get("reportContent", ""))

        lines.append(f"\n--- {title} ({rtype}) ---")

        # Always include the structured summary dict
        if summary and isinstance(summary, dict):
            for k, v in summary.items():
                lines.append(f"  {k}: {v}")

        # Include first part of content (pre-generated textual analysis)
        if content:
            # Only take meaningful lines (skip decorative separators)
            content_lines = [
                l for l in content.split('\n')
                if l.strip() and not all(c in '═─=─ ' for c in l.strip())
            ]
            content_excerpt = "\n".join(content_lines[:40])
            lines.append(f"\n  Report Excerpt:\n{_trunc(content_excerpt, _REPORT_LIMIT)}")

    return _trunc("\n".join(lines), _BLOCK_LIMIT * 2)


# ── Source 5: Dataset Metadata ────────────────────────────────────────────────

def _build_metadata_block(metadata: Dict[str, Any]) -> str:
    if not metadata:
        return ""
    lines = ["== DATASET METADATA =="]
    for k, v in metadata.items():
        if v is not None:
            lines.append(f"  {k}: {v}")
    return "\n".join(lines)


# ── Query-Aware Section Reranking ─────────────────────────────────────────────

def _rerank_sections(sections: List[Tuple[str, str]], keywords: List[str]) -> List[str]:
    """
    Rerank context sections by keyword relevance score.
    Sections with more keyword matches go to the top.
    Each section is a (section_name, content) tuple.
    """
    scored = [(content, _score_relevance(content, keywords)) for (_, content) in sections]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [content for content, _ in scored]


# ── Public Entry Point ────────────────────────────────────────────────────────

def build_context(
    question: str,
    file_path: str,
    dataset_type: str = "generic",
    reports: Optional[List[Dict[str, Any]]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    intent: str = INTENT_GENERAL,
) -> Tuple[str, List[str]]:
    """
    Build a comprehensive, multi-source, intent-aware context string for a chat query.

    Args:
        question    : User's natural language question.
        file_path   : Absolute path to the uploaded CSV file.
        dataset_type: 'mmm', 'sentiment', or 'generic'.
        reports     : List of report dicts from MongoDB (may include content).
        metadata    : Dataset metadata dict (name, upload date, size, etc.).
        intent      : Detected intent label from intent_classifier.

    Returns:
        Tuple[context_str, citations_list]
    """
    if not file_path:
        # No file path — only use report context + intent-specific block if possible
        report_block = _build_reports_block(reports or [])
        meta_block   = _build_metadata_block(metadata or {})
        # For ROI/budget questions, check MMM status from reports (no file needed)
        if intent in (INTENT_ROI, INTENT_BUDGET):
            roi_block = _build_roi_context_block(None, reports or [], intent)
            return "\n\n".join(filter(None, [roi_block, report_block, meta_block])), []
        return "\n\n".join(filter(None, [report_block, meta_block])), []

    path_obj  = Path(file_path)
    filename  = path_obj.name
    citations = [f"Source: {filename}"]

    # ── Load CSV ──────────────────────────────────────────────────────────────
    try:
        df = pd.read_csv(str(path_obj), low_memory=False)
    except Exception as e:
        return f"[Context Error: Unable to read {filename}: {e}]", citations

    # Detect type if not provided
    if dataset_type == "generic" and not metadata:
        from app.report_pipeline import detect_dataset_type
        dataset_type = detect_dataset_type(df, filename)

    keywords = _extract_keywords(question)

    # ── Build Intent-Specific Block (highest priority for relevant intents) ───
    intent_block = ""
    if intent in (INTENT_ROI, INTENT_BUDGET):
        intent_block = _build_roi_context_block(df, reports or [], intent)
    elif intent == INTENT_CORRELATION:
        intent_block = _build_pure_correlation_block(df)

    # ── Build Standard Sections ───────────────────────────────────────────────
    overview_block = _build_overview_block(df, filename, dataset_type)

    if dataset_type == "mmm":
        domain_block = _build_mmm_block(df)
    elif dataset_type == "sentiment":
        domain_block = _build_sentiment_block(df)
    else:
        domain_block = _build_generic_domain_block(df)

    # For ROI/correlation intents, skip the generic feature engineering block
    # (it contains Pearson correlations that could confuse the LLM for ROI questions)
    if intent in (INTENT_ROI, INTENT_BUDGET):
        feature_block = ""   # omit — correlations irrelevant and potentially misleading
    else:
        feature_block = _build_feature_engineering_block(df, dataset_type)

    report_block  = _build_reports_block(reports or [])
    meta_block    = _build_metadata_block(metadata or {})

    # ── Rerank standard sections by relevance to query ────────────────────────
    standard_sections = [
        ("overview",  overview_block),
        ("domain",    domain_block),
        ("features",  feature_block),
        ("reports",   report_block),
        ("metadata",  meta_block),
    ]

    reranked = _rerank_sections(
        [(n, c) for n, c in standard_sections if c],
        keywords
    )

    # ── Join: intent block always first, then ranked standard sections ─────────
    parts = []
    running_len = 0

    if intent_block:
        parts.append(intent_block)
        running_len += len(intent_block)

    for block in reranked:
        if running_len + len(block) > _TOTAL_LIMIT:
            remaining = _TOTAL_LIMIT - running_len
            if remaining > 300:
                parts.append(block[:remaining] + "\n… [context limit reached]")
            break
        parts.append(block)
        running_len += len(block)

    # Collect citations from reports
    for rpt in (reports or []):
        title = rpt.get("title", "")
        if title:
            citations.append(f"Report: {title}")

    return "\n\n".join(parts), list(dict.fromkeys(citations))  # deduplicate


# ── System Prompt Builder ─────────────────────────────────────────────────────

# ── Shared metric discipline rules injected into every system prompt ──────────
_METRIC_DISCIPLINE = """

═══════════════════════════════════════════════════════════════
CRITICAL METRIC RULES — NEVER VIOLATE
═══════════════════════════════════════════════════════════════
1. ROI (Return on Investment) = Attributed/Incremental Revenue ÷ Channel Spend.
   - NEVER substitute Pearson correlation as ROI.
   - NEVER say a channel "has the highest ROI" based on correlation.
   - If the context contains ROI values from "CHANNEL ROI ANALYSIS", use those.
   - If ROI data is marked as unavailable in context, state that clearly.

2. Correlation (Pearson r) measures linear co-movement between two variables.
   - It does NOT measure attribution, causation, ROI, or ROAS.
   - Always label it explicitly as "Pearson correlation" or "linear correlation".
   - Never use it to conclude which channel is "most profitable" or "best ROI".

3. ROAS (Return on Ad Spend) = Revenue Attributable to Channel ÷ Ad Spend.
   Different from ROI (ROI uses profit, ROAS uses revenue). State the distinction.

4. Incremental Revenue = revenue generated ABOVE the baseline due to media spend.
   Requires a statistical model (MMM, regression, or A/B test) to compute.

5. Adstock = carry-over effect of media spend into future periods.
   Not directly observable in raw correlation.

6. Saturation = diminishing marginal returns as channel spend increases.
   Visible as a concave spend-response curve, not from correlation.

7. Never hardcode channel names, spend values, ROI figures, or recommendations.
   All numerical claims must come from the provided dataset context.

8. If a requested metric is unavailable in the context, explicitly say so.
   Do NOT substitute a different (available) metric without clearly flagging it.
═══════════════════════════════════════════════════════════════
"""


SYSTEM_PROMPTS = {
    "mmm": """You are MarketMindAI — an expert Business Intelligence AI assistant specializing in Marketing Mix Modeling (MMM), media attribution, sales forecasting, and budget optimization.

You have deep expertise in:
- Media channel performance analysis (TV, Digital, YouTube, Facebook, Instagram, Radio, Print)
- Sales forecasting using trend and historical data
- Budget allocation and ROI optimization
- Adstock / carry-over effects for media channels
- Geographic and brand-level segmentation
- Promotions and trade spend effectiveness

When answering:
- Use markdown formatting with headers, bullet points, and bold text.
- Quote specific numbers from the dataset context when available.
- Use markdown tables when comparing multiple channels, geographies, or time periods.
- Provide actionable strategic recommendations clearly labeled.
- If asked about a metric not available in context, clearly state that and suggest how to gather it.""" + _METRIC_DISCIPLINE,

    "sentiment": """You are MarketMindAI — a Customer Intelligence AI assistant specializing in sentiment analysis, customer experience, product feedback analysis, and NPS improvement strategies.

You have deep expertise in:
- Customer sentiment classification (positive, negative, neutral)
- Rating distribution and NPS calculation
- Complaint categorization and root cause analysis
- Product performance benchmarking
- Customer experience improvement recommendations

When answering:
- Use markdown formatting with headers, bullet points, and bold text.
- Use rating distribution tables when relevant.
- Quote specific sentiment scores, counts, and percentages from the dataset context.
- Provide actionable customer experience improvement recommendations.""" + _METRIC_DISCIPLINE,

    "generic": """You are MarketMindAI — a Business Intelligence AI assistant specializing in data analysis, statistical insights, trend identification, and strategic recommendations.

You have broad expertise in:
- Statistical data analysis and feature importance
- Correlation and causation identification
- Outlier and anomaly detection
- Segmentation analysis
- Data-driven business recommendations

When answering:
- Use markdown formatting with headers, bullet points, and bold text.
- Quote specific numbers and statistics from the dataset context.
- Use tables for comparing multiple dimensions.
- Provide clear, actionable business recommendations.""" + _METRIC_DISCIPLINE,
}


def get_system_prompt(dataset_type: str) -> str:
    return SYSTEM_PROMPTS.get(dataset_type, SYSTEM_PROMPTS["generic"])
