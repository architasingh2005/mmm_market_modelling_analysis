import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BarChart3, Database, RefreshCw, Folder, TrendingUp,
  DollarSign, Hash, Layers, CheckCircle2, AlertCircle,
  BarChart2, Award, FileSpreadsheet, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell
} from 'recharts';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
  return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toLocaleString();
}

/* ─── Custom Recharts Tooltip ─────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(18, 18, 24, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(240,240,248,0.5)', fontFamily: 'monospace' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ margin: '2px 0', fontSize: 13, fontWeight: 600, color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? (entry.value > 100 ? formatCurrency(entry.value) : entry.value.toFixed(2)) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN ANALYTICS PAGE
═══════════════════════════════════════════════════════════════════════════ */
const Analytics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDatasetId = searchParams.get('datasetId') || '';

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(initialDatasetId);
  const [analytics, setAnalytics] = useState(null);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');

  // Selected Channel Filter for interactive charts
  const [channelFilter, setChannelFilter] = useState('All');

  /* 1. Fetch available datasets */
  const fetchDatasets = useCallback(async () => {
    setLoadingDatasets(true);
    try {
      const res = await fetch(`${API}/datasets`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        const dsList = data.datasets || [];
        setDatasets(dsList);
        if (dsList.length > 0 && !selectedDatasetId) {
          setSelectedDatasetId(dsList[0]._id);
        }
      }
    } catch (err) {
      console.error('[Analytics] fetchDatasets error:', err);
    } finally {
      setLoadingDatasets(false);
    }
  }, [selectedDatasetId]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  /* 2. Fetch dataset analytics when selectedDatasetId changes */
  const fetchAnalytics = useCallback(async (dsId) => {
    if (!dsId) return;
    setLoadingAnalytics(true);
    setError('');
    try {
      const res = await fetch(`${API}/datasets/${dsId}/analytics`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch dataset analytics');
      }
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('[Analytics] fetchAnalytics error:', err);
      setError(err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      setSearchParams({ datasetId: selectedDatasetId });
      fetchAnalytics(selectedDatasetId);
    }
  }, [selectedDatasetId, fetchAnalytics, setSearchParams]);

  /* Handler for dataset selector dropdown */
  const handleDatasetChange = (e) => {
    const dsId = e.target.value;
    setSelectedDatasetId(dsId);
    setChannelFilter('All');
  };

  const selectedDatasetObj = useMemo(() => {
    return datasets.find(d => String(d._id) === String(selectedDatasetId));
  }, [datasets, selectedDatasetId]);

  const kpis = analytics?.kpis;
  const quality = analytics?.quality;
  const salesPerf = analytics?.sales_performance;
  const mktPerf = analytics?.marketing_performance;
  const correlations = analytics?.correlations || [];

  return (
    <div style={styles.page}>
      {/* ── Header Bar ── */}
      <div style={styles.headerBar}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={styles.eyebrow}>
              <BarChart3 size={14} style={{ marginRight: 5 }} /> Real-time BI Engine
            </span>
          </div>
          <h1 style={styles.pageTitle}>Business & Marketing Analytics</h1>
          <p style={styles.subtitle}>
            Centralized dynamic performance analysis, channel attribution, and correlation matrix.
          </p>
        </div>

        {/* Dataset Selector Dropdown */}
        <div style={styles.selectorCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color="#6C63FF" />
            <span style={styles.selectLabel}>Select Dataset:</span>
          </div>

          <select
            value={selectedDatasetId}
            onChange={handleDatasetChange}
            disabled={loadingDatasets || datasets.length === 0}
            style={styles.selectInput}
          >
            {loadingDatasets ? (
              <option value="">Loading datasets…</option>
            ) : datasets.length === 0 ? (
              <option value="">No datasets available</option>
            ) : (
              datasets.map(ds => (
                <option key={ds._id} value={ds._id}>
                  {ds.datasetName || ds.originalFilename}
                </option>
              ))
            )}
          </select>

          <button
            onClick={() => fetchAnalytics(selectedDatasetId)}
            disabled={loadingAnalytics || !selectedDatasetId}
            style={styles.refreshBtn}
            title="Refresh Analytics"
          >
            <RefreshCw size={14} className={loadingAnalytics ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Main Analytics Content ── */}
      {loadingAnalytics ? (
        <div style={styles.loadingBox}>
          <RefreshCw size={28} className="spin" color="#6C63FF" style={{ marginBottom: 12 }} />
          <p style={{ color: '#F0F0F8', fontWeight: 600, fontSize: 16, margin: '0 0 4px' }}>
            Computing Dataset Analytics…
          </p>
          <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: 13, margin: 0 }}>
            Extracting KPIs, time series trends, and MMM attribution models.
          </p>
        </div>
      ) : error ? (
        <div style={styles.errorBox}>
          <AlertCircle size={32} color="#F87171" style={{ marginBottom: 12 }} />
          <p style={{ color: '#F0F0F8', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>Analytics Fetch Failed</p>
          <p style={{ color: 'rgba(240,240,248,0.5)', fontSize: 13, margin: '0 0 16px' }}>{error}</p>
          <button onClick={() => fetchAnalytics(selectedDatasetId)} style={styles.retryBtn}>Retry Analytics</button>
        </div>
      ) : !selectedDatasetId || datasets.length === 0 ? (
        <div style={styles.emptyBox}>
          <Folder size={36} color="rgba(108,99,255,0.6)" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#F0F0F8', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No Dataset Selected</h3>
          <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: 13, maxWidth: 360, margin: '0 0 20px', lineHeight: 1.6 }}>
            Upload a CSV or Excel dataset to generate real-time KPIs, sales performance charts, and attribution models.
          </p>
          <Link to="/upload" style={styles.ctaBtn}>Upload Dataset</Link>
        </div>
      ) : analytics ? (
        <div style={styles.contentGrid}>

          {/* ── SECTION 1: Dynamic KPI Cards ── */}
          <div style={styles.kpiGrid}>
            <KPICard
              label={`Total Sales (${kpis?.sales_variable || 'Revenue'})`}
              value={formatCurrency(kpis?.total_sales)}
              icon={DollarSign}
              color="#34D399"
              bg="rgba(52,211,153,0.1)"
              border="rgba(52,211,153,0.2)"
            />
            <KPICard
              label="Average Sales per Record"
              value={formatCurrency(kpis?.mean_sales)}
              icon={TrendingUp}
              color="#38BDF8"
              bg="rgba(56,189,248,0.1)"
              border="rgba(56,189,248,0.2)"
            />
            <KPICard
              label="Total Marketing Spend"
              value={kpis?.total_spend > 0 ? formatCurrency(kpis?.total_spend) : 'Not available for this dataset'}
              icon={BarChart2}
              color="#A78BFA"
              bg="rgba(167,139,250,0.1)"
              border="rgba(167,139,250,0.2)"
            />
            <KPICard
              label="Marketing Channels"
              value={kpis?.media_channel_count || 0}
              icon={Layers}
              color="#FB923C"
              bg="rgba(251,146,60,0.1)"
              border="rgba(251,146,60,0.2)"
            />
            <KPICard
              label="Dataset Observations"
              value={formatNumber(kpis?.record_count)}
              icon={Hash}
              color="#E879F9"
              bg="rgba(232,121,249,0.1)"
              border="rgba(232,121,249,0.2)"
            />
            <KPICard
              label="Data Completeness"
              value={quality ? `${(100 - (quality.missing_values / Math.max(1, quality.rows * quality.columns)) * 100).toFixed(1)}%` : '100%'}
              icon={CheckCircle2}
              color="#6C63FF"
              bg="rgba(108,99,255,0.1)"
              border="rgba(108,99,255,0.2)"
            />
          </div>

          {/* ── SECTION 2: Sales Performance Visualizations ── */}
          <div style={styles.sectionHeader}>
            <TrendingUp size={18} color="#38BDF8" />
            <h2 style={styles.sectionTitle}>Sales Performance Overview</h2>
          </div>

          <div style={styles.chartsGrid}>
            {/* Sales Trend Chart */}
            <div style={{ ...styles.card, gridColumn: 'span 2' }}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>Sales Trend Over Time</h3>
                  <p style={styles.cardSub}>Aggregated time-series trend for target variable: <strong>{kpis?.sales_variable}</strong></p>
                </div>
              </div>

              {salesPerf?.has_date && salesPerf?.trend?.length > 0 ? (
                <div style={{ height: 280, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesPerf.trend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" stroke="rgba(240,240,248,0.4)" fontSize={11} tickLine={false} />
                      <YAxis stroke="rgba(240,240,248,0.4)" fontSize={11} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="sales" name="Sales" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NotAvailableBadge message="No Date/Week time-series column detected in this dataset." />
              )}
            </div>

            {/* Sales by Geography */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>Sales by Geography</h3>
                  <p style={styles.cardSub}>Regional sales aggregation</p>
                </div>
              </div>
              {salesPerf?.has_geo && salesPerf?.by_geo?.length > 0 ? (
                <div style={{ height: 240, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesPerf.by_geo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="geo" stroke="rgba(240,240,248,0.4)" fontSize={11} tickLine={false} />
                      <YAxis stroke="rgba(240,240,248,0.4)" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sales" name="Sales" fill="#A78BFA" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NotAvailableBadge message="Geographic columns (Geo/Region/State) not present in this dataset." />
              )}
            </div>

            {/* Sales by Brand */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>Sales by Brand / Category</h3>
                  <p style={styles.cardSub}>Product category distribution</p>
                </div>
              </div>
              {salesPerf?.has_brand && salesPerf?.by_brand?.length > 0 ? (
                <div style={{ height: 240, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesPerf.by_brand} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="brand" stroke="rgba(240,240,248,0.4)" fontSize={11} tickLine={false} />
                      <YAxis stroke="rgba(240,240,248,0.4)" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sales" name="Sales" fill="#F472B6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NotAvailableBadge message="Brand/Category columns not present in this dataset." />
              )}
            </div>
          </div>

          {/* ── SECTION 3: Marketing Channel Performance & MMM Causal Attribution ── */}
          <div style={styles.sectionHeader}>
            <Award size={18} color="#4ADE80" />
            <h2 style={styles.sectionTitle}>Marketing Channel Performance & MMM Attribution</h2>
          </div>

          {mktPerf?.mmm_status === 'MMM_COMPLETED' && mktPerf?.roi_ranking?.length > 0 ? (
            <div style={styles.chartsGrid}>
              {/* Top ROI Channel Card */}
              {mktPerf.top_roi_channel && (
                <div style={{ ...styles.card, background: 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(18,18,24,0.95) 100%)', border: '1px solid rgba(74,222,128,0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={styles.topIconBox}>
                      <Award size={20} color="#4ADE80" />
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#4ADE80', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                        TOP PERFORMING CHANNEL
                      </span>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F8', margin: '2px 0 0' }}>
                        {mktPerf.top_roi_channel.channel}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxLabel}>Calculated ROI</span>
                      <span style={{ ...styles.statBoxVal, color: '#4ADE80' }}>
                        {mktPerf.top_roi_channel.roi.toFixed(2)}x
                      </span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxLabel}>Attributed Revenue</span>
                      <span style={styles.statBoxVal}>
                        {formatCurrency(mktPerf.top_roi_channel.attributed_revenue)}
                      </span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxLabel}>Channel Spend</span>
                      <span style={styles.statBoxVal}>
                        {formatCurrency(mktPerf.top_roi_channel.spend)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Spend vs Attributed Revenue Chart */}
              <div style={{ ...styles.card, gridColumn: mktPerf.top_roi_channel ? 'span 2' : 'span 3' }}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>Spend vs. Attributed Revenue</h3>
                    <p style={styles.cardSub}>Causal regression attribution model results</p>
                  </div>
                </div>

                <div style={{ height: 240, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mktPerf.roi_ranking} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="channel" stroke="rgba(240,240,248,0.4)" fontSize={11} tickLine={false} />
                      <YAxis stroke="rgba(240,240,248,0.4)" fontSize={11} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Bar dataKey="spend" name="Spend ($)" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="attributed_revenue" name="Attributed Revenue ($)" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ROI Ranking Table */}
              <div style={{ ...styles.card, gridColumn: 'span 3' }}>
                <h3 style={{ ...styles.cardTitle, marginBottom: 16 }}>Full Channel ROI & Attribution Ranking</h3>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>Channel Name</th>
                        <th style={styles.th}>Total Spend</th>
                        <th style={styles.th}>Attributed Revenue</th>
                        <th style={styles.th}>Contribution %</th>
                        <th style={styles.th}>Calculated ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mktPerf.roi_ranking.map((ch) => (
                        <tr key={ch.channel} style={styles.tr}>
                          <td style={styles.td}>
                            <span style={styles.rankBadge}>#{ch.rank}</span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: 600, color: '#F0F0F8' }}>{ch.channel}</td>
                          <td style={styles.td}>{formatCurrency(ch.spend)}</td>
                          <td style={{ ...styles.td, color: '#4ADE80', fontWeight: 600 }}>{formatCurrency(ch.attributed_revenue)}</td>
                          <td style={styles.td}>{ch.contribution_pct ? `${ch.contribution_pct.toFixed(1)}%` : '—'}</td>
                          <td style={{ ...styles.td, fontWeight: 700, color: ch.roi >= 2.0 ? '#4ADE80' : ch.roi >= 1.0 ? '#38BDF8' : '#F87171' }}>
                            {ch.roi.toFixed(2)}x
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <NotAvailableBadge message="MMM Attribution Analysis has not been completed for this dataset. Upload a marketing mix dataset or generate an executive report to view ROI rankings." />
            </div>
          )}

          {/* ── SECTION 4: Pearson Correlation Analysis ── */}
          <div style={styles.sectionHeader}>
            <BarChart2 size={18} color="#FB923C" />
            <h2 style={styles.sectionTitle}>Pearson Correlation Analysis (Sales Correlation)</h2>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>Linear Correlation with {kpis?.sales_variable}</h3>
                <p style={styles.cardSub}>Statistical Pearson r coefficient (Note: Pearson correlation measures linear association, not causal ROI)</p>
              </div>
            </div>

            {correlations.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 12 }}>
                {correlations.map(c => (
                  <div key={c.channel} style={styles.corrCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F8' }}>{c.channel}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(251,146,60,0.12)', color: '#FB923C', fontWeight: 600, fontFamily: 'monospace' }}>
                        r = {c.pearson_r.toFixed(3)}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, Math.max(5, Math.abs(c.pearson_r) * 100))}%`, background: c.pearson_r >= 0 ? '#FB923C' : '#F87171', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', marginTop: 6, display: 'block', textTransform: 'capitalize' }}>
                      {c.interpretation} association
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <NotAvailableBadge message="No numerical marketing spend variables detected to calculate Pearson correlation." />
            )}
          </div>

          {/* ── SECTION 5: Dataset Quality & Schema Audit ── */}
          <div style={styles.sectionHeader}>
            <FileSpreadsheet size={18} color="#E879F9" />
            <h2 style={styles.sectionTitle}>Dataset Quality & Schema Audit</h2>
          </div>

          <div style={styles.card}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              <div style={styles.auditBox}>
                <span style={styles.auditBoxLabel}>Row Count</span>
                <span style={styles.auditBoxVal}>{formatNumber(quality?.rows)}</span>
              </div>
              <div style={styles.auditBox}>
                <span style={styles.auditBoxLabel}>Column Count</span>
                <span style={styles.auditBoxVal}>{formatNumber(quality?.columns)}</span>
              </div>
              <div style={styles.auditBox}>
                <span style={styles.auditBoxLabel}>Missing Values</span>
                <span style={{ ...styles.auditBoxVal, color: quality?.missing_values > 0 ? '#F87171' : '#4ADE80' }}>
                  {formatNumber(quality?.missing_values)}
                </span>
              </div>
              <div style={styles.auditBox}>
                <span style={styles.auditBoxLabel}>Duplicate Rows</span>
                <span style={{ ...styles.auditBoxVal, color: quality?.duplicate_rows > 0 ? '#FB923C' : '#4ADE80' }}>
                  {formatNumber(quality?.duplicate_rows)}
                </span>
              </div>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F8', marginBottom: 12 }}>Detected Columns & Types</h4>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Column Name</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Data Type</th>
                    <th style={styles.th}>Null Count</th>
                    <th style={styles.th}>Unique Values</th>
                    <th style={styles.th}>Mean / Sample</th>
                  </tr>
                </thead>
                <tbody>
                  {(quality?.schema || []).map(col => (
                    <tr key={col.name} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#F0F0F8', fontFamily: 'monospace' }}>{col.name}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase',
                          background: col.type === 'numeric' ? 'rgba(56,189,248,0.12)' : 'rgba(232,121,249,0.12)',
                          color: col.type === 'numeric' ? '#38BDF8' : '#E879F9',
                        }}>
                          {col.type}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 11 }}>{col.dtype}</td>
                      <td style={{ ...styles.td, color: col.null_count > 0 ? '#F87171' : 'rgba(240,240,248,0.5)' }}>{col.null_count}</td>
                      <td style={styles.td}>{col.unique_count}</td>
                      <td style={styles.td}>{col.mean !== undefined && col.mean !== null ? col.mean.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : null}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

/* ─── Helper Subcomponents ────────────────────────────────────────────────── */

const KPICard = ({ label, value, icon: Icon, color, bg, border }) => (
  <div style={{
    backgroundColor: '#121218',
    border: `1px solid ${border || 'rgba(255,255,255,0.07)'}`,
    borderRadius: 16,
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: 'rgba(240,240,248,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'monospace' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#F0F0F8', letterSpacing: '-0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </p>
    </div>
  </div>
);

const NotAvailableBadge = ({ message }) => (
  <div style={{
    padding: '36px 20px', textAlign: 'center',
    background: 'rgba(255,255,255,0.015)',
    border: '1px dashed rgba(255,255,255,0.08)',
    borderRadius: 14, margin: '10px 0',
  }}>
    <ShieldAlert size={24} color="rgba(240,240,248,0.3)" style={{ marginBottom: 8 }} />
    <p style={{ color: 'rgba(240,240,248,0.45)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
      {message}
    </p>
  </div>
);

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = {
  page: {
    maxWidth: '1400px',
    margin: '0 auto',
    paddingBottom: '64px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: '#6C63FF',
    fontFamily: 'monospace',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#F0F0F8',
    margin: '4px 0 6px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(240,240,248,0.5)',
    margin: 0,
  },
  selectorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#121218',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '10px 16px',
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(240,240,248,0.7)',
    whiteSpace: 'nowrap',
  },
  selectInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '8px 12px',
    color: '#F0F0F8',
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    minWidth: 220,
    cursor: 'pointer',
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(240,240,248,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  loadingBox: {
    padding: '80px 20px',
    textAlign: 'center',
    backgroundColor: '#121218',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  errorBox: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#121218',
    borderRadius: 20,
    border: '1px solid rgba(248,113,113,0.2)',
  },
  emptyBox: {
    padding: '80px 20px',
    textAlign: 'center',
    backgroundColor: '#121218',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ctaBtn: {
    padding: '10px 22px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
    color: 'white',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 13,
  },
  retryBtn: {
    padding: '9px 20px',
    borderRadius: 10,
    background: 'rgba(248,113,113,0.15)',
    border: '1px solid rgba(248,113,113,0.3)',
    color: '#F87171',
    fontWeight: 600,
    cursor: 'pointer',
  },
  contentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#F0F0F8',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '18px',
  },
  card: {
    backgroundColor: '#121218',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: '22px',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#F0F0F8',
    margin: '0 0 2px',
  },
  cardSub: {
    fontSize: 12,
    color: 'rgba(240,240,248,0.4)',
    margin: 0,
  },
  topIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'rgba(74,222,128,0.15)',
    border: '1px solid rgba(74,222,128,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '12px',
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(240,240,248,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    display: 'block',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  statBoxVal: {
    fontSize: 16,
    fontWeight: 800,
    color: '#F0F0F8',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(240,240,248,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    fontFamily: 'monospace',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  td: {
    padding: '12px 14px',
    fontSize: 13,
    color: 'rgba(240,240,248,0.7)',
  },
  rankBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    background: 'rgba(108,99,255,0.12)',
    color: '#8B83FF',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  corrCard: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: '14px',
  },
  auditBox: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '14px',
  },
  auditBoxLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(240,240,248,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    display: 'block',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  auditBoxVal: {
    fontSize: 18,
    fontWeight: 800,
    color: '#F0F0F8',
  },
};

export default Analytics;
