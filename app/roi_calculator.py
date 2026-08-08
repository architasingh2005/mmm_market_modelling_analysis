"""
ROI Calculator — Redirects to MMM Extractor

This module has been intentionally simplified.

ARCHITECTURAL DECISION:
  ROI analysis for marketing questions MUST use actual MMM pipeline results.
  OLS regression was previously used as a fallback — this has been REMOVED.

  The reason: OLS regression on raw impressions/spend data produces unreliable
  ROI figures that mislead users (e.g., dividing attributed revenue by billions
  of impressions yields 0.00x ROI, which is meaningless).

  The correct path for ROI questions is:
    1. Check whether an MMM analysis report exists for this dataset.
    2. If NOT: tell the user to run MMM analysis first.
    3. If YES: extract and present the actual MMM report data.

  This is handled entirely by app/mmm_extractor.py.

  This file is kept as a thin shim that delegates to mmm_extractor so that
  existing call sites do not need refactoring. The public function signatures
  are preserved but the OLS fallback is gone.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import pandas as pd

logger = logging.getLogger(__name__)


def compute_roi(
    df: Optional[pd.DataFrame],
    reports: Optional[List[Dict[str, Any]]] = None,
) -> "ROIResult":
    """
    DEPRECATED DIRECT CALL PATH.

    All ROI logic is now handled by app/mmm_extractor.py.
    This function is only called as a compatibility shim.

    Behaviour:
      - Checks for an MMM report via mmm_extractor.
      - If found: returns a ROIResult wrapping the MMM extractor data.
      - If not found: returns an unavailable ROIResult with MMM_NOT_RUN status.
      - NEVER runs OLS regression.
    """
    from app.mmm_extractor import (
        get_mmm_status, extract_mmm_data,
        MMM_NOT_RUN, MMM_COMPLETED, MMM_FAILED,
    )

    reports = reports or []
    status = get_mmm_status(reports)

    if status == MMM_NOT_RUN:
        return ROIResult(
            available=False,
            mmm_status=MMM_NOT_RUN,
            limitation_note=(
                "MMM analysis has not been completed for this dataset. "
                "Run the Market Mix Modeling analysis first to obtain channel attribution results."
            ),
        )

    if status == MMM_FAILED:
        return ROIResult(
            available=False,
            mmm_status=MMM_FAILED,
            limitation_note=(
                "MMM analysis report was found but is incomplete or unreadable. "
                "Re-run the MMM analysis from the Reports section."
            ),
        )

    # MMM_COMPLETED — return structured result from actual report
    data = extract_mmm_data(reports)
    return ROIResult(
        available=True,
        mmm_status=MMM_COMPLETED,
        mmm_data=data,
        limitation_note=(
            "Results are from the completed MMM analysis report. "
            "Pearson correlations are shown, not causal ROI — "
            "true attribution ROI requires a causal MMM model."
        ),
    )


class ROIResult:
    """
    Thin result container returned by compute_roi().
    Wraps MMM extractor output so call sites can check availability.
    """

    def __init__(
        self,
        available: bool,
        mmm_status: str = "MMM_NOT_RUN",
        mmm_data=None,
        limitation_note: str = "",
    ):
        self.available       = available
        self.mmm_status      = mmm_status
        self.mmm_data        = mmm_data      # MMMData instance when available
        self.limitation_note = limitation_note


def format_roi_result(result: "ROIResult") -> str:
    """
    Format a ROIResult for display.
    Delegates to mmm_extractor formatters.
    """
    from app.mmm_extractor import (
        format_mmm_not_run_response,
        format_mmm_failed_response,
        format_mmm_completed_response,
        MMM_NOT_RUN, MMM_FAILED, MMM_COMPLETED,
    )

    if result.mmm_status == MMM_NOT_RUN:
        return format_mmm_not_run_response("ROI_ATTRIBUTION")

    if result.mmm_status == MMM_FAILED:
        return format_mmm_failed_response()

    if result.mmm_status == MMM_COMPLETED and result.mmm_data:
        return format_mmm_completed_response(result.mmm_data, "ROI_ATTRIBUTION")

    return (
        "### ROI Analysis Unavailable\n\n"
        f"{result.limitation_note or 'Please run MMM analysis to obtain channel attribution results.'}"
    )
