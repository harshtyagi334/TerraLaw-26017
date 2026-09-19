"""
COMBINED ML TRAINING — SIH26017 Land Acquisition Delay Prediction
Integrates three datasets:
  1. land_acquisition_synthetic_dataset.csv   (700 records, original)
  2. expanded_land_acquisition_delays.csv     (1500 records, new)
  3. historical_land_acquisition_delays.csv   (5000 records, new)

All datasets are normalised to the same 8-feature schema, deduped, and
merged before training a Random Forest classifier on the combined corpus.
Results are written to real_model_results.json and the model to trained_model.pkl.
"""

import json
import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    f1_score, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import train_test_split
import joblib

try:
    import shap
except ImportError as error:
    raise RuntimeError('The shap package is required to train explainable models. Install requirements.txt first.') from error

ROOT = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# 1. FEATURE SCHEMA (canonical 8 features used by model_server.py)
# ---------------------------------------------------------------------------
FEATURE_COLS = [
    'land_area_hectares',
    'affected_families',
    'compensation_disbursed_pct',
    'pending_approvals_count',
    'legal_disputes_count',
    'possession_pct',
    'rr_progress_pct',
    'stakeholder_response_days',
]

# ---------------------------------------------------------------------------
# 2. LOAD & NORMALISE DATASET 1 — original synthetic (700 records)
# ---------------------------------------------------------------------------
df_orig = pd.read_csv(ROOT / 'land_acquisition_synthetic_dataset.csv')
df1 = pd.DataFrame({
    'land_area_hectares':       pd.to_numeric(df_orig['land_area_hectares'], errors='coerce'),
    'affected_families':        pd.to_numeric(df_orig['affected_families'], errors='coerce'),
    'compensation_disbursed_pct': pd.to_numeric(df_orig['compensation_disbursed_pct'], errors='coerce'),
    'pending_approvals_count':  pd.to_numeric(df_orig['pending_approvals_count'], errors='coerce'),
    'legal_disputes_count':     pd.to_numeric(df_orig['legal_disputes_count'], errors='coerce'),
    'possession_pct':           pd.to_numeric(df_orig['possession_pct'], errors='coerce'),
    'rr_progress_pct':          pd.to_numeric(df_orig['rr_progress_pct'], errors='coerce'),
    'stakeholder_response_days': pd.to_numeric(df_orig['stakeholder_response_days'], errors='coerce'),
    'delayed':                  df_orig['delayed'].astype(int),
    '_source':                  'original',
})
print(f"[1/3] Original dataset:  {len(df1)} records")

# ---------------------------------------------------------------------------
# 3. LOAD & NORMALISE DATASET 2 — expanded (1500 records)
#    Columns: Land_Area_Hectares, Affected_Families_Count, Compensation_Disbursed_Pct,
#             Pending_InterDept_NOCs, Pending_Court_Cases, Rehabilitation_Progress_Pct,
#             Stakeholder_Responsiveness_Score (1-10 scale), RealWorld_Months_Delayed,
#             Project_Risk_Classification ('High Risk' / 'Low/Medium Risk')
# ---------------------------------------------------------------------------
df_exp = pd.read_csv(ROOT / 'expanded_land_acquisition_delays.csv')

# Possession % is not directly available; approximate from rehab progress
# (for the expanded dataset, use rehabilitation progress as a proxy for possession)
df2 = pd.DataFrame({
    'land_area_hectares':       pd.to_numeric(df_exp['Land_Area_Hectares'], errors='coerce'),
    'affected_families':        pd.to_numeric(df_exp['Affected_Families_Count'], errors='coerce'),
    'compensation_disbursed_pct': pd.to_numeric(df_exp['Compensation_Disbursed_Pct'], errors='coerce'),
    'pending_approvals_count':  pd.to_numeric(df_exp['Pending_InterDept_NOCs'], errors='coerce'),
    'legal_disputes_count':     pd.to_numeric(df_exp['Pending_Court_Cases'], errors='coerce'),
    # No explicit possession %, approximate from rehabilitation progress
    'possession_pct':           pd.to_numeric(df_exp['Rehabilitation_Progress_Pct'], errors='coerce'),
    'rr_progress_pct':          pd.to_numeric(df_exp['Rehabilitation_Progress_Pct'], errors='coerce'),
    # Stakeholder responsiveness is 1-10 score; convert to response days (inverted: lower score → more days)
    'stakeholder_response_days': (10 - pd.to_numeric(df_exp['Stakeholder_Responsiveness_Score'], errors='coerce').clip(1, 10)) * 6 + 5,
    # Binary label: 'High Risk' → 1, else 0
    'delayed':                  (df_exp['Project_Risk_Classification'].str.strip() == 'High Risk').astype(int),
    '_source':                  'expanded',
})
print(f"[2/3] Expanded dataset:  {len(df2)} records  (High Risk={df2['delayed'].sum()}, Other={(~df2['delayed'].astype(bool)).sum()})")

