import pandas as pd, json, joblib, numpy as np
df = pd.read_csv('land_acquisition_synthetic_dataset.csv')
model = joblib.load('trained_model.pkl')
feature_cols = ['land_area_hectares', 'affected_families', 'compensation_disbursed_pct',
                 'pending_approvals_count', 'legal_disputes_count', 'possession_pct',
                 'rr_progress_pct', 'stakeholder_response_days']
X = df[feature_cols]
probas = model.predict_proba(X)[:, 1]
risk_scores = [int(round(p * 100)) for p in probas]

# Status: Completed if delayed_gt==0 AND model risk_score < 35 (Low-risk, on-schedule project)
completed_mask = [(df['delayed'].iloc[i] == 0 and risk_scores[i] < 35) for i in range(len(df))]
completed = sum(completed_mask)
ongoing = len(df) - completed
print(f"Completed (delayed==0 AND risk_score<35): {completed}")
print(f"Ongoing: {ongoing}")

# Verify sample Completed projects
for i in range(len(df)):
    if completed_mask[i]:
        row = df.iloc[i]
        print(f"  {row['project_id']}: poss={row['possession_pct']:.0f}%, comp={row['compensation_disbursed_pct']:.0f}%, legal={int(row['legal_disputes_count'])}, rr={row['rr_progress_pct']:.0f}%, risk_score={risk_scores[i]}, delayed_gt={int(row['delayed'])}")
        break
