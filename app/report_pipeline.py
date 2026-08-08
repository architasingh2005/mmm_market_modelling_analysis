"""
Report Pipeline — Dataset-type-aware multi-report generator.

Flow:
  1. detect_dataset_type(df, filename) → 'mmm' | 'sentiment' | 'generic'
  2. build_report_plan(dataset_type) → list of (reportType, title, generator_fn)
  3. Each generator_fn(df) → { content: str, summary: dict }
  4. run_pipeline(file_path) → list of report dicts ready to store in MongoDB

Adding a new report type:
  - Write a new _generate_<name>_report(df) function below.
  - Add it to REPORT_PLANS.
"""

from __future__ import annotations

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any


# ── Dataset-type detection ────────────────────────────────────────────────────

# Column signatures used to fingerprint dataset types.
_MMM_COLUMNS = {
    'tv_impressions', 'youtube_impressions', 'facebook_impressions',
    'instagram_impressions', 'tv', 'digital', 'radio', 'print',
    'sales_value', 'sales_units', 'media_spend', 'trade_spend',
    'radio_listenership', 'print_readership', 'adstock',
    'geo', 'brand', 'sku', 'mrp', 'net_price',
}

_SENTIMENT_COLUMNS = {
    'review', 'review_text', 'sentiment', 'rating', 'feedback',
    'comment', 'text', 'label', 'score', 'positive', 'negative',
    'neutral', 'opinion', 'customer_review', 'product_review',
}

_MMM_FILENAME_HINTS    = {'mmm', 'mix', 'media', 'marketing', 'attribution', 'adstock'}
_SENTIMENT_FILENAME_HINTS = {'sentiment', 'review', 'feedback', 'opinion', 'nps'}


def detect_dataset_type(df: pd.DataFrame, filename: str) -> str:
    """
    Detect dataset type from column names and filename.

    Returns:
        'mmm'       — Marketing Mix Modelling dataset
        'sentiment' — Customer Review / Sentiment dataset
        'generic'   — Anything else
    """
    cols_lower = {c.lower().replace(' ', '_') for c in df.columns}
    fname_lower = Path(filename).stem.lower()

    mmm_col_score  = len(cols_lower & _MMM_COLUMNS)
    sent_col_score = len(cols_lower & _SENTIMENT_COLUMNS)

    mmm_hint  = any(h in fname_lower for h in _MMM_FILENAME_HINTS)
    sent_hint = any(h in fname_lower for h in _SENTIMENT_FILENAME_HINTS)

    # Weighted scoring: column matches are stronger signal than filename
    mmm_score  = mmm_col_score  * 2 + (2 if mmm_hint  else 0)
    sent_score = sent_col_score * 2 + (2 if sent_hint else 0)

    if mmm_score  >= 4:  return 'mmm'
    if sent_score >= 4:  return 'sentiment'
    # Fallback: even 1 column match + filename hint is enough
    if mmm_score  >= 2:  return 'mmm'
    if sent_score >= 2:  return 'sentiment'
    return 'generic'


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ts() -> str:
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def _section(title: str, body: str) -> str:
    bar = '─' * 70
    return f"\n{title}\n{bar}\n{body}\n"

def _header(title: str) -> str:
    eq = '=' * 70
    return f"{eq}\n{title}\nGenerated: {_ts()}\n{eq}\n"

def _footer() -> str:
    return '\n' + '=' * 70 + '\n'

def _num_cols(df: pd.DataFrame) -> pd.Index:
    return df.select_dtypes(include=[np.number]).columns

def _cat_cols(df: pd.DataFrame) -> pd.Index:
    return df.select_dtypes(include=['object']).columns

def _safe_pct(part, total) -> str:
    try:
        return f"{part / total * 100:.1f}%"
    except Exception:
        return 'N/A'


# ── Report generators — one function per report type ─────────────────────────

