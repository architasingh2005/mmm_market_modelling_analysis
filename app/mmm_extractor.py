"""
MMM Extractor — Read Actual MMM Pipeline Results from Generated Reports

This module is the ONLY authorised source for ROI/attribution data in the chat pipeline.

Architecture contract
---------------------
- ROI questions MUST go through this module.
- OLS regression is NEVER used as a fallback for ROI.
- If no MMM report exists for the dataset, the system returns a clear
  "Run MMM analysis first" message. It does NOT invent an alternative.

MMM Status values
-----------------
MMM_NOT_RUN   : No 'marketing' report found for this dataset.
MMM_COMPLETED : A 'marketing' report is present and parseable.
MMM_FAILED    : A 'marketing' report exists but is empty/unreadable.

Data extracted from the MMM report
-----------------------------------
The `_generate_mmm_report()` function in report_pipeline.py stores:
  - Report content (text with sections: DATASET SNAPSHOT, MEDIA CHANNEL ANALYSIS,
    SALES PERFORMANCE, MEDIA-SALES CORRELATION, MMM RECOMMENDATIONS)
  - Summary dict: { rows, media_channels_detected, sales_variable, total_sales }

This extractor reads both to surface:
  - Channel activity (mean impressions/spend from MEDIA CHANNEL ANALYSIS)
  - Sales totals (from SALES PERFORMANCE section)
  - Media-Sales Pearson correlations (from MEDIA-SALES CORRELATION section)
  - Dataset metadata (rows, sales variable name)
"""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


# ── MMM Status constants ──────────────────────────────────────────────────────

MMM_NOT_RUN   = "MMM_NOT_RUN"
MMM_COMPLETED = "MMM_COMPLETED"
MMM_FAILED    = "MMM_FAILED"


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class ChannelStat:
    """Stats for a single media channel extracted from the MMM report."""
    name: str
    spend: Optional[float] = None
    attributed_revenue: Optional[float] = None
    contribution_pct: Optional[float] = None
    roi: Optional[float] = None
    mean_activity: Optional[float] = None
    max_activity:  Optional[float] = None
    std_activity:  Optional[float] = None
    sales_corr:    Optional[float] = None   # Pearson r with sales
    unit_type: str = "unknown"              # "spend" | "impressions" | "unknown"


@dataclass
class MMMData:
    """Structured data extracted from a completed MMM analysis report."""
    status: str                                  # MMM_COMPLETED | MMM_FAILED
    report_title: str = ""
    sales_variable: str = ""
    total_sales: Optional[float] = None
    rows: Optional[int] = None
    channels: List[ChannelStat] = field(default_factory=list)
    ranked_by_roi: List[ChannelStat] = field(default_factory=list)
    ranked_by_correlation: List[ChannelStat] = field(default_factory=list)
    raw_summary: Dict[str, Any] = field(default_factory=dict)
    raw_content_excerpt: str = ""


# ── Status detection ──────────────────────────────────────────────────────────

def get_mmm_status(reports: List[Dict[str, Any]]) -> str:
    """
    Determine MMM analysis status from the reports array.

    Returns:
        MMM_NOT_RUN   — no marketing-type report found
        MMM_COMPLETED — marketing report found with usable content
        MMM_FAILED    — marketing report found but empty/corrupt
    """
    if not reports:
        return MMM_NOT_RUN

    mmm_reports = [
        r for r in reports
        if _is_mmm_report(r)
    ]

    if not mmm_reports:
        return MMM_NOT_RUN

    # Check if any mmm report has real content
    for rpt in mmm_reports:
        content = _get_content(rpt)
        summary = rpt.get("summary") or {}
        if content and len(content.strip()) > 100:
            return MMM_COMPLETED
        if summary and len(summary) > 0:
            return MMM_COMPLETED

    return MMM_FAILED


def _is_mmm_report(report: Dict[str, Any]) -> bool:
    """Return True if the report dict is a marketing/MMM report."""
    rtype = (report.get("reportType") or report.get("type") or "").lower()
    title = (report.get("title") or "").lower()
    if rtype in ("marketing", "mmm", "market_mix"):
        return True
    if any(kw in title for kw in ("market mix", "mmm", "marketing performance",
                                   "media channel", "channel performance")):
        return True
    return False


