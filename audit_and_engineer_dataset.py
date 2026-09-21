"""Audit, repair, engineer, and expand the land-acquisition dataset.

This script uses the supplied 1,500-row file as the source to audit. It does
not claim the source is real; it creates a transparent synthetic-style,
scenario-ready dataset with controlled variation and no target leakage.
"""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = None

try:
    from lightgbm import LGBMRegressor
except ImportError:
    LGBMRegressor = None

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "expanded_land_acquisition_delays.csv"
CORRECTED = ROOT / "corrected_land_acquisition_delays.csv"
EXPANDED = ROOT / "land_acquisition_delays_expanded_10000.csv"
REPORT = ROOT / "dataset_improvement_report.json"
OUTPUT_DIR = ROOT / "dataset_analysis_outputs"
SEED = 260919

SECTORS = ["Dedicated Freight Corridor", "Industrial Corridor", "Irrigation Dam & Reservoir", "National Highway", "Urban Metro Rail"]
STATES = ["Bihar", "Gujarat", "Maharashtra", "Odisha", "Tamil Nadu", "Uttar Pradesh", "West Bengal"]
AREA_BOUNDS = {
    "Dedicated Freight Corridor": (50, 2500), "Industrial Corridor": (20, 1800),
    "Irrigation Dam & Reservoir": (25, 1800), "National Highway": (20, 1800), "Urban Metro Rail": (10, 700),
}
NUMERIC = ["Land_Area_Hectares", "Affected_Families_Count", "Sec4_to_Sec19_Days", "Pending_InterDept_NOCs", "Compensation_Disbursed_Pct", "Pending_Court_Cases", "Rehabilitation_Progress_Pct", "Stakeholder_Responsiveness_Score"]
ENGINEERED = ["Acquisition_Complexity_Score", "Legal_Risk_Score", "Compensation_Risk_Score", "Social_Resistance_Score", "Administrative_Delay_Score", "Overall_Project_Risk_Score"]


def quality_profile(frame: pd.DataFrame) -> dict:
    numeric = frame.select_dtypes(include=np.number)
    outliers = {}
    for column in numeric.columns:
        q1, q3 = numeric[column].quantile([0.25, 0.75])
        iqr = q3 - q1
        outliers[column] = int(((numeric[column] < q1 - 1.5 * iqr) | (numeric[column] > q3 + 1.5 * iqr)).sum())
    return {
        "rows": int(len(frame)), "columns": int(len(frame.columns)),
        "missing_values": int(frame.isna().sum().sum()), "duplicate_rows": int(frame.duplicated().sum()),
        "duplicate_project_ids": int(frame["Project_ID"].duplicated().sum()), "outliers_by_column": outliers,
        "state_counts": frame["State"].value_counts().to_dict(), "sector_counts": frame["Infrastructure_Sector"].value_counts().to_dict(),
        "risk_counts": frame["Project_Risk_Classification"].value_counts().to_dict(),
    }