def _generate_data_understanding_report(df: pd.DataFrame) -> Dict[str, Any]:
    """Dataset Understanding — structure, types, missing values, duplicates."""
    rows, cols = df.shape
    num  = _num_cols(df)
    cat  = _cat_cols(df)
    miss = df.isnull().sum()
    miss = miss[miss > 0]
    dups = int(df.duplicated().sum())

    lines = [_header("DATASET UNDERSTANDING REPORT")]

    # Overview
    lines.append(_section("1. DATASET OVERVIEW", "\n".join([
        f"   Total Rows           : {rows:,}",
        f"   Total Columns        : {cols}",
        f"   Numerical Columns    : {len(num)}",
        f"   Categorical Columns  : {len(cat)}",
        f"   Memory (approx.)     : {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB",
    ])))

    # Data types
    dtype_lines = [f"   {str(dt):15}: {cnt:3} column(s)" for dt, cnt in df.dtypes.value_counts().items()]
    lines.append(_section("2. DATA TYPES", "\n".join(dtype_lines)))

    # Missing values
    if len(miss) > 0:
        mv_lines = [f"   {col:30}: {cnt:5} missing  ({_safe_pct(cnt, rows)})"
                    for col, cnt in miss.items()]
        lines.append(_section("3. MISSING VALUES", "\n".join(mv_lines)))
    else:
        lines.append(_section("3. MISSING VALUES", "   ✓ No missing values detected"))

    # Duplicates
    lines.append(_section("4. DUPLICATE ROWS",
        f"   Duplicate rows: {dups} ({_safe_pct(dups, rows)})"))

    # Unique values per column (top 20)
    uv_lines = []
    for col in df.columns[:20]:
        uv_lines.append(f"   {col:30}: {df[col].nunique():6} unique values")
    if cols > 20:
        uv_lines.append(f"   ... and {cols - 20} more columns")
    lines.append(_section("5. UNIQUE VALUES PER COLUMN", "\n".join(uv_lines)))

    # Summary statistics
    if len(num) > 0:
        stats = df[num].describe().round(3).to_string()
        lines.append(_section("6. SUMMARY STATISTICS (NUMERICAL)", stats))

    # Sample values for categorical columns
    if len(cat) > 0:
        samp_lines = []
        for col in cat[:8]:
            top = df[col].value_counts().head(3).index.tolist()
            samp_lines.append(f"   {col:30}: {', '.join(str(v) for v in top)}")
        lines.append(_section("7. TOP CATEGORICAL VALUES", "\n".join(samp_lines)))

    lines.append(_footer())
    content = "".join(lines)

    summary = {
        "rows": rows,
        "columns": cols,
        "numerical_columns": int(len(num)),
        "categorical_columns": int(len(cat)),
        "missing_columns": int(len(miss)),
        "duplicate_rows": dups,
    }
    return {"content": content, "summary": summary}


