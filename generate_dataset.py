"""
Synthetic Land Acquisition Dataset Generator for SIH26017
Grounded in real published parameters:
- PRAGATI's reported ~35% land-acquisition-attributed infrastructure delay rate
- LARR Act 2013 compensation/rehabilitation timeline structure
- Realistic distributions for project types, land area, family counts

This is DISCLOSED synthetic data -- not claimed as real DoLR records.
"""
import numpy as np
import pandas as pd

np.random.seed(42)
N = 700  # matches the "700 parcels monitored" figure already used in the prototype

project_types = ['Highway', 'Railway', 'Power', 'Irrigation', 'Industrial', 'Urban', 'Rural']
states = ['Odisha', 'Uttar Pradesh', 'Tamil Nadu', 'Gujarat', 'Karnataka', 'Maharashtra', 'Madhya Pradesh']

data = {
    'project_id': [f'LA{500+i}' for i in range(N)],
    'project_type': np.random.choice(project_types, N),
    'state': np.random.choice(states, N),
    'land_area_hectares': np.round(np.random.gamma(shape=2, scale=80, size=N), 1),
    'affected_families': np.random.poisson(lam=350, size=N),
    'compensation_disbursed_pct': np.round(np.random.beta(2, 2, N) * 100, 1),
    'pending_approvals_count': np.random.poisson(lam=3, size=N),
    'legal_disputes_count': np.random.poisson(lam=4, size=N),
    'possession_pct': np.round(np.random.beta(2, 2, N) * 100, 1),
    'rr_progress_pct': np.round(np.random.beta(2, 2, N) * 100, 1),
    'stakeholder_response_days': np.round(np.random.gamma(shape=2, scale=15, size=N), 0),
}

df = pd.DataFrame(data)

# Build a REALISTIC delay label using a genuine underlying risk function
risk_signal = (
    -0.035 * df['compensation_disbursed_pct'] +
    3.2 * df['legal_disputes_count'] +
    2.1 * df['pending_approvals_count'] +
    -0.028 * df['possession_pct'] +
    -0.018 * df['rr_progress_pct'] +
    0.04 * df['stakeholder_response_days'] +
    0.015 * df['affected_families'] / 10 +
    np.random.normal(0, 8, N)  # real-world noise -- outcomes aren't perfectly predictable
)

# Calibrate threshold so ~35% are "delayed" (matches PRAGATI's real reported rate)
threshold = np.percentile(risk_signal, 65)
df['delayed'] = (risk_signal > threshold).astype(int)

df.to_csv('land_acquisition_synthetic_dataset.csv', index=False)
print(f"Generated {N} records. Delay rate: {df['delayed'].mean()*100:.1f}%")
print(df.head(5))
