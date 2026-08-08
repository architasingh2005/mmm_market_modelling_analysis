"""
Intent Classifier — Deterministic Query Intent Detection

Categorises the user's question before any response is generated.
This prevents the AI from substituting one metric for another
(e.g., returning Pearson correlation when the user asks for ROI).

Intent Categories
-----------------
ROI_ATTRIBUTION     : ROI, ROAS, most profitable channel, attributed revenue
CORRELATION         : correlation, relationship between columns, co-movement
BUDGET_ALLOCATION   : budget split, where to invest, spending recommendation
FORECAST            : future prediction, trend, projection, next period
SENTIMENT           : customer reviews, sentiment score, rating analysis
DATA_PROFILE        : dataset overview, missing values, data quality, columns
GENERAL             : everything else
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List


# ── Intent labels ─────────────────────────────────────────────────────────────

MMM_HIGHEST_ROI   = "MMM_HIGHEST_ROI"
MMM_ROI_RANKING   = "MMM_ROI_RANKING"
ROI_ATTRIBUTION   = "ROI_ATTRIBUTION"
CORRELATION       = "CORRELATION"
BUDGET_ALLOCATION = "BUDGET_ALLOCATION"
FORECAST          = "FORECAST"
SENTIMENT         = "SENTIMENT"
DATASET_STATS     = "DATASET_STATS"
DATA_PROFILE      = "DATA_PROFILE"
GENERAL           = "GENERAL"


# ── Keyword lists per intent (all lowercase) ──────────────────────────────────

_HIGHEST_ROI_KEYWORDS = [
    "highest roi", "best roi", "top roi", "highest return", "best return",
    "which channel has the highest roi", "which channel has highest roi",
    "which marketing channel has the highest roi", "which channel generated the most",
    "which marketing channel performed best", "best performing channel",
    "most profitable channel", "channel with highest roi", "single best channel",
    "highest roas", "best roas",
]

_ROI_RANKING_KEYWORDS = [
    "roi ranking", "rank of all channels", "ranking of all channels",
    "list channel roi", "roi of each channel", "roi for each channel",
    "table of roi", "show me the roi ranking", "rank marketing channels",
    "all channel roi", "channel roi breakdown", "spend and roi",
    "roi breakdown", "attributed revenue and roi",
]

_ROI_KEYWORDS = [
    "roi", "roas", "return on investment", "return on ad spend",
    "most profitable", "profitable channel", "highest roi", "best roi",
    "highest return", "best return", "which channel is best",
    "which channel performs best", "highest performing channel",
    "channel performance", "media efficiency", "media effectiveness",
    "cost per sale", "incremental revenue", "attributed revenue",
    "attribution", "media attribution", "channel attribution",
    "revenue per spend", "revenue per dollar", "revenue per pound",
    "lift", "incremental lift", "channel contribution",
]

_BUDGET_KEYWORDS = [
    "budget allocation", "budget split", "allocate budget", "budget recommendation",
    "where to invest", "where should i invest", "where to spend",
    "how should i spend", "increase budget", "decrease budget",
    "reallocate", "reallocation", "optimal budget", "budget optimisation",
    "budget optimization", "spend more on", "spend less on",
    "which channel should receive more", "which channel deserves more",
    "prioritise channel", "prioritize channel", "media mix recommendation",
    "media plan", "investment recommendation",
    "allocate my", "allocate the", "how to allocate", "how do i allocate",
    "media budget", "marketing budget", "advertising budget",
    "budget across channels", "budget across media",
]

_CORRELATION_KEYWORDS = [
    "correlat", "pearson", "relationship between", "co-movement",
    "linearly related", "statistically related", "which columns",
    "which variables", "which features correlate", "what drives",
    "what affects", "which factor", "feature importance",
    "r-squared", "r squared", "r2", "correlation with sales",
    "pearson correlation", "strongest correlation",
]

_DATASET_STATS_KEYWORDS = [
    "how many rows", "how many columns", "row count", "column count",
    "number of rows", "number of columns", "total sales", "average sales",
    "mean sales", "max sales", "min sales", "summary statistics",
    "dataset statistics", "how many observations", "dataset shape",
]

_FORECAST_KEYWORDS = [
    "forecast", "predict", "projection", "project sales", "future sales",
    "next month", "next quarter", "next year", "next period",
    "expected sales", "sales growth", "growth rate", "trend",
    "will sales", "will revenue", "arima", "prophet", "time series",
    "seasonality", "seasonal", "historical trend", "sales trajectory",
]

_SENTIMENT_KEYWORDS = [
    "sentiment", "review", "rating", "feedback", "customer opinion",
    "customer satisfaction", "nps", "net promoter", "positive review",
    "negative review", "complaint", "compliment", "customer perception",
    "product rating", "star rating", "customer feeling",
]

_DATA_PROFILE_KEYWORDS = [
    "missing value", "null value", "missing data", "data quality",
    "data health", "outlier", "duplicate row", "data overview",
    "dataset summary", "column statistics", "describe the dataset",
    "data types", "schema", "completeness", "data profile",
]


# ── Intent result dataclass ───────────────────────────────────────────────────

@dataclass
class IntentResult:
    intent: str
    confidence: float          # fraction of matched signals (0.0–1.0)
    matched_signals: List[str] # which keywords triggered


# ── Internal helpers ──────────────────────────────────────────────────────────

def _normalise(text: str) -> str:
    """Lowercase, collapse whitespace, strip punctuation noise."""
    text = text.lower().strip()
    text = re.sub(r"[?!,;:'\"\u2019\u2018]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def _match_keywords(normalised_query: str, keywords: List[str]) -> List[str]:
    """Return all keywords that appear in the normalised query string."""
    return [kw for kw in keywords if kw in normalised_query]


# ── Public API ────────────────────────────────────────────────────────────────

def classify(question: str) -> IntentResult:
    """
    Classify a user question into one of the intent categories.

    The classifier is fully deterministic — no LLM calls, no randomness.
    """
    if not question or not question.strip():
        return IntentResult(intent=GENERAL, confidence=0.0, matched_signals=[])

    q = _normalise(question)

    # Check granular sub-intents first
    highest_hits = _match_keywords(q, _HIGHEST_ROI_KEYWORDS)
    ranking_hits = _match_keywords(q, _ROI_RANKING_KEYWORDS)
    stats_hits   = _match_keywords(q, _DATASET_STATS_KEYWORDS)

    corr_hits   = _match_keywords(q, _CORRELATION_KEYWORDS)
    roi_hits    = _match_keywords(q, _ROI_KEYWORDS)
    budget_hits = _match_keywords(q, _BUDGET_KEYWORDS)
    fc_hits     = _match_keywords(q, _FORECAST_KEYWORDS)
    sent_hits   = _match_keywords(q, _SENTIMENT_KEYWORDS)
    dp_hits     = _match_keywords(q, _DATA_PROFILE_KEYWORDS)

    # Priority ordering
    if highest_hits:
        return IntentResult(intent=MMM_HIGHEST_ROI, confidence=1.0, matched_signals=highest_hits)
    if ranking_hits:
        return IntentResult(intent=MMM_ROI_RANKING, confidence=1.0, matched_signals=ranking_hits)
    if stats_hits:
        return IntentResult(intent=DATASET_STATS, confidence=1.0, matched_signals=stats_hits)

    # Check correlation explicitly if "correlation" or "pearson" is present without ROI
    if corr_hits and not roi_hits:
        return IntentResult(intent=CORRELATION, confidence=1.0, matched_signals=corr_hits)

    scores = {
        ROI_ATTRIBUTION:   (len(roi_hits),    roi_hits),
        BUDGET_ALLOCATION: (len(budget_hits), budget_hits),
        SENTIMENT:         (len(sent_hits),   sent_hits),
        FORECAST:          (len(fc_hits),     fc_hits),
        DATASET_STATS:     (len(stats_hits),  stats_hits),
        DATA_PROFILE:      (len(dp_hits),     dp_hits),
        CORRELATION:       (len(corr_hits),   corr_hits),
    }

    priority = [ROI_ATTRIBUTION, BUDGET_ALLOCATION, SENTIMENT,
                FORECAST, DATASET_STATS, DATA_PROFILE, CORRELATION]

    best_intent = GENERAL
    best_score  = 0
    best_hits: List[str] = []

    for intent in priority:
        score, hits = scores[intent]
        if score > best_score:
            best_score  = score
            best_intent = intent
            best_hits   = hits

    confidence = min(best_score / 3.0, 1.0) if best_score > 0 else 0.0

    return IntentResult(
        intent=best_intent,
        confidence=confidence,
        matched_signals=best_hits,
    )


def is_roi_question(question: str) -> bool:
    """Convenience helper — True if the intent relates to ROI."""
    return classify(question).intent in (MMM_HIGHEST_ROI, MMM_ROI_RANKING, ROI_ATTRIBUTION)


def is_correlation_question(question: str) -> bool:
    """Convenience helper — True if the intent is CORRELATION."""
    return classify(question).intent == CORRELATION


def is_budget_question(question: str) -> bool:
    """Convenience helper — True if the intent is BUDGET_ALLOCATION."""
    return classify(question).intent == BUDGET_ALLOCATION