def _get_content(report: Dict[str, Any]) -> str:
    return (
        report.get("content") or
        report.get("reportContent") or
        report.get("report_content") or
        ""
    )


# ── Channel data extraction from report content ───────────────────────────────

def _safe_float(s: str) -> Optional[float]:
    """Parse a number string (with commas) to float."""
    try:
        return float(s.replace(",", "").replace(" ", "").replace("$", "").replace("%", "").replace("x", ""))
    except Exception:
        return None


def _extract_channel_stats(content: str) -> List[ChannelStat]:
    """
    Parse the MEDIA CHANNEL ANALYSIS section of the MMM report.
    """
    channels: Dict[str, ChannelStat] = {}

    # Pattern: channel_name : mean=NNN  max=NNN  std=NNN
    pattern = re.compile(
        r"^\s+([A-Za-z_\-\s]+?)\s*:\s*mean=\s*([0-9,\.\-]+)\s+max=\s*([0-9,\.\-]+)\s+std=\s*([0-9,\.\-]+)",
        re.MULTILINE,
    )
    for m in pattern.finditer(content):
        name = m.group(1).strip()
        ch = ChannelStat(
            name=name,
            mean_activity=_safe_float(m.group(2)),
            max_activity=_safe_float(m.group(3)),
            std_activity=_safe_float(m.group(4)),
        )
        nl = name.lower()
        if any(k in nl for k in ("spend", "cost", "budget")):
            ch.unit_type = "spend"
        elif any(k in nl for k in ("impressions", "reach", "listenership",
                                    "readership", "grp", "views")):
            ch.unit_type = "impressions"
        channels[name] = ch

    return list(channels.values())


def _extract_attribution_stats(content: str, summary: Dict[str, Any]) -> List[ChannelStat]:
    """
    Parse Channel Spend, Attributed Revenue, Contribution %, and ROI.
    """
    results: List[ChannelStat] = []

    # 1. Check summary dict first
    if summary and isinstance(summary.get("channel_attribution"), list):
        for item in summary["channel_attribution"]:
            name = item.get("channel") or ""
            if name:
                results.append(ChannelStat(
                    name=name,
                    spend=_safe_float(str(item.get("spend", ""))),
                    attributed_revenue=_safe_float(str(item.get("attributed_revenue", ""))),
                    contribution_pct=_safe_float(str(item.get("contribution_pct", ""))),
                    roi=_safe_float(str(item.get("roi", ""))),
                ))
        if results:
            return results

    # 2. Parse report text
    pattern = re.compile(
        r"^\s+([A-Za-z_\-\s]+?)\s*:\s*spend=\s*([0-9,\.\-]+)\s+attributed_revenue=\s*([0-9,\.\-]+)\s+contrib=\s*([0-9,\.\-]+)%\s+roi=\s*([0-9,\.\-]+)x",
        re.MULTILINE | re.IGNORECASE
    )
    for m in pattern.finditer(content):
        results.append(ChannelStat(
            name=m.group(1).strip(),
            spend=_safe_float(m.group(2)),
            attributed_revenue=_safe_float(m.group(3)),
            contribution_pct=_safe_float(m.group(4)),
            roi=_safe_float(m.group(5)),
        ))

    return results


def _extract_correlations(content: str) -> Dict[str, float]:
    """
    Parse the MEDIA-SALES CORRELATION section of the MMM report.
    """
    corrs: Dict[str, float] = {}

    section_match = re.search(
        r"MEDIA.{0,10}SALES CORRELATION.*?\n(.*?)(?=\n[=\-]{10}|\n\d+\.|\Z)",
        content, re.DOTALL | re.IGNORECASE
    )
    section_text = section_match.group(1) if section_match else content

    pattern = re.compile(
        r"^\s+([A-Za-z_\-\s]+?)\s*:\s*([+\-]?[0-9]\.[0-9]+)",
        re.MULTILINE,
    )
    for m in pattern.finditer(section_text):
        name = m.group(1).strip()
        val  = _safe_float(m.group(2))
        if val is not None:
            corrs[name] = val

    return corrs