def _generate_mmm_report(df: pd.DataFrame) -> Dict[str, Any]:
    """Market Mix Modeling — media channel contributions, spend efficiency."""
    rows, _ = df.shape
    num = _num_cols(df)

    lines = [_header("MARKET MIX MODELING REPORT")]

    # Detect media spend / impression columns
    media_kw  = ['impressions', 'reach', 'listenership', 'readership', 'spend', 'tv', 'digital',
                 'facebook', 'instagram', 'youtube', 'radio', 'print']
    media_cols = [c for c in df.columns if any(k in c.lower() for k in media_kw)]

    # Sales column detection
    sales_col = next((c for c in df.columns if 'sales' in c.lower() and 'unit' not in c.lower()), None)
    if sales_col is None:
        sales_col = next((c for c in df.columns if 'sales' in c.lower()), None)

    # Dataset snapshot
    lines.append(_section("1. DATASET SNAPSHOT", "\n".join([
        f"   Total observations   : {rows:,}",
        f"   Media channels found : {len(media_cols)}",
        f"   Sales variable       : {sales_col or 'Not detected'}",
    ])))

    # Media channels
    if media_cols:
        mc_lines = []
        for col in media_cols:
            if col in num:
                mc_lines.append(
                    f"   {col:35}: mean={df[col].mean():>12,.1f}  "
                    f"max={df[col].max():>12,.1f}  "
                    f"std={df[col].std():>12,.1f}"
                )
        lines.append(_section("2. MEDIA CHANNEL ANALYSIS", "\n".join(mc_lines) if mc_lines else "   No numerical media columns found"))

    # Sales summary
    if sales_col and sales_col in df.columns:
        sc = df[sales_col].dropna()
        lines.append(_section("3. SALES PERFORMANCE", "\n".join([
            f"   Total Sales          : {sc.sum():>15,.2f}",
            f"   Average Weekly Sales : {sc.mean():>15,.2f}",
            f"   Peak Sales           : {sc.max():>15,.2f}",
            f"   Min Sales            : {sc.min():>15,.2f}",
            f"   Sales Std Dev        : {sc.std():>15,.2f}",
            f"   CoV (volatility)     : {_safe_pct(sc.std(), sc.mean())}",
        ])))

    # ── Non-negative Linear Regression Channel Attribution & ROI Analysis ──────
    attribution_results = []
    media_num = [c for c in media_cols if c in num]
    if sales_col and sales_col in num and media_num:
        try:
            from sklearn.linear_model import LinearRegression
            
            X_df = df[media_num].fillna(0)
            y_ser = df[sales_col].fillna(0)
            total_sales_val = float(y_ser.sum())

            # Fit non-negative linear regression
            model = LinearRegression(positive=True)
            model.fit(X_df, y_ser)

            temp_results = []
            total_attr_rev = 0.0

            for i, col in enumerate(media_num):
                coef = max(0.0, float(model.coef_[i]))
                # Attributed revenue = sum_t (beta_c * X_{c,t})
                attr_rev = float((X_df[col] * coef).sum())

                # Spend calculation: use column sum if monetary/spend, or scale impressions
                col_sum = float(X_df[col].sum())
                nl = col.lower()
                if any(k in nl for k in ('spend', 'cost', 'budget', 'price')) or (col_sum > 0 and col_sum < total_sales_val):
                    spend = max(1.0, col_sum)
                else:
                    # Estimate spend for impression metrics ($10 CPM baseline estimate)
                    spend = max(1.0, (col_sum / 1000.0) * 10.0)

                roi = (attr_rev / spend) if spend > 0 else 0.0
                total_attr_rev += attr_rev

                temp_results.append({
                    "channel": col,
                    "spend": spend,
                    "attributed_revenue": attr_rev,
                    "roi": roi,
                    "coef": coef,
                })

            for res in temp_results:
                contrib_pct = (res["attributed_revenue"] / total_attr_rev * 100.0) if total_attr_rev > 0 else 0.0
                res["contribution_pct"] = contrib_pct
                attribution_results.append(res)

            attribution_results.sort(key=lambda r: r["roi"], reverse=True)

        except Exception as attr_err:
            print(f"[ReportPipeline] Channel attribution calculation warning: {attr_err}")

    if attribution_results:
        attr_lines = [
            "   Channel                         Spend ($)     Attributed Revenue ($)   Contrib (%)   ROI (ROAS)",
            "   -----------------------------------------------------------------------------------------------"
        ]
        for res in attribution_results:
            attr_lines.append(
                f"   {res['channel']:30}: spend={res['spend']:>12,.2f}  "
                f"attributed_revenue={res['attributed_revenue']:>14,.2f}  "
                f"contrib={res['contribution_pct']:>6.1f}%  "
                f"roi={res['roi']:>6.2f}x"
            )
        lines.append(_section("4. MEDIA CHANNEL ATTRIBUTION & ROI ANALYSIS", "\n".join(attr_lines)))

    # Correlation with sales
    if sales_col and sales_col in num and media_num:
        corr = df[media_num + [sales_col]].corr()[sales_col].drop(sales_col).sort_values(ascending=False)
        corr_lines = [f"   {col:35}: {val:+.3f}" for col, val in corr.items()]
        lines.append(_section("5. MEDIA–SALES CORRELATION (PEARSON R)", "\n".join(corr_lines)))

    # Geo & Brand breakdown
    for dim in ['Geo', 'Brand', 'geo', 'brand']:
        if dim in df.columns and sales_col and sales_col in df.columns:
            agg = df.groupby(dim)[sales_col].sum().sort_values(ascending=False).head(10)
            agg_lines = [f"   {str(k):25}: {v:>15,.2f}" for k, v in agg.items()]
            lines.append(_section(f"6. SALES BY {dim.upper()}", "\n".join(agg_lines)))
            break

    # Recommendations
    lines.append(_section("7. MMM RECOMMENDATIONS", "\n".join([
        "   • Prioritize budget allocation toward channels with highest ROI (Attributed Revenue / Spend).",
        "   • Allocate higher budget to channels with stronger sales correlation.",
        "   • Review low-ROI channels for creative or targeting improvements.",
        "   • Monitor sales volatility (CoV) — high CoV may indicate seasonal effects.",
        "   • Consider adstock / carry-over effects for TV and Radio channels.",
        "   • Segment analysis by Geo / Brand to identify regional performance gaps.",
    ])))

    lines.append(_footer())
    content = "".join(lines)

    summary = {
        "rows": rows,
        "media_channels_detected": len(media_cols),
        "sales_variable": sales_col or "N/A",
        "total_sales": float(df[sales_col].sum()) if sales_col and sales_col in df.columns else None,
        "channel_attribution": attribution_results,
    }
    return {"content": content, "summary": summary}


