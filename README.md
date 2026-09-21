

# Land Acquisition Delay Predictive Analytics System

The Land Acquisition Delay Predictive Analytics System is an AI and data-driven solution designed to identify, analyze, and predict delays in land acquisition processes for infrastructure, real estate, industrial, and government projects.

This prototype includes a React/Vite dashboard, Python model and API services, historical and synthetic datasets, and trained model artifacts.

## Run Locally

**Prerequisites:** Node.js and Python

1. Install JavaScript dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` when AI features are enabled.
3. Start the application:
   `npm run dev`

The frontend is served on port 3000. Python services can also be started with `npm run model-server` or `npm run production-api`.

## Synthetic ML Workflow

The canonical demonstration dataset is `land_acquisition_synthetic_dataset.csv` with 180 records. It is generated locally by `generate_dataset.py` from disclosed synthetic business rules; no public dataset is used directly. The target is `Final_Delay_Days` and the features cover ownership, compensation, legal status, environmental clearance, approvals, document verification, objections, region, and historical delay.

Run the complete workflow with:

```text
python generate_dataset.py
python train_model.py
```

The training workflow validates missing values and duplicates, one-hot encodes categorical features, splits 80/20, compares Random Forest, XGBoost, Gradient Boosting, and Decision Tree regressors, tunes Random Forest with 5-fold cross-validation, and writes `real_model_results.json` plus `trained_model.pkl`.

The latest held-out comparison selected Extra Trees: MAE 6.935 days, RMSE 8.469 days, and R2 0.9197. The custom dashboard accuracy is an error-derived score, not classification accuracy, and is 88.76% on the held-out split. The generated `model_outputs/` directory contains the feature-importance chart, correlation heatmap, prediction-vs-actual chart, and delay distribution chart. The report also records the dataset sample quality checks, model comparison, explainable insights, and business recommendations for reducing delays.

## Dataset Audit and Expansion

To audit the supplied infrastructure dataset and create the corrected 1,500-row and balanced 10,000-row deliverables, run:

```text
python audit_and_engineer_dataset.py
```

This writes `corrected_land_acquisition_delays.csv`, `land_acquisition_delays_expanded_10000.csv`, `dataset_improvement_report.json`, and four charts under `dataset_analysis_outputs/`. The expanded file has 19 columns: the original 13 fields plus six engineered risk scores. `Project_Risk_Classification` is derived from `RealWorld_Months_Delayed` and must be excluded from model features to prevent target leakage.