# ---------------------------------------------------------------------------
# 4. LOAD & NORMALISE DATASET 3 — historical (5000 records)
#    Columns: land_area_hectares, affected_families_count, compensation_disbursed_pct,
#             pending_inter_dept_nocs, pending_court_cases, rehabilitation_progress_pct,
#             stakeholder_responsiveness_score (1-10), days_delayed, delay_risk_category (0/1/2)
# ---------------------------------------------------------------------------
df_hist = pd.read_csv(ROOT / 'historical_land_acquisition_delays.csv')

# delay_risk_category: 0=Low, 1=Medium, 2=High
# For binary classification: High (2) = delayed; 0,1 = not delayed
df3 = pd.DataFrame({
    'land_area_hectares':       pd.to_numeric(df_hist['land_area_hectares'], errors='coerce'),
    'affected_families':        pd.to_numeric(df_hist['affected_families_count'], errors='coerce'),
    'compensation_disbursed_pct': pd.to_numeric(df_hist['compensation_disbursed_pct'], errors='coerce'),
    'pending_approvals_count':  pd.to_numeric(df_hist['pending_inter_dept_nocs'], errors='coerce'),
    'legal_disputes_count':     pd.to_numeric(df_hist['pending_court_cases'], errors='coerce'),
    'possession_pct':           pd.to_numeric(df_hist['rehabilitation_progress_pct'], errors='coerce'),
    'rr_progress_pct':          pd.to_numeric(df_hist['rehabilitation_progress_pct'], errors='coerce'),
    # stakeholder_responsiveness_score 1-10 → response days (inverted)
    'stakeholder_response_days': (10 - pd.to_numeric(df_hist['stakeholder_responsiveness_score'], errors='coerce').clip(1, 10)) * 6 + 5,
    # delay_risk_category==2 → high risk delayed; 0 or 1 → not delayed
    'delayed':                  (pd.to_numeric(df_hist['delay_risk_category'], errors='coerce') == 2).astype(int),
    '_source':                  'historical',
})
print(f"[3/3] Historical dataset:{len(df3)} records  (High Risk={df3['delayed'].sum()}, Other={(~df3['delayed'].astype(bool)).sum()})")

# ---------------------------------------------------------------------------
# 5. COMBINE, DEDUPLICATE, CLEAN
# ---------------------------------------------------------------------------
df_all = pd.concat([df1, df2, df3], ignore_index=True)
print(f"\n[+] Combined (pre-clean): {len(df_all)} records")

# Drop duplicates on feature columns only
df_all = df_all.drop_duplicates(subset=FEATURE_COLS)
print(f"[+] After dedup:          {len(df_all)} records")

# Drop rows with null values in features or target
df_all = df_all.dropna(subset=FEATURE_COLS + ['delayed'])
print(f"[+] After null removal:   {len(df_all)} records")

# Clamp numeric ranges to valid domain
df_all['compensation_disbursed_pct'] = df_all['compensation_disbursed_pct'].clip(0, 100)
df_all['possession_pct']             = df_all['possession_pct'].clip(0, 100)
df_all['rr_progress_pct']            = df_all['rr_progress_pct'].clip(0, 100)
df_all['land_area_hectares']         = df_all['land_area_hectares'].clip(0, 10000)
df_all['affected_families']          = df_all['affected_families'].clip(0, 100000)
df_all['pending_approvals_count']    = df_all['pending_approvals_count'].clip(0, 50)
df_all['legal_disputes_count']       = df_all['legal_disputes_count'].clip(0, 50)
df_all['stakeholder_response_days']  = df_all['stakeholder_response_days'].clip(1, 365)

X = df_all[FEATURE_COLS]
y = df_all['delayed'].astype(int)