def _generate_forecast_report(df: pd.DataFrame) -> Dict[str, Any]:
    """Sales Forecast — trend analysis and simple projections using historical data."""
    rows, _ = df.shape

    lines = [_header("SALES FORECAST REPORT")]

    # Detect date / time column
    date_col  = next((c for c in df.columns if any(k in c.lower() for k in ['date', 'week', 'month', 'time', 'period'])), None)
    sales_col = next((c for c in df.columns if 'sales' in c.lower() and 'unit' not in c.lower()), None)
    if sales_col is None:
        sales_col = next((c for c in df.columns if 'sales' in c.lower()), None)
    if sales_col is None:
        # Fallback: highest-variance numerical column
        num = _num_cols(df)
        if len(num) > 0:
            sales_col = df[num].var().idxmax()

    lines.append(_section("1. FORECAST BASIS", "\n".join([
        f"   Observations         : {rows:,}",
        f"   Time variable        : {date_col or 'Not detected (using row index)'}",
        f"   Target variable      : {sales_col or 'Not detected'}",
    ])))

    if sales_col and sales_col in df.columns:
        series = df[sales_col].dropna()
        n      = len(series)

        # Simple trend (linear regression on index)
        x = np.arange(n)
        try:
            slope, intercept = np.polyfit(x, series.values, 1)
            trend_dir = "Upward ↑" if slope > 0 else "Downward ↓"
        except Exception:
            slope, intercept, trend_dir = 0, series.mean(), "Flat"

        # Split into periods for projection
        q_size  = max(n // 4, 1)
        q1_mean = series.iloc[:q_size].mean()
        q4_mean = series.iloc[-q_size:].mean()
        growth  = (q4_mean - q1_mean) / q1_mean * 100 if q1_mean else 0

        proj_next = q4_mean * (1 + growth / 100)  # naive 1-period projection

        lines.append(_section("2. HISTORICAL TREND", "\n".join([
            f"   Overall trend        : {trend_dir}",
            f"   Slope per period     : {slope:+,.3f}",
            f"   First-quarter mean   : {q1_mean:>15,.2f}",
            f"   Last-quarter mean    : {q4_mean:>15,.2f}",
            f"   Period-over-period Δ : {growth:+.2f}%",
        ])))

        # Volatility & seasonality hints
        rolling_std = series.rolling(max(q_size, 4)).std().mean() if n >= 4 else series.std()
        lines.append(_section("3. VOLATILITY ANALYSIS", "\n".join([
            f"   Mean                 : {series.mean():>15,.2f}",
            f"   Std deviation        : {series.std():>15,.2f}",
            f"   Rolling std (window) : {rolling_std:>15,.2f}",
            f"   Min                  : {series.min():>15,.2f}",
            f"   Max                  : {series.max():>15,.2f}",
            f"   Coefficient of var.  : {_safe_pct(series.std(), series.mean())}",
        ])))

        lines.append(_section("4. NAIVE FORECAST (NEXT PERIOD)", "\n".join([
            f"   Projected value      : {proj_next:>15,.2f}",
            f"   Basis                : Last-quarter average × (1 + growth rate)",
            f"   Growth rate used     : {growth:+.2f}%",
            "   ⚠ This is a statistical projection, not an ML model forecast.",
            "     Use with caution for business decisions.",
        ])))

    lines.append(_section("5. RECOMMENDATIONS", "\n".join([
        "   • Invest in time-series models (ARIMA, Prophet) for reliable forecasting.",
        "   • Account for seasonality, promotions, and macro-economic indicators.",
        "   • Validate forecasts against holdout test sets before publishing.",
        "   • Review periods with high volatility for external shocks or data quality issues.",
    ])))

    lines.append(_footer())
    content = "".join(lines)

    summary = {
        "rows": rows,
        "sales_variable": sales_col or "N/A",
        "time_variable": date_col or "N/A",
    }
    return {"content": content, "summary": summary}


def _generate_sentiment_report(df: pd.DataFrame) -> Dict[str, Any]:
    """Sentiment Analysis — review polarity distribution and topic insights."""
    rows, _ = df.shape

    lines = [_header("SENTIMENT ANALYSIS REPORT")]

    # Detect sentiment / label column
    sent_col   = next((c for c in df.columns if c.lower() in {'sentiment', 'label', 'polarity', 'rating_label'}), None)
    rating_col = next((c for c in df.columns if c.lower() in {'rating', 'score', 'stars', 'star_rating'}), None)
    text_col   = next((c for c in df.columns if any(k in c.lower() for k in ['review', 'text', 'comment', 'feedback', 'opinion'])), None)

    lines.append(_section("1. OVERVIEW", "\n".join([
        f"   Total records        : {rows:,}",
        f"   Sentiment column     : {sent_col or 'Not detected'}",
        f"   Rating column        : {rating_col or 'Not detected'}",
        f"   Text column          : {text_col or 'Not detected'}",
    ])))

    # Sentiment distribution
    if sent_col and sent_col in df.columns:
        dist = df[sent_col].value_counts()
        dist_lines = [f"   {str(lbl):20}: {cnt:6}  ({_safe_pct(cnt, rows)})" for lbl, cnt in dist.items()]
        lines.append(_section("2. SENTIMENT DISTRIBUTION", "\n".join(dist_lines)))

        # Determine positive/negative counts
        pos_kw = {'positive', 'pos', 'good', '5', '4'}
        neg_kw = {'negative', 'neg', 'bad', '1', '2'}
        pos_count = sum(cnt for lbl, cnt in dist.items() if str(lbl).lower() in pos_kw)
        neg_count = sum(cnt for lbl, cnt in dist.items() if str(lbl).lower() in neg_kw)
        neu_count = rows - pos_count - neg_count
        net_score = (pos_count - neg_count) / rows * 100

        lines.append(_section("3. SENTIMENT BREAKDOWN", "\n".join([
            f"   Positive             : {pos_count:6}  ({_safe_pct(pos_count, rows)})",
            f"   Neutral              : {neu_count:6}  ({_safe_pct(neu_count, rows)})",
            f"   Negative             : {neg_count:6}  ({_safe_pct(neg_count, rows)})",
            f"   Net Sentiment Score  : {net_score:+.1f}%",
        ])))

    # Rating distribution
    if rating_col and rating_col in df.columns:
        rc = df[rating_col].dropna()
        lines.append(_section("4. RATING STATISTICS", "\n".join([
            f"   Mean rating          : {rc.mean():.2f}",
            f"   Median rating        : {rc.median():.2f}",
            f"   Std deviation        : {rc.std():.2f}",
            f"   Min rating           : {rc.min():.0f}",
            f"   Max rating           : {rc.max():.0f}",
        ])))
        # Rating histogram
        rating_dist = rc.astype(int).value_counts().sort_index()
        rd_lines = [f"   {k} star(s)            : {v:6}  ({_safe_pct(v, rows)})" for k, v in rating_dist.items()]
        lines.append(_section("5. RATING DISTRIBUTION", "\n".join(rd_lines)))

    # Word-count stats on text column
    if text_col and text_col in df.columns:
        text_series = df[text_col].dropna().astype(str)
        word_counts = text_series.str.split().str.len()
        lines.append(_section("6. REVIEW LENGTH ANALYSIS", "\n".join([
            f"   Avg words per review : {word_counts.mean():.1f}",
            f"   Min words            : {word_counts.min()}",
            f"   Max words            : {word_counts.max()}",
            f"   Total reviews        : {len(text_series):,}",
        ])))

    lines.append(_section("7. RECOMMENDATIONS", "\n".join([
        "   • Investigate root causes of negative reviews immediately.",
        "   • Use positive reviews to identify top-performing product features.",
        "   • Monitor net sentiment score as a KPI over time.",
        "   • Apply NLP topic modelling (LDA/BERTopic) for deeper theme extraction.",
        "   • Set alert thresholds on net sentiment drops (> 5%) for early warning.",
    ])))

    lines.append(_footer())
    content = "".join(lines)

    summary = {
        "rows": rows,
        "sentiment_column": sent_col or "N/A",
        "rating_column": rating_col or "N/A",
    }
    return {"content": content, "summary": summary}


def _generate_executive_summary_report(df: pd.DataFrame, dataset_type: str) -> Dict[str, Any]:
    """Executive Summary — high-level KPIs and strategic recommendations."""
    rows, cols = df.shape
    num  = _num_cols(df)
    miss = df.isnull().sum()
    miss_cols = int((miss > 0).sum())

    type_label = {
        'mmm':       'Marketing Mix Modelling',
        'sentiment': 'Customer Sentiment / Review',
        'generic':   'General Business',
    }.get(dataset_type, 'Business')

    lines = [_header(f"EXECUTIVE SUMMARY REPORT\n{type_label} Dataset")]

    lines.append(_section("1. EXECUTIVE OVERVIEW", "\n".join([
        f"   Dataset type         : {type_label}",
        f"   Total records        : {rows:,}",
        f"   Total dimensions     : {cols}",
        f"   Data completeness    : {_safe_pct(rows * cols - miss.sum(), rows * cols)}",
        f"   Analysis timestamp   : {_ts()}",
    ])))

    # Key metrics — pick top numerical columns by variance
    if len(num) >= 1:
        top_cols = df[num].var().sort_values(ascending=False).head(5).index
        kpi_lines = []
        for col in top_cols:
            s = df[col].dropna()
            kpi_lines.append(
                f"   {col:35}: "
                f"sum={s.sum():>15,.1f}  "
                f"avg={s.mean():>10,.2f}"
            )
        lines.append(_section("2. KEY METRICS (TOP 5 BY VARIANCE)", "\n".join(kpi_lines)))

    # Data quality summary
    lines.append(_section("3. DATA QUALITY SUMMARY", "\n".join([
        f"   Missing value columns : {miss_cols} of {cols}",
        f"   Duplicate rows        : {int(df.duplicated().sum()):,}",
        f"   Numerical columns     : {len(num)}",
        f"   Categorical columns   : {cols - len(num)}",
        f"   Data health           : {'✓ Good' if miss_cols == 0 else f'⚠ {miss_cols} column(s) with missing data'}",
    ])))

    # Type-specific insights
    if dataset_type == 'mmm':
        media_kw = ['impressions', 'spend', 'reach', 'listenership', 'tv', 'digital', 'facebook']
        media_cols = [c for c in df.columns if any(k in c.lower() for k in media_kw)]
        sales_col = next((c for c in df.columns if 'sales' in c.lower()), None)
        lines.append(_section("4. BUSINESS HIGHLIGHTS", "\n".join([
            f"   Media channels identified : {len(media_cols)}",
            f"   Sales variable            : {sales_col or 'Not detected'}",
            "   Focus Area                : Optimize media budget allocation across channels",
            "   Action Item               : Run channel attribution model for ROI insights",
        ])))
    elif dataset_type == 'sentiment':
        rating_col = next((c for c in df.columns if 'rating' in c.lower() or 'score' in c.lower()), None)
        avg_rating = f"{df[rating_col].mean():.2f}" if rating_col and rating_col in df.columns else "N/A"
        lines.append(_section("4. BUSINESS HIGHLIGHTS", "\n".join([
            f"   Average rating            : {avg_rating}",
            "   Focus Area                : Customer satisfaction and loyalty",
            "   Action Item               : Address top complaint themes from negative reviews",
        ])))
    else:
        lines.append(_section("4. BUSINESS HIGHLIGHTS", "\n".join([
            "   Focus Area                : General data exploration and pattern discovery",
            "   Action Item               : Identify key business drivers from numerical columns",
        ])))

    # Strategic recommendations
    recs = {
        'mmm': [
            "1. Prioritise media channels with highest sales correlation for next budget cycle.",
            "2. Implement adstock decay models for long-lasting media (TV, Radio).",
            "3. A/B test creative content for digital channels showing low correlation.",
            "4. Set up weekly dashboard tracking media spend vs. sales lift.",
            "5. Consider external variables (GDP, festivals) in model specification.",
        ],
        'sentiment': [
            "1. Resolve top-complaint themes within 30 days to improve NPS.",
            "2. Amplify positive feedback in marketing communications.",
            "3. Set up real-time sentiment monitoring for social media channels.",
            "4. Train customer support team on top 5 recurring complaint categories.",
            "5. Measure sentiment month-over-month as a business KPI.",
        ],
        'generic': [
            "1. Profile data distributions and remove or impute outliers.",
            "2. Identify correlations between key numerical variables.",
            "3. Segment data by categorical dimensions for deeper analysis.",
            "4. Establish data collection cadence and quality gate process.",
            "5. Define target KPIs and model objectives before further analysis.",
        ],
    }
    rec_lines = recs.get(dataset_type, recs['generic'])
    lines.append(_section("5. STRATEGIC RECOMMENDATIONS", "\n".join(f"   {r}" for r in rec_lines)))

    lines.append(_footer())
    content = "".join(lines)

    summary = {
        "rows": rows,
        "columns": cols,
        "dataset_type": type_label,
        "data_completeness": f"{(rows * cols - int(miss.sum())) / (rows * cols) * 100:.1f}%",
    }
    return {"content": content, "summary": summary}


# ── Report plans (what to generate per dataset type) ─────────────────────────
# Each entry: (reportType, title, generator_callable_or_partial)
# Add new report types here — no other changes needed.

def _build_report_plan(dataset_type: str, df: pd.DataFrame) -> List[Dict]:
    """
    Returns a list of report descriptors for the given dataset type.
    Each descriptor has: reportType, title, content, summary.
    """
    results: List[Dict] = []

    def _add(report_type: str, title: str, fn, *args):
        try:
            out = fn(df, *args) if args else fn(df)
            results.append({
                "reportType": report_type,
                "title": title,
                "content": out["content"],
                "summary": out["summary"],
            })
        except Exception as e:
            # Don't let one report failure block others
            results.append({
                "reportType": report_type,
                "title": title,
                "content": f"Report generation failed: {e}",
                "summary": {},
            })

    # Every dataset gets a Dataset Understanding report first
    _add("summary", "Dataset Understanding Report", _generate_data_understanding_report)

    if dataset_type == "mmm":
        _add("marketing",  "Market Mix Modeling Report", _generate_mmm_report)
        _add("forecast",   "Sales Forecast Report",      _generate_forecast_report)
        _add("summary",    "Executive Summary Report",   _generate_executive_summary_report, dataset_type)

    elif dataset_type == "sentiment":
        _add("sentiment",  "Sentiment Analysis Report",  _generate_sentiment_report)
        _add("summary",    "Executive Summary Report",   _generate_executive_summary_report, dataset_type)

    else:  # generic
        _add("summary",    "Executive Summary Report",   _generate_executive_summary_report, dataset_type)

    return results


# ── Public entry point ────────────────────────────────────────────────────────

def run_pipeline(file_path: str) -> Dict[str, Any]:
    """
    Full pipeline entry point called from FastAPI.

    Args:
        file_path: Absolute path to the uploaded CSV file.

    Returns:
        {
          "datasetType": str,
          "reports": [
            { "reportType": str, "title": str, "content": str, "summary": dict },
            ...
          ],
          "summary": { "rows": int, "columns": int }
        }
    """
    path = Path(file_path)

    df = pd.read_csv(str(path))
    dataset_type = detect_dataset_type(df, path.name)
    reports      = _build_report_plan(dataset_type, df)
    rows, cols   = df.shape

    print(f"[Pipeline] Detected dataset type: {dataset_type}")
    print(f"[Pipeline] Generating {len(reports)} report(s): {[r['title'] for r in reports]}")

    return {
        "datasetType": dataset_type,
        "reports": reports,
        "summary": {"rows": rows, "columns": cols},
    }
