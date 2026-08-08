"""
Data Understanding Module

Comprehensive data exploration and analysis for Market Mix Modeling dataset.
Includes functions for loading, analyzing, and generating insights from data.
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend — prevents GUI window hang on Windows/servers
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import Dict, Tuple, List
import warnings
warnings.filterwarnings('ignore')


class DataUnderstanding:
    """
    A comprehensive class for data exploration and analysis of MMM datasets.
    """
    
    def __init__(self, filepath: str):
        """
        Initialize with dataset filepath.
        
        Args:
            filepath: Path to the CSV file
        """
        self.filepath = filepath
        self.df = None
        self.analysis_results = {}
        
    def load_data(self) -> pd.DataFrame:
        """
        Load dataset from CSV file.
        
        Returns:
            Loaded DataFrame
        """
        try:
            self.df = pd.read_csv(self.filepath)
            print(f"✓ Dataset loaded successfully")
            return self.df
        except FileNotFoundError:
            print(f"✗ Error: File not found at {self.filepath}")
            return None
        except Exception as e:
            print(f"✗ Error loading file: {str(e)}")
            return None
    
    def get_shape(self) -> Tuple[int, int]:
        """Get dataset shape (rows, columns)."""
        if self.df is None:
            return None
        return self.df.shape
    
    def get_data_types(self) -> pd.Series:
        """Get data types of all columns."""
        if self.df is None:
            return None
        return self.df.dtypes
    
    def get_missing_values(self) -> pd.DataFrame:
        """
        Analyze missing values in dataset.
        
        Returns:
            DataFrame with missing value statistics
        """
        if self.df is None:
            return None
        
        missing_data = pd.DataFrame({
            'Column': self.df.columns,
            'Missing_Count': self.df.isnull().sum().values,
            'Missing_Percentage': (self.df.isnull().sum().values / len(self.df) * 100).round(2)
        })
        
        missing_data = missing_data[missing_data['Missing_Count'] > 0].sort_values(
            'Missing_Count', ascending=False
        )
        
        return missing_data
    
    def get_duplicate_rows(self) -> int:
        """Get count of duplicate rows."""
        if self.df is None:
            return None
        return self.df.duplicated().sum()
    
    def get_unique_values(self) -> pd.DataFrame:
        """
        Get unique value counts for each column.
        
        Returns:
            DataFrame with unique value statistics
        """
        if self.df is None:
            return None
        
        unique_data = pd.DataFrame({
            'Column': self.df.columns,
            'Unique_Values': self.df.nunique().values,
            'Data_Type': self.df.dtypes.values
        })
        
        return unique_data.sort_values('Unique_Values', ascending=False)
    
    def get_summary_statistics(self) -> pd.DataFrame:
        """Get summary statistics for numerical columns."""
        if self.df is None:
            return None
        return self.df.describe().round(2)
    
    def get_business_interpretation(self) -> Dict[str, str]:
        """
        Provide business interpretation for each column.
        
        Returns:
            Dictionary with column names as keys and interpretations as values
        """
        interpretations = {
            'Week': 'Weekly time period for transaction. Useful for time-series analysis and trend identification.',
            'Geo': 'Geographic region/state. Critical for regional performance comparison and localized strategy.',
            'Brand': 'Brand name. Enables performance tracking across different product brands.',
            'SKU': 'Stock Keeping Unit (product variant). Tracks individual product performance within brands.',
            'Sales_Units': 'Number of units sold. Primary volume metric for demand analysis.',
            'Sales_Value': 'Revenue generated from sales. Key monetary metric for ROI calculations.',
            'MRP': 'Maximum Retail Price. Official product pricing reference point.',
            'Net_Price': 'Actual selling price after discounts. Reflects price elasticity and promotional impact.',
            'Feature_Flag': 'Indicates in-store feature/prominent display (0=No, 1=Yes). Measures merchandising impact.',
            'Display_Flag': 'Indicates point-of-sale display presence (0=No, 1=Yes). Tracks visual prominence.',
            'TPR_Flag': 'Temporary Price Reduction flag (0=No, 1=Yes). Identifies promotional discounting periods.',
            'Trade_Spend': 'Investment in trade promotions/discounts. Quantifies promotional spend per week.',
            'TV_Impressions': 'TV advertising reach/impressions. Measures traditional media effectiveness.',
            'YouTube_Impressions': 'YouTube ad impressions. Tracks digital video advertising reach.',
            'Facebook_Impressions': 'Facebook social media impressions. Measures social reach and engagement.',
            'Instagram_Impressions': 'Instagram social media impressions. Visual platform performance metric.',
            'Print_Readership': 'Print media reach and readership. Traditional advertising effectiveness.',
            'Radio_Listenership': 'Radio advertisement reach. Audio media performance metric.',
            'FB_Banner_Content_Score': 'Facebook ad content quality/performance score. Measures ad effectiveness (0-100).',
            'IG_Banner_Content_Score': 'Instagram ad content quality/performance score. Visual ad quality metric.',
            'Weighted_Distribution': 'Distribution metric weighted by outlet importance. Availability vs. visibility.',
            'Numeric_Distribution': 'Percentage of stores stocking the product. Market coverage percentage.',
            'TDP': 'Total Distribution Points. Count of stores/outlets selling the product.',
            'NOS': 'Number of Shelves. In-store shelf space allocation.',
            'CPI': 'Consumer Price Index proxy/inflation. Economic context variable.',
            'GDP_Growth': 'GDP growth rate. Macroeconomic indicator affecting demand.',
            'Festival_Index': 'Festival/holiday impact index. Seasonal demand multiplier.',
            'Rainfall_Index': 'Rainfall/weather index. Environmental factor affecting sales.'
        }
        
        return interpretations
    
    def generate_full_report(self) -> str:
        """
        Generate comprehensive analysis report.
        
        Returns:
            Formatted report string
        """
        if self.df is None:
            return "Dataset not loaded"
        
        report = []
        report.append("=" * 80)
        report.append("MARKET MIX MODELING - DATA UNDERSTANDING REPORT")
        report.append("=" * 80)
        report.append("")
        
        # 1. Dataset Overview
        report.append("1. DATASET OVERVIEW")
        report.append("-" * 80)
        rows, cols = self.get_shape()
        report.append(f"   Total Rows: {rows:,}")
        report.append(f"   Total Columns: {cols}")
        report.append(f"   Memory Usage: {self.df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
        report.append("")
        
        # 2. Data Types
        report.append("2. DATA TYPES DISTRIBUTION")
        report.append("-" * 80)
        dtype_counts = self.df.dtypes.value_counts()
        for dtype, count in dtype_counts.items():
            report.append(f"   {str(dtype):15} : {count:3} columns")
        report.append("")
        
        # 3. Missing Values
        report.append("3. MISSING VALUES ANALYSIS")
        report.append("-" * 80)
        missing = self.get_missing_values()
        if len(missing) > 0:
            report.append(missing.to_string(index=False))
        else:
            report.append("   ✓ No missing values detected")
        report.append("")
        
        # 4. Duplicate Rows
        report.append("4. DUPLICATE ROWS ANALYSIS")
        report.append("-" * 80)
        dup_count = self.get_duplicate_rows()
        report.append(f"   Total Duplicate Rows: {dup_count}")
        report.append(f"   Percentage: {dup_count/len(self.df)*100:.2f}%")
        report.append("")
        
        # 5. Unique Values
        report.append("5. UNIQUE VALUES PER COLUMN")
        report.append("-" * 80)
        unique = self.get_unique_values()
        for idx, row in unique.head(15).iterrows():
            report.append(f"   {row['Column']:25} : {row['Unique_Values']:6} unique values ({str(row['Data_Type']):8})")
        if len(unique) > 15:
            report.append(f"   ... and {len(unique) - 15} more columns")
        report.append("")
        
        # 6. Summary Statistics
        report.append("6. SUMMARY STATISTICS (NUMERICAL COLUMNS)")
        report.append("-" * 80)
        stats = self.get_summary_statistics()
        report.append(stats.to_string())
        report.append("")
        
        # 7. Business Interpretation
        report.append("7. COLUMN BUSINESS INTERPRETATION")
        report.append("-" * 80)
        interpretations = self.get_business_interpretation()
        for col, interp in interpretations.items():
            if col in self.df.columns:
                report.append(f"\n   {col}:")
                report.append(f"   {interp}")
        report.append("")
        
        # 8. Key Insights
        report.append("8. KEY INSIGHTS & OBSERVATIONS")
        report.append("-" * 80)
        
        # Calculate insights
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        
        report.append(f"   • {len(numeric_cols)} numerical columns detected")
        report.append(f"   • {len(categorical_cols)} categorical columns detected")
        
        # Geo analysis
        if 'Geo' in self.df.columns:
            report.append(f"   • Geographic regions: {self.df['Geo'].nunique()}")
            report.append(f"     Top regions: {', '.join(self.df['Geo'].value_counts().head(3).index.tolist())}")
        
        # Brand analysis
        if 'Brand' in self.df.columns:
            report.append(f"   • Number of brands: {self.df['Brand'].nunique()}")
            report.append(f"     Brands: {', '.join(self.df['Brand'].unique().tolist())}")
        
        # Sales analysis
        if 'Sales_Value' in self.df.columns:
            report.append(f"   • Sales Value Range: ₹{self.df['Sales_Value'].min():.2f} - ₹{self.df['Sales_Value'].max():.2f}")
            report.append(f"   • Average Sales Value: ₹{self.df['Sales_Value'].mean():.2f}")
        
        if 'Sales_Units' in self.df.columns:
            report.append(f"   • Sales Units Range: {self.df['Sales_Units'].min():.2f} - {self.df['Sales_Units'].max():.2f}")
        
        # Media spend analysis
        media_cols = [col for col in self.df.columns if 'Impressions' in col or 'Reach' in col or 'Listenership' in col]
        if media_cols:
            report.append(f"   • {len(media_cols)} media channel variables detected")
        
        # Promotion analysis
        if 'Trade_Spend' in self.df.columns:
            report.append(f"   • Trade Spend Range: ₹{self.df['Trade_Spend'].min():.2f} - ₹{self.df['Trade_Spend'].max():.2f}")
        
        report.append("")
        report.append("=" * 80)
        
        return "\n".join(report)
    
    def create_visualizations(self, output_dir: str = None) -> None:
        """
        Create visualizations for key metrics.
        
        Args:
            output_dir: Directory to save visualization files
        """
        if self.df is None:
            print("Dataset not loaded")
            return
        
        if output_dir is None:
            output_dir = Path(self.filepath).parent.parent / "reports"
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Set style
        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (14, 10)
        
        # 1. Data Type Distribution
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('Data Understanding Visualizations', fontsize=16, fontweight='bold')
        
        # Plot 1: Data Types
        dtype_counts = self.df.dtypes.value_counts()
        axes[0, 0].bar(dtype_counts.index.astype(str), dtype_counts.values, color='steelblue')
        axes[0, 0].set_title('Data Types Distribution', fontweight='bold')
        axes[0, 0].set_xlabel('Data Type')
        axes[0, 0].set_ylabel('Count')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Plot 2: Unique Values (Top 10)
        unique_counts = self.df.nunique().sort_values(ascending=False).head(10)
        axes[0, 1].barh(range(len(unique_counts)), unique_counts.values, color='coral')
        axes[0, 1].set_yticks(range(len(unique_counts)))
        axes[0, 1].set_yticklabels(unique_counts.index)
        axes[0, 1].set_title('Top 10 Columns by Unique Values', fontweight='bold')
        axes[0, 1].set_xlabel('Unique Value Count')
        axes[0, 1].invert_yaxis()
        
        # Plot 3: Missing Values
        missing = self.df.isnull().sum()
        missing = missing[missing > 0].sort_values(ascending=False)
        if len(missing) > 0:
            axes[1, 0].bar(range(len(missing)), missing.values, color='lightcoral')
            axes[1, 0].set_xticks(range(len(missing)))
            axes[1, 0].set_xticklabels(missing.index, rotation=45, ha='right')
            axes[1, 0].set_title('Missing Values by Column', fontweight='bold')
            axes[1, 0].set_ylabel('Missing Count')
        else:
            axes[1, 0].text(0.5, 0.5, 'No Missing Values', 
                           horizontalalignment='center', verticalalignment='center',
                           transform=axes[1, 0].transAxes, fontsize=14, fontweight='bold')
            axes[1, 0].set_title('Missing Values Analysis', fontweight='bold')
        
        # Plot 4: Numerical Columns Statistics
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            numeric_summary = pd.DataFrame({
                'Mean': self.df[numeric_cols].mean(),
                'Std': self.df[numeric_cols].std(),
                'Min': self.df[numeric_cols].min(),
                'Max': self.df[numeric_cols].max()
            })
            
            axes[1, 1].axis('off')
            table_data = numeric_summary.head(8).round(2).values
            table_cols = numeric_summary.columns
            table_rows = numeric_summary.index[:8]
            
            table = axes[1, 1].table(cellText=table_data,
                                     rowLabels=table_rows,
                                     colLabels=table_cols,
                                     cellLoc='center',
                                     loc='center',
                                     bbox=[0, 0, 1, 1])
            table.auto_set_font_size(False)
            table.set_fontsize(8)
            table.scale(1, 1.5)
            axes[1, 1].set_title('Numerical Columns Summary (Top 8)', fontweight='bold', pad=20)
        
        plt.tight_layout()
        viz_path = output_dir / "data_understanding_visualizations.png"
        plt.savefig(viz_path, dpi=300, bbox_inches='tight')
        print(f"✓ Visualization saved: {viz_path}")
        plt.close()
        
        # 2. Categorical Distribution
        categorical_cols = self.df.select_dtypes(include=['object']).columns[:6]
        if len(categorical_cols) > 0:
            fig, axes = plt.subplots(2, 3, figsize=(15, 10))
            fig.suptitle('Categorical Columns Distribution', fontsize=16, fontweight='bold')
            
            for idx, col in enumerate(categorical_cols):
                row = idx // 3
                col_idx = idx % 3
                
                value_counts = self.df[col].value_counts().head(10)
                axes[row, col_idx].barh(range(len(value_counts)), value_counts.values, color='skyblue')
                axes[row, col_idx].set_yticks(range(len(value_counts)))
                axes[row, col_idx].set_yticklabels(value_counts.index)
                axes[row, col_idx].set_title(f'{col} (Top 10)', fontweight='bold')
                axes[row, col_idx].set_xlabel('Count')
                axes[row, col_idx].invert_yaxis()
            
            plt.tight_layout()
            cat_viz_path = output_dir / "categorical_distribution.png"
            plt.savefig(cat_viz_path, dpi=300, bbox_inches='tight')
            print(f"✓ Categorical visualization saved: {cat_viz_path}")
            plt.close()
    
    def save_report(self, output_path: str = None) -> None:
        """
        Save analysis report to text file.
        
        Args:
            output_path: Path to save the report
        """
        if output_path is None:
            output_dir = Path(self.filepath).parent.parent / "reports"
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / "data_understanding_report.txt"
        
        report = self.generate_full_report()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"✓ Report saved to: {output_path}")
        return str(output_path)
    
    def run_complete_analysis(self, output_dir: str = None) -> str:
        """
        Run complete data understanding analysis.
        
        Args:
            output_dir: Directory for outputs
            
        Returns:
            Generated report as string
        """
        if self.load_data() is None:
            return "Failed to load data"
        
        report = self.generate_full_report()
        print(report)
        
        self.save_report()
        self.create_visualizations(output_dir)
        
        return report