print(f"\n[+] Final training corpus: {len(X)} records")
print(f"    Class distribution  -> Delayed: {y.sum()} ({y.mean()*100:.1f}%)  |  On-time: {(~y.astype(bool)).sum()}")

# Source breakdown
src_counts = df_all['_source'].value_counts().to_dict()
print(f"    Source breakdown    -> {src_counts}")

# ---------------------------------------------------------------------------
# 6. TRAIN / TEST SPLIT
# ---------------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\n[+] Train: {len(X_train)} | Test: {len(X_test)}")

# ---------------------------------------------------------------------------
# 7. TRAIN RANDOM FOREST
# ---------------------------------------------------------------------------
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=8,
    min_samples_leaf=4,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)
print("[+] Model training complete")

# Stage targets are derived from lifecycle indicators until stage-labelled records
# are available. The serving contract can later consume observed stage labels.
stage_targets = {
    'notification': ((df_all['pending_approvals_count'] >= 2) | (df_all['stakeholder_response_days'] > 21)).astype(int),
    'approval': ((df_all['pending_approvals_count'] >= 2) | (df_all['legal_disputes_count'] >= 1)).astype(int),
    'compensation': (df_all['compensation_disbursed_pct'] < 60).astype(int),
    'possession': (df_all['possession_pct'] < 50).astype(int),
    'rehabilitation': (df_all['rr_progress_pct'] < 50).astype(int),
}
stage_models = {}
for stage_name, stage_target in stage_targets.items():
    stage_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=4,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )
    stage_model.fit(X_train, stage_target.iloc[X_train.index])
    stage_models[stage_name] = stage_model
print(f"[+] Stage models trained: {', '.join(stage_models)}")

# ---------------------------------------------------------------------------
# 8. EVALUATE
# ---------------------------------------------------------------------------
y_proba = model.predict_proba(X_test)[:, 1]
y_pred  = (y_proba >= 0.4).astype(int)   # 0.4 threshold for early-warning sensitivity

roc_auc   = roc_auc_score(y_test, y_proba)
accuracy  = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall    = recall_score(y_test, y_pred, zero_division=0)
f1        = f1_score(y_test, y_pred, zero_division=0)
cm        = confusion_matrix(y_test, y_pred)
tn, fp, fn, tp = cm.ravel()

feature_importance = dict(zip(FEATURE_COLS, model.feature_importances_.round(4)))
feature_importance = dict(sorted(feature_importance.items(), key=lambda x: -x[1]))

now_iso = datetime.datetime.now().isoformat()

results = {
    "note": (
        "Real metrics from a RandomForestClassifier trained on the COMBINED dataset "
        "(original 700 + expanded 1500 + historical 5000 records), "
        "evaluated on a 20% held-out test set never seen during training."
    ),
    "model_version":       "v3.0.0",
    "last_retrained":      now_iso,
    "train_size":          len(X_train),
    "test_size":           len(X_test),
    "total_records":       len(X),
    "source_breakdown":    src_counts,
    "roc_auc":             round(roc_auc,   4),
    "accuracy":            round(accuracy,  4),
    "precision":           round(precision, 4),
    "recall":              round(recall,    4),
    "f1_score":            round(f1,        4),
    "confusion_matrix":    {"TP": int(tp), "FP": int(fp), "FN": int(fn), "TN": int(tn)},
    "feature_importance":  feature_importance,
    "datasets_loaded": [
        "land_acquisition_synthetic_dataset.csv",
        "expanded_land_acquisition_delays.csv",
        "historical_land_acquisition_delays.csv",
    ],
    "stage_models": list(stage_models),
    "explainability": "TreeSHAP via shap.TreeExplainer",
}

with open(ROOT / 'real_model_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print(json.dumps(results, indent=2))
print("\n--- Classification Report ---")
print(classification_report(y_test, y_pred))

# ---------------------------------------------------------------------------
# 9. SAVE MODEL
# ---------------------------------------------------------------------------
joblib.dump(model, ROOT / 'trained_model.pkl')
joblib.dump(stage_models, ROOT / 'stage_models.pkl')
print(f"\n[OK] Model saved  -> trained_model.pkl")
print(f"[OK] Stage models saved -> stage_models.pkl")
print(f"[OK] Metrics saved -> real_model_results.json")
print(f"[OK] Model version: v3.0.0  |  Total training records: {len(X_train)}")