def _extract_sales_stats(content: str, summary: Dict[str, Any]) -> Tuple[Optional[float], str]:
    """Extract total sales and sales variable name."""
    total_sales = None
    sales_var   = summary.get("sales_variable") or summary.get("sales_col") or ""

    if summary.get("total_sales"):
        try:
            total_sales = float(summary["total_sales"])
        except Exception:
            pass

    if total_sales is None:
        m = re.search(r"Total Sales\s*:\s*([0-9,\.\-]+)", content, re.IGNORECASE)
        if m:
            total_sales = _safe_float(m.group(1))

    if not sales_var:
        m = re.search(r"Sales variable\s*:\s*([^\n]+)", content, re.IGNORECASE)
        if m:
            sales_var = m.group(1).strip()

    return total_sales, sales_var


# ── Public API ────────────────────────────────────────────────────────────────

def extract_mmm_data(reports: List[Dict[str, Any]]) -> MMMData:
    """
    Extract structured MMM results from the reports array.
    """
    mmm_reports = [r for r in reports if _is_mmm_report(r)]
    if not mmm_reports:
        return MMMData(status=MMM_NOT_RUN)

    rpt = mmm_reports[-1]
    content = _get_content(rpt)
    summary = rpt.get("summary") or {}
    title   = rpt.get("title") or "Market Mix Modeling Report"

    if not content or len(content.strip()) < 50:
        return MMMData(status=MMM_FAILED, report_title=title)

    channels = _extract_channel_stats(content)
    attribution_list = _extract_attribution_stats(content, summary)

    # Merge attribution stats into channel list
    attr_map = {c.name.lower(): c for c in attribution_list}
    for ch in channels:
        if ch.name.lower() in attr_map:
            a = attr_map[ch.name.lower()]
            ch.spend = a.spend
            ch.attributed_revenue = a.attributed_revenue
            ch.contribution_pct = a.contribution_pct
            ch.roi = a.roi

    # Extract correlations and attach to channels
    corrs = _extract_correlations(content)
    for ch in channels:
        if ch.name in corrs:
            ch.sales_corr = corrs[ch.name]
        else:
            for corr_name, corr_val in corrs.items():
                if corr_name.lower() == ch.name.lower():
                    ch.sales_corr = corr_val
                    break

    total_sales, sales_var = _extract_sales_stats(content, summary)

    # Rank channels by ROI (descending)
    channels_with_roi = [c for c in (attribution_list or channels) if c.roi is not None]
    ranked_roi = sorted(channels_with_roi, key=lambda c: c.roi or 0.0, reverse=True)

    # Rank by correlation (descending)
    channels_with_corr = [c for c in channels if c.sales_corr is not None]
    ranked_corr = sorted(channels_with_corr, key=lambda c: abs(c.sales_corr or 0.0), reverse=True)

    rows = None
    if summary.get("rows"):
        try:
            rows = int(summary["rows"])
        except Exception:
            pass
    if rows is None:
        m = re.search(r"Total observations\s*:\s*([0-9,]+)", content, re.IGNORECASE)
        if m:
            try:
                rows = int(m.group(1).replace(",", ""))
            except Exception:
                pass

    return MMMData(
        status=MMM_COMPLETED,
        report_title=title,
        sales_variable=sales_var,
        total_sales=total_sales,
        rows=rows,
        channels=channels,
        ranked_by_roi=ranked_roi,
        ranked_by_correlation=ranked_corr,
        raw_summary=summary,
        raw_content_excerpt=content[:2000],
    )


# ── Response Formatters ───────────────────────────────────────────────────────

def format_mmm_not_run_response(intent: str) -> str:
    """
    Return a clear, actionable message when MMM analysis has not been run.
    Never generates fake ROI or runs OLS regression.
    """
    if intent == "BUDGET_ALLOCATION":
        action = "budget allocation recommendations"
    elif intent == "ROI_ATTRIBUTION":
        action = "channel ROI and attribution analysis"
    else:
        action = "channel performance analysis"

    return (
        "### MMM Analysis Required\n\n"
        f"**{action.title()} is not available** because Market Mix Modeling "
        "analysis has not been completed for this dataset.\n\n"
        "**To get channel ROI and attribution results:**\n"
        "1. Go to the **Analysis** or **Reports** section\n"
        "2. Run the **Market Mix Modeling (MMM)** analysis for this dataset\n"
        "3. Once the MMM analysis completes, return here and ask your question again\n\n"
        "**Why MMM is required:**\n"
        "- ROI = Attributed Revenue / Channel Spend requires a causal attribution model\n"
        "- Pearson correlation (which can be computed directly from the raw data) "
        "measures co-movement but does NOT measure attribution or return on investment\n"
        "- Impressions data (TV_Impressions, YouTube_Impressions, etc.) is not monetary "
        "spend — dividing attributed revenue by impressions produces meaningless ROI values\n\n"
        "*No ROI estimates have been generated from raw correlations or regression — "
        "those would not be reliable.*"
    )


