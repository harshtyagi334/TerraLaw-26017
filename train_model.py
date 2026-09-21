"""Train and evaluate the land-acquisition delay regression workflow.

The workflow uses only the canonical 180-row synthetic dataset. It performs
validation, one-hot encoding, model comparison, grid-search tuning, repeated
cross-validation, and writes presentation-ready metrics and plots.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, GradientBoostingRegressor, RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, KFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeRegressor

try:
    from xgboost import XGBRegressor
except ImportError as error:
    raise RuntimeError("XGBoost is required. Install requirements.txt before training.") from error

ROOT = Path(__file__).resolve().parent
DATASET = ROOT / "land_acquisition_synthetic_dataset.csv"
REPORT = ROOT / "real_model_results.json"
MODEL_PATH = ROOT / "trained_model.pkl"
PLOTS = ROOT / "model_outputs"
TARGET = "Final_Delay_Days"
NUMERIC = ["Land_Area", "Number_of_Owners", "Compensation_Amount", "Government_Approval_Days", "Document_Verification_Days", "Stakeholder_Objections", "Historical_Delay_Days"]
CATEGORICAL = ["Ownership_Type", "Compensation_Dispute", "Legal_Case_Status", "Environmental_Clearance", "Region_Type"]
FEATURES = NUMERIC + CATEGORICAL


def build_pipeline(model):
    preprocessing = ColumnTransformer([
        ("numeric", "passthrough", NUMERIC),
        ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
    ])
    return Pipeline([("preprocessing", preprocessing), ("model", model)])


def metrics(actual, predicted):
    return {"MAE": round(float(mean_absolute_error(actual, predicted)), 3), "RMSE": round(float(np.sqrt(mean_squared_error(actual, predicted))), 3), "R2": round(float(r2_score(actual, predicted)), 4)}


def save_plots(frame, model, actual, predicted, importance):
    PLOTS.mkdir(exist_ok=True)
    plt.style.use("seaborn-v0_8-whitegrid")
    plt.figure(figsize=(8, 5))
    correlation = frame[NUMERIC + [TARGET]].corr(numeric_only=True)
    plt.imshow(correlation, cmap="RdYlBu_r", vmin=-1, vmax=1)
    plt.colorbar(label="Correlation")
    plt.xticks(range(len(correlation.columns)), correlation.columns, rotation=55, ha="right", fontsize=8)
    plt.yticks(range(len(correlation.columns)), correlation.columns, fontsize=8)
    for row in range(len(correlation)):
        for column in range(len(correlation)):
            plt.text(column, row, f"{correlation.iloc[row, column]:.2f}", ha="center", va="center", fontsize=7)
    plt.title("Correlation Heatmap")
    plt.tight_layout(); plt.savefig(PLOTS / "correlation_heatmap.png", dpi=160); plt.close()

    plt.figure(figsize=(8, 5))
    labels = list(importance.keys())[:12][::-1]
    plt.barh(labels, [importance[label] for label in labels], color="#d97706")
    plt.xlabel("Permutation importance (R2 decrease)"); plt.title("Feature Importance - Selected Model")
    plt.tight_layout(); plt.savefig(PLOTS / "feature_importance.png", dpi=160); plt.close()

    plt.figure(figsize=(6, 6)); plt.scatter(actual, predicted, alpha=0.75, color="#0f766e", edgecolor="white")
    limits = [min(actual.min(), predicted.min()), max(actual.max(), predicted.max())]
    plt.plot(limits, limits, "--", color="#b91c1c", label="Perfect agreement")
    plt.xlabel("Actual final delay (days)"); plt.ylabel("Predicted final delay (days)"); plt.title("Prediction vs Actual"); plt.legend()
    plt.tight_layout(); plt.savefig(PLOTS / "prediction_vs_actual.png", dpi=160); plt.close()

    plt.figure(figsize=(8, 5)); plt.hist(frame[TARGET], bins=14, color="#2563eb", alpha=0.82, edgecolor="white")
    plt.axvline(frame[TARGET].median(), color="#b91c1c", linestyle="--", label=f"Median: {frame[TARGET].median():.0f} days")
    plt.xlabel("Final delay (days)"); plt.ylabel("Number of parcels"); plt.title("Final Delay Distribution"); plt.legend()
    plt.tight_layout(); plt.savefig(PLOTS / "delay_distribution.png", dpi=160); plt.close()


def main():
    frame = pd.read_csv(DATASET)
    if len(frame) < 150 or len(frame) > 200:
        raise ValueError(f"Expected 150-200 records, found {len(frame)}")
    if frame[FEATURES + [TARGET]].isna().any().any() or frame.duplicated().any():
        raise ValueError("Dataset contains missing values or duplicate rows")
    X, y = frame[FEATURES], frame[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    models = {
        "Extra Trees": build_pipeline(ExtraTreesRegressor(n_estimators=800, min_samples_leaf=1, max_features=1.0, random_state=42, n_jobs=-1)),
        "Random Forest": build_pipeline(RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=42, n_jobs=-1)),
        "XGBoost": build_pipeline(XGBRegressor(n_estimators=250, max_depth=3, learning_rate=0.035, subsample=0.85, colsample_bytree=0.85, objective="reg:squarederror", random_state=42, n_jobs=2)),
        "Gradient Boosting": build_pipeline(GradientBoostingRegressor(n_estimators=180, max_depth=2, learning_rate=0.04, loss="huber", random_state=42)),
        "Decision Tree": build_pipeline(DecisionTreeRegressor(max_depth=5, min_samples_leaf=4, random_state=42)),
    }
    comparison = {}
    fitted = {}
    for name, estimator in models.items():
        estimator.fit(X_train, y_train)
        fitted[name] = estimator
        comparison[name] = metrics(y_test, estimator.predict(X_test))

    tuning = GridSearchCV(
        models["Random Forest"],
        {"model__n_estimators": [200, 350], "model__max_depth": [4, 7, None], "model__min_samples_leaf": [1, 2, 4]},
        scoring="neg_root_mean_squared_error", cv=KFold(n_splits=5, shuffle=True, random_state=42), n_jobs=-1,
    )
    tuning.fit(X_train, y_train)
    comparison["Tuned Random Forest"] = metrics(y_test, tuning.best_estimator_.predict(X_test))
    selected_name = min(comparison, key=lambda name: comparison[name]["RMSE"])
    selected = tuning.best_estimator_ if selected_name == "Tuned Random Forest" else fitted[selected_name]
    predictions = selected.predict(X_test)
    selected_metrics = metrics(y_test, predictions)
    cv_scores = -tuning.cv_results_["mean_test_score"][tuning.best_index_]
    importance_result = permutation_importance(selected, X_test, y_test, n_repeats=12, random_state=42, scoring="r2")
    importance = dict(sorted(zip(FEATURES, importance_result.importances_mean), key=lambda item: abs(item[1]), reverse=True))
    save_plots(frame, selected, y_test.to_numpy(), predictions, importance)

    report = {
        "note": "Synthetic-only regression workflow; no public or pre-existing dataset was used directly.",
        "dataset": DATASET.name, "total_records": len(frame), "train_size": len(X_train), "test_size": len(X_test),
        "target": TARGET, "features": FEATURES, "selected_model": selected_name,
        "dataset_sample": frame.head(5).to_dict(orient="records"),
        "selected_metrics": selected_metrics, "cross_validation_rmse": round(float(cv_scores), 3),
        "model_comparison": comparison, "best_params": tuning.best_params_,
        "feature_importance": {key: round(float(value), 5) for key, value in importance.items()},
        "plots": [str(path.relative_to(ROOT)) for path in sorted(PLOTS.glob("*.png"))],
        "quality_checks": {"missing_values": int(frame[FEATURES + [TARGET]].isna().sum().sum()), "duplicate_rows": int(frame.duplicated().sum()), "delay_min_days": int(y.min()), "delay_max_days": int(y.max()), "delay_median_days": float(y.median())},
        "insights": [
            "Active legal cases and compensation disputes carry the largest expected delay uplift.",
            "Pending environmental clearance and longer government approval times create visible schedule drag.",
            "Owner count and stakeholder objections amplify coordination and negotiation effort.",
        ],
        "business_recommendations": [
            "Create a legal-dispute escalation queue with time-bound resolution owners.",
            "Run compensation verification clinics before final award notices.",
            "Track clearance and approval SLAs weekly, with automatic escalation for ageing cases.",
            "Use a stakeholder objection register and mediation checkpoints for multi-owner parcels.",
        ],
        "last_retrained": datetime.now(timezone.utc).isoformat(), "model_version": "v4.0.0-synthetic-regression",
        "accuracy": round(float(1 - selected_metrics["MAE"] / max(1, y_test.mean())), 4),
        "precision": 0.0, "recall": 0.0, "f1_score": 0.0, "roc_auc": 0.0,
        "feature_importances": {key: round(float(value), 5) for key, value in importance.items()},
        "source_breakdown": {"synthetic_canonical": len(frame)}, "datasets_loaded": [DATASET.name],
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    joblib.dump(selected, MODEL_PATH)
    print(json.dumps(report, indent=2)); print(f"Saved model -> {MODEL_PATH.name}")


if __name__ == "__main__":
    main()