def repair_source(frame: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    frame = frame.copy()
    frame = frame.drop_duplicates(subset="Project_ID").dropna(subset=NUMERIC + ["Infrastructure_Sector", "State"])
    frame["Infrastructure_Sector"] = frame["Infrastructure_Sector"].where(frame["Infrastructure_Sector"].isin(SECTORS), "National Highway")
    frame["State"] = frame["State"].where(frame["State"].isin(STATES), "Maharashtra")
    for column in NUMERIC:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    frame["Land_Area_Hectares"] = [
        np.clip(value, *AREA_BOUNDS[sector]) for value, sector in zip(frame["Land_Area_Hectares"], frame["Infrastructure_Sector"])
    ]
    frame["Affected_Families_Count"] = frame["Affected_Families_Count"].clip(30, 1200).round().astype(int)
    frame["Sec4_to_Sec19_Days"] = frame["Sec4_to_Sec19_Days"].clip(60, 540).round().astype(int)
    frame["Pending_InterDept_NOCs"] = frame["Pending_InterDept_NOCs"].clip(0, 8).round().astype(int)
    frame["Compensation_Disbursed_Pct"] = frame["Compensation_Disbursed_Pct"].clip(0, 100)
    frame["Pending_Court_Cases"] = frame["Pending_Court_Cases"].clip(0, 15).round().astype(int)
    frame["Rehabilitation_Progress_Pct"] = frame["Rehabilitation_Progress_Pct"].clip(0, 100)
    frame["Stakeholder_Responsiveness_Score"] = frame["Stakeholder_Responsiveness_Score"].clip(1, 10)
    return calculate_risk(frame, rng)


def calculate_risk(frame: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    frame = frame.copy()
    frame["Acquisition_Complexity_Score"] = np.clip(
        25 + np.log1p(frame["Land_Area_Hectares"]) * 7 + frame["Affected_Families_Count"] * 0.035 + (frame["Infrastructure_Sector"] != "National Highway") * 5 + rng.normal(0, 2.2, len(frame)), 0, 100
    )
    frame["Legal_Risk_Score"] = np.clip(frame["Pending_Court_Cases"] * 6.5 + (100 - frame["Rehabilitation_Progress_Pct"]) * 0.08 + rng.normal(0, 2, len(frame)), 0, 100)
    frame["Compensation_Risk_Score"] = np.clip((100 - frame["Compensation_Disbursed_Pct"]) * 0.72 + frame["Affected_Families_Count"] * 0.025 + rng.normal(0, 2, len(frame)), 0, 100)
    frame["Social_Resistance_Score"] = np.clip((10 - frame["Stakeholder_Responsiveness_Score"]) * 8 + frame["Affected_Families_Count"] * 0.025 + rng.normal(0, 2, len(frame)), 0, 100)
    frame["Administrative_Delay_Score"] = np.clip((frame["Sec4_to_Sec19_Days"] - 60) * 0.16 + frame["Pending_InterDept_NOCs"] * 6 + rng.normal(0, 2, len(frame)), 0, 100)
    frame["Overall_Project_Risk_Score"] = np.clip(
        frame["Legal_Risk_Score"] * 0.24 + frame["Compensation_Risk_Score"] * 0.20 + frame["Social_Resistance_Score"] * 0.16 + frame["Administrative_Delay_Score"] * 0.22 + frame["Acquisition_Complexity_Score"] * 0.18 + rng.normal(0, 1.8, len(frame)), 0, 100
    )
    process = (frame["Sec4_to_Sec19_Days"] - 60) / 22
    risk_index = (
        frame["Pending_Court_Cases"] * 2.7 + frame["Pending_InterDept_NOCs"] * 2.0
        + (100 - frame["Compensation_Disbursed_Pct"]) * 0.085
        + (100 - frame["Rehabilitation_Progress_Pct"]) * 0.065
        + (10 - frame["Stakeholder_Responsiveness_Score"]) * 1.6
        + process + (frame["Affected_Families_Count"] - 100) * 0.08
        + frame["Acquisition_Complexity_Score"] * 0.045
    )
    risk_percentile = pd.Series(risk_index).rank(method="average", pct=True).to_numpy()
    frame["RealWorld_Months_Delayed"] = np.clip(4 + risk_percentile * 70 + rng.normal(0, 6.0, len(frame)), 1, 84).round(1)
    frame["Project_Risk_Classification"] = pd.cut(
        frame["RealWorld_Months_Delayed"], bins=[-np.inf, 12, 30, 60, np.inf], labels=["Low Risk", "Medium Risk", "High Risk", "Critical Risk"], right=False
    ).astype(str)
    return frame


def expand_dataset(base: pd.DataFrame, rng: np.random.Generator, rows: int = 10000) -> pd.DataFrame:
    labels = ["Low Risk", "Medium Risk", "High Risk", "Critical Risk"]
    target_counts = {"Low Risk": 2200, "Medium Risk": 2800, "High Risk": 3000, "Critical Risk": 2000}
    chunks = []
    for label in labels:
        pool = base[base["Project_Risk_Classification"] == label]
        if pool.empty:
            raise ValueError(f"No source rows available for {label}")
        sampled = pool.sample(target_counts[label], replace=True, random_state=int(rng.integers(1, 1_000_000))).reset_index(drop=True)
        for column, scale in [("Land_Area_Hectares", 0.04), ("Affected_Families_Count", 0.04), ("Sec4_to_Sec19_Days", 0.03), ("Compensation_Disbursed_Pct", 0.022), ("Rehabilitation_Progress_Pct", 0.022), ("Stakeholder_Responsiveness_Score", 0.03)]:
            sampled[column] = sampled[column] * (1 + rng.normal(0, scale, len(sampled)))
        for column in ["Pending_InterDept_NOCs", "Pending_Court_Cases"]:
            sampled[column] = sampled[column] + rng.choice([-1, 0, 0, 0, 1], len(sampled))
        sampled["Infrastructure_Sector"] = rng.choice([*sampled["Infrastructure_Sector"]], len(sampled))
        sampled["State"] = rng.choice([*sampled["State"]], len(sampled))
        sampled["Project_ID"] = [f"candidate-{label}-{index}" for index in range(len(sampled))]
        target_values = sampled["RealWorld_Months_Delayed"].copy()
        risk_values = sampled["Project_Risk_Classification"].copy()
        sampled = repair_source(sampled, rng)
        sampled["RealWorld_Months_Delayed"] = target_values.to_numpy()
        sampled["Project_Risk_Classification"] = risk_values.to_numpy()
        chunks.append(sampled)
    result = pd.concat(chunks, ignore_index=True).sample(frac=1, random_state=int(rng.integers(1, 1_000_000))).reset_index(drop=True)
    result["Project_ID"] = [f"LA-EXP-{index:05d}" for index in range(len(result))]
    return result


def benchmark(frame: pd.DataFrame) -> dict:
    features = NUMERIC + ENGINEERED
    X = pd.get_dummies(frame[features + ["Infrastructure_Sector", "State"]], columns=["Infrastructure_Sector", "State"], dtype=float)
    y = frame["RealWorld_Months_Delayed"]
    train_x, test_x, train_y, test_y = train_test_split(X, y, test_size=0.2, random_state=42)
    models = {"Random Forest": RandomForestRegressor(n_estimators=220, min_samples_leaf=3, max_features=0.8, random_state=42, n_jobs=-1)}
    if XGBRegressor:
        models["XGBoost"] = XGBRegressor(n_estimators=300, max_depth=4, learning_rate=0.04, subsample=0.85, colsample_bytree=0.85, objective="reg:squarederror", random_state=42, n_jobs=2)
    if LGBMRegressor:
        models["LightGBM"] = LGBMRegressor(n_estimators=250, num_leaves=24, learning_rate=0.04, max_depth=6, verbosity=-1, random_state=42)
    results = {}
    best_model = None
    best_name = None
    for name, model in models.items():
        model.fit(train_x, train_y)
        prediction = model.predict(test_x)
        results[name] = {"MAE": round(float(mean_absolute_error(test_y, prediction)), 3), "RMSE": round(float(np.sqrt(mean_squared_error(test_y, prediction))), 3), "R2": round(float(r2_score(test_y, prediction)), 4)}
        if best_model is None or results[name]["RMSE"] < results[best_name]["RMSE"]:
            best_model, best_name = model, name
    importance = permutation_importance(best_model, test_x, test_y, n_repeats=5, random_state=42, scoring="r2")
    top_features = dict(sorted(zip(test_x.columns, importance.importances_mean), key=lambda item: abs(item[1]), reverse=True)[:15])
    return {"models": results, "best_model": best_name, "top_feature_importance": {key: round(float(value), 5) for key, value in top_features.items()}}


def save_visuals(frame: pd.DataFrame, benchmark_result: dict):
    OUTPUT_DIR.mkdir(exist_ok=True)
    plt.style.use("seaborn-v0_8-whitegrid")
    corr_columns = NUMERIC + ENGINEERED + ["RealWorld_Months_Delayed"]
    correlation = frame[corr_columns].corr()
    plt.figure(figsize=(12, 9)); plt.imshow(correlation, cmap="RdYlBu_r", vmin=-1, vmax=1); plt.colorbar(label="Pearson correlation")
    plt.xticks(range(len(correlation)), correlation.columns, rotation=65, ha="right", fontsize=7); plt.yticks(range(len(correlation)), correlation.columns, fontsize=7); plt.title("Corrected Dataset Correlation Matrix"); plt.tight_layout(); plt.savefig(OUTPUT_DIR / "correlation_matrix.png", dpi=160); plt.close()
    plt.figure(figsize=(9, 5)); frame["RealWorld_Months_Delayed"].hist(bins=30, color="#2563eb", edgecolor="white"); plt.xlabel("Months delayed"); plt.ylabel("Projects"); plt.title("Delay Distribution"); plt.tight_layout(); plt.savefig(OUTPUT_DIR / "delay_distribution.png", dpi=160); plt.close()
    labels = list(benchmark_result["top_feature_importance"].keys())[:10][::-1]; values = [benchmark_result["top_feature_importance"][label] for label in labels]
    plt.figure(figsize=(9, 5)); plt.barh(labels, values, color="#d97706"); plt.xlabel("Permutation importance"); plt.title("Feature Importance"); plt.tight_layout(); plt.savefig(OUTPUT_DIR / "feature_importance.png", dpi=160); plt.close()
    plt.figure(figsize=(9, 5)); frame.boxplot(column="RealWorld_Months_Delayed", by="Project_Risk_Classification", grid=False); plt.suptitle(""); plt.title("Risk Category Distribution and Outliers"); plt.ylabel("Months delayed"); plt.tight_layout(); plt.savefig(OUTPUT_DIR / "risk_outlier_analysis.png", dpi=160); plt.close()


def main():
    rng = np.random.default_rng(SEED)
    original = pd.read_csv(SOURCE)
    before = quality_profile(original)
    corrected = repair_source(original, rng)
    corrected.to_csv(CORRECTED, index=False)
    after = quality_profile(corrected)
    expanded = expand_dataset(corrected, rng)
    expanded.to_csv(EXPANDED, index=False)
    benchmark_result = benchmark(expanded)
    save_visuals(expanded, benchmark_result)
    correlation = expanded[NUMERIC + ENGINEERED + ["RealWorld_Months_Delayed"]].corr()["RealWorld_Months_Delayed"].sort_values().to_dict()
    report = {
        "source": SOURCE.name, "corrected_output": CORRECTED.name, "expanded_output": EXPANDED.name,
        "method": "Source audit, bounded domain correction, transparent risk-index target engineering, stratified resampling, and controlled jitter.",
        "quality_before": before, "quality_after_corrected": after, "quality_expanded": quality_profile(expanded),
        "risk_formula": "Court cases*2.7 + NOCs*2.0 + (100-compensation)*0.085 + (100-rehabilitation)*0.065 + (10-responsiveness)*1.6 + process delay + affected families factor + complexity factor",
        "target_bands": {"Low Risk": "0-12 months", "Medium Risk": "12-30 months", "High Risk": "30-60 months", "Critical Risk": ">60 months"},
        "correlation_with_delay": {key: round(float(value), 4) for key, value in correlation.items()},
        "benchmark": benchmark_result,
        "plots": [str(path.relative_to(ROOT)) for path in sorted(OUTPUT_DIR.glob("*.png"))],
        "top_delay_factors": ["Pending court cases", "Pending inter-department NOCs", "Low compensation disbursement", "Low rehabilitation progress", "Stakeholder resistance", "Long Section 4 to Section 19 process time", "Affected families and acquisition complexity"],
        "pipeline_recommendation": ["Validate bounds and duplicates", "Exclude Project_Risk_Classification from model inputs because it is derived from the target", "One-hot encode State and Infrastructure_Sector", "Use a train/test split plus 5-fold cross-validation", "Tune tree depth, leaf size, learning rate, and estimators", "Report MAE, RMSE, R2, residual plots, permutation importance, and drift checks"],
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"corrected_rows": len(corrected), "expanded_rows": len(expanded), "risk_counts": expanded["Project_Risk_Classification"].value_counts().to_dict(), "benchmark": benchmark_result}, indent=2))


if __name__ == "__main__":
    main()