def format_mmm_failed_response() -> str:
    """Return a message when the MMM report exists but is unreadable."""
    return (
        "### MMM Analysis Incomplete\n\n"
        "A Market Mix Modeling report was found for this dataset, but it appears "
        "to be incomplete or corrupt.\n\n"
        "**Recommended actions:**\n"
        "1. Re-run the MMM analysis from the Reports section\n"
        "2. If the problem persists, check that the dataset file is valid and complete"
    )


def format_mmm_completed_response(data: MMMData, intent: str) -> str:
    """
    Format the actual MMM analysis results for the chat response.
    """
    lines = [
        f"### MMM Analysis Results",
        f"**Report:** {data.report_title}",
    ]

    if data.rows:
        lines.append(f"**Dataset:** {data.rows:,} observations")
    if data.sales_variable:
        lines.append(f"**Target variable:** {data.sales_variable}")
    if data.total_sales is not None:
        lines.append(f"**Total sales:** ${data.total_sales:,.2f}")

    # ── 1. ROI / Attribution Response ──────────────────────────────────────────
    if intent in ("ROI_ATTRIBUTION", "BUDGET_ALLOCATION") and data.ranked_by_roi:
        lines.append(
            "\n**Media Channel Attribution & ROI Ranking:**\n"
            "> **ROI** = Attributed Revenue / Marketing Spend. "
            "Attributed revenue represents the incremental sales contribution estimated for each channel.\n"
        )
        lines.append("| Rank | Channel | Spend | Attributed Revenue | Contribution (%) | ROI (ROAS) | Performance |")
        lines.append("|------|---------|-------|--------------------|------------------|------------|-------------|")

        for i, ch in enumerate(data.ranked_by_roi[:10], 1):
            spend_s = f"${ch.spend:,.2f}" if ch.spend is not None else "N/A"
            rev_s   = f"${ch.attributed_revenue:,.2f}" if ch.attributed_revenue is not None else "N/A"
            c_s     = f"{ch.contribution_pct:.1f}%" if ch.contribution_pct is not None else "N/A"
            roi_s   = f"{ch.roi:.2f}x" if ch.roi is not None else "N/A"
            perf    = "Top ROI Performer" if i == 1 else "High Return" if (ch.roi and ch.roi >= 2.0) else "Moderate Return"

            lines.append(
                f"| {i} | {ch.name} | {spend_s} | {rev_s} | {c_s} | {roi_s} | {perf} |"
            )

        best = data.ranked_by_roi[0]
        best_roi_str = f"{best.roi:.2f}x" if best.roi is not None else "N/A"
        lines.append(
            f"\n**Highest ROI Channel:** **{best.name}** "
            f"generating an estimated **{best_roi_str}** Return on Investment."
        )

        if intent == "BUDGET_ALLOCATION":
            lines.append(
                "\n**Budget Allocation Recommendations:**\n"
                f"1. **Reallocate budget toward {best.name}** (ROI: {best_roi_str}) to maximize incremental sales return.\n"
                "2. Maintain investments in high-contribution channels while monitoring diminishing returns.\n"
                "3. Optimize creative targeting for channels with lower return on investment."
            )

    # ── 2. Pearson Correlation Response (only when requested or fallback) ──────
    elif intent == "CORRELATION" and data.ranked_by_correlation:
        lines.append(
            "\n**Media Channel Rankings by Sales Correlation (Pearson r):**\n"
            "> Note: Pearson r measures linear co-movement with sales. It is NOT ROI or attribution.\n"
        )
        lines.append("| Rank | Channel | Pearson r with Sales | Interpretation |")
        lines.append("|------|---------|----------------------|----------------|")

        for i, ch in enumerate(data.ranked_by_correlation[:10], 1):
            r = ch.sales_corr or 0.0
            direction = "positive" if r > 0 else "negative"
            strength = "strong" if abs(r) >= 0.7 else "moderate" if abs(r) >= 0.4 else "weak"
            interp = f"{strength} {direction} co-movement"
            lines.append(f"| {i} | {ch.name} | {r:+.3f} | {interp} |")

        best = data.ranked_by_correlation[0]
        lines.append(f"\n**Strongest correlation with sales:** {best.name} (Pearson r = {best.sales_corr:+.3f})")

    elif data.channels:
        lines.append("\n**Media Channels Detected in MMM Analysis:**\n")
        lines.append("| Channel | Mean Activity | Max Activity | Type |")
        lines.append("|---------|--------------|-------------|------|")
        for ch in data.channels[:10]:
            mean_s = f"{ch.mean_activity:,.1f}" if ch.mean_activity is not None else "N/A"
            max_s  = f"{ch.max_activity:,.1f}"  if ch.max_activity  is not None else "N/A"
            lines.append(f"| {ch.name} | {mean_s} | {max_s} | {ch.unit_type} |")
    else:
        lines.append("\n*The MMM analysis report was found, but no channel-level data could be extracted.*")

    return "\n".join(lines)


