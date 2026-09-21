"""Generate the canonical synthetic land-acquisition delay dataset."""
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 20260919
RECORDS = 180
ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "land_acquisition_synthetic_dataset.csv"


def generate_dataset(records: int = RECORDS, seed: int = SEED) -> pd.DataFrame:
    """Create clean, synthetic records from transparent business rules."""
    rng = np.random.default_rng(seed)
    regions = np.array(["Urban", "Rural", "Industrial", "Coastal", "Tribal"])
    region = rng.choice(regions, records, p=[0.24, 0.30, 0.20, 0.14, 0.12])
    ownership = rng.choice(
        ["Individual", "Joint Family", "Community", "Institutional"],
        records,
        p=[0.43, 0.27, 0.20, 0.10],
    )
    area = np.clip(rng.lognormal(mean=3.35, sigma=0.85, size=records), 0.5, 480).round(2)
    owners = np.select(
        [ownership == "Individual", ownership == "Joint Family", ownership == "Community"],
        [rng.integers(1, 3, records), rng.integers(2, 9, records), rng.integers(5, 18, records)],
        default=rng.integers(1, 5, records),
    )
    rates = pd.Series(region).map({"Urban": 2.8, "Industrial": 2.2, "Coastal": 1.7, "Tribal": 0.75, "Rural": 0.55}).to_numpy()
    compensation = np.maximum(0.25, area * rates * rng.normal(1.0, 0.12, records)).round(2)
    dispute_probability = np.clip(0.08 + (owners - 1) * 0.018 + (ownership == "Community") * 0.12, 0.05, 0.58)
    compensation_dispute = rng.random(records) < dispute_probability
    legal_status = np.where(
        compensation_dispute & (rng.random(records) < 0.58),
        rng.choice(["Under Review", "Active Case"], records, p=[0.46, 0.54]),
        rng.choice(["No Case", "Resolved"], records, p=[0.78, 0.22]),
    )
    environmental = np.where(
        (region == "Coastal") | (region == "Industrial"),
        rng.choice(["Approved", "Pending", "Not Required"], records, p=[0.48, 0.38, 0.14]),
        rng.choice(["Approved", "Pending", "Not Required"], records, p=[0.68, 0.18, 0.14]),
    )
    approval_days = np.clip(rng.normal(42 + (environmental == "Pending") * 42 + area * 0.035, 12, records), 12, 180).round().astype(int)
    document_days = np.clip(rng.normal(18 + owners * 2.2 + compensation_dispute * 8, 5, records), 5, 75).round().astype(int)
    objections = np.clip(rng.poisson(1.2 + owners * 0.16 + compensation_dispute * 1.5, records), 0, 14).astype(int)
    historical_delay = np.clip(rng.normal(24 + owners * 1.3 + compensation_dispute * 12 + objections * 1.8, 10, records), 3, 115).round().astype(int)
    legal_effect = np.select([legal_status == "Active Case", legal_status == "Under Review", legal_status == "Resolved"], [58, 30, 10], default=0)
    clearance_effect = np.select([environmental == "Pending", environmental == "Not Required"], [34, 0], default=0)
    final_delay = np.clip(
        8 + historical_delay * 0.42 + owners * 1.7 + compensation_dispute * 24
        + legal_effect + clearance_effect + approval_days * 0.28 + document_days * 0.22
        + objections * 3.8 + rng.normal(0, 7, records),
        5, 365,
    ).round().astype(int)
    frame = pd.DataFrame({
        "Parcel_ID": [f"LA-{seed % 10000:04d}-{index:03d}" for index in range(1, records + 1)],
        "Land_Area": area,
        "Ownership_Type": ownership,
        "Number_of_Owners": owners.astype(int),
        "Compensation_Amount": compensation,
        "Compensation_Dispute": np.where(compensation_dispute, "Yes", "No"),
        "Legal_Case_Status": legal_status,
        "Environmental_Clearance": environmental,
        "Government_Approval_Days": approval_days,
        "Document_Verification_Days": document_days,
        "Stakeholder_Objections": objections,
        "Region_Type": region,
        "Historical_Delay_Days": historical_delay,
        "Final_Delay_Days": final_delay,
    })
    return frame.drop_duplicates(subset=["Parcel_ID"]).dropna().reset_index(drop=True)


if __name__ == "__main__":
    dataset = generate_dataset()
    dataset.to_csv(OUTPUT, index=False)
    print(f"Generated {len(dataset)} clean synthetic records -> {OUTPUT.name}")
    print(dataset.head(5).to_string(index=False))
    print(f"Delay range: {dataset.Final_Delay_Days.min()}-{dataset.Final_Delay_Days.max()} days")