def build_mmm_context_block(reports: List[Dict[str, Any]], intent: str) -> str:
    """
    Build the context block injected at the top of the LLM context for ROI/budget questions.
    This replaces the OLS regression block and roi_calculator output.
    """
    status = get_mmm_status(reports)

    if status == MMM_NOT_RUN:
        return (
            "== MMM ANALYSIS STATUS: NOT RUN ==\n\n"
            "No Market Mix Modeling analysis has been completed for this dataset.\n"
            "For ROI/attribution/budget questions, you MUST tell the user to run MMM analysis first.\n"
            "Do NOT generate ROI estimates from raw data, correlations, or regression.\n"
            "Do NOT use Pearson correlation as a proxy for ROI."
        )

    if status == MMM_FAILED:
        return (
            "== MMM ANALYSIS STATUS: FAILED/INCOMPLETE ==\n\n"
            "A MMM report was found but is unreadable. Tell the user to re-run the MMM analysis."
        )

    # MMM_COMPLETED — extract and surface real data
    data = extract_mmm_data(reports)
    if not data.channels and not data.ranked_by_correlation:
        return (
            "== MMM ANALYSIS STATUS: COMPLETED (no channel data extracted) ==\n\n"
            f"MMM Report found: {data.report_title}\n"
            "Channel-level data could not be parsed from the report content."
        )

    lines = [
        "== MMM ANALYSIS RESULTS (COMPLETED) ==",
        f"Report: {data.report_title}",
    ]
    if data.sales_variable:
        lines.append(f"Sales Variable: {data.sales_variable}")
    if data.total_sales is not None:
        lines.append(f"Total Sales: {data.total_sales:,.2f}")
    if data.rows:
        lines.append(f"Observations: {data.rows:,}")

    if data.ranked_by_correlation:
        lines.append("\nMedia-Sales Pearson Correlations (from MMM report):")
        lines.append("(This is Pearson r, NOT ROI. Label it correctly.)")
        for ch in data.ranked_by_correlation[:10]:
            lines.append(f"  {ch.name}: Pearson_r={ch.sales_corr:+.4f}  type={ch.unit_type}")

    if data.channels:
        lines.append("\nChannel Activity Stats (from MMM report):")
        for ch in data.channels[:10]:
            if ch.mean_activity is not None:
                lines.append(
                    f"  {ch.name}: mean={ch.mean_activity:,.1f}  max={ch.max_activity:,.1f}  type={ch.unit_type}"
                )

    lines.append(
        "\nIMPORTANT: Use these values when answering. "
        "Do NOT compute ROI from correlations. "
        "If asked for ROI, explain that correlations are available but true ROI requires "
        "a causal attribution model that the current pipeline has not run."
    )

    return "\n".join(lines)
