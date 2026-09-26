"""Serve predictions from the synthetic-only delay regression pipeline."""
import json
import os
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "trained_model.pkl"
MODEL = joblib.load(MODEL_PATH)
MODEL_LOCK = threading.Lock()
FEATURES = [
    "Land_Area", "Number_of_Owners", "Compensation_Amount", "Government_Approval_Days",
    "Document_Verification_Days", "Stakeholder_Objections", "Historical_Delay_Days",
    "Ownership_Type", "Compensation_Dispute", "Legal_Case_Status", "Environmental_Clearance", "Region_Type",
]


def value_or(value, default):
    return default if value is None or value == "" else value


def model_features(project):
    compensation = project.get("compensation") or {}
    assessed = max(1.0, float(value_or(compensation.get("total_compensation_assessed_cr"), 100)))
    disbursed = float(value_or(compensation.get("total_compensation_disbursed_cr"), 50))
    approvals = project.get("approvals") or []
    legal = project.get("legal_disputes") or []
    stakeholders = project.get("stakeholder_responsiveness") or {}
    return {
        "Land_Area": float(value_or(project.get("Land_Area", project.get("land_area_hectares")), 40)),
        "Number_of_Owners": int(value_or(project.get("Number_of_Owners", project.get("affected_families_count")), 3)),
        "Compensation_Amount": float(value_or(project.get("Compensation_Amount"), disbursed / assessed * 40)),
        "Government_Approval_Days": int(value_or(project.get("Government_Approval_Days"), 55 + len(approvals) * 8)),
        "Document_Verification_Days": int(value_or(project.get("Document_Verification_Days"), 25)),
        "Stakeholder_Objections": int(value_or(project.get("Stakeholder_Objections"), len(project.get("objections") or []))),
        "Historical_Delay_Days": int(value_or(project.get("Historical_Delay_Days"), 30)),
        "Ownership_Type": value_or(project.get("Ownership_Type"), "Individual"),
        "Compensation_Dispute": value_or(project.get("Compensation_Dispute"), "Yes" if disbursed < assessed * 0.6 else "No"),
        "Legal_Case_Status": value_or(project.get("Legal_Case_Status"), "Active Case" if any(item.get("status") == "Pending" for item in legal) else "No Case"),
        "Environmental_Clearance": value_or(project.get("Environmental_Clearance"), "Pending"),
        "Region_Type": value_or(project.get("Region_Type"), "Rural"),
    }


def predict(project):
    features = model_features(project)
    with MODEL_LOCK:
        predicted_delay = max(0.0, float(MODEL.predict(pd.DataFrame([features], columns=FEATURES))[0]))
    probability = 1.0 / (1.0 + np.exp(-(predicted_delay - 65.0) / 18.0))
    results = json.loads((ROOT / "real_model_results.json").read_text(encoding="utf-8"))
    factors = [
        {"feature": feature, "contribution": round(float(results.get("feature_importance", {}).get(feature, 0)), 4)}
        for feature in FEATURES
    ]
    factors.sort(key=lambda item: abs(item["contribution"]), reverse=True)
    return {
        "probability_of_delay": round(float(probability), 4),
        "risk_score": round(float(probability * 100)),
        "predicted_delay_days": round(predicted_delay, 1),
        "shap_values": factors,
        "stage_probabilities": {},
        "explanation_method": "Permutation feature importance",
    }


def metadata():
    results = json.loads((ROOT / "real_model_results.json").read_text(encoding="utf-8"))
    selected = results.get("selected_metrics", {})
    return {
        "trained_on_records": results["train_size"], "test_records": results["test_size"], "total_records": results["total_records"],
        "accuracy": results.get("accuracy", 0) * 100, "precision": results.get("precision", 0) * 100,
        "recall": results.get("recall", 0) * 100, "f1_score": results.get("f1_score", 0) * 100, "roc_auc": results.get("roc_auc", 0),
        "mae": selected.get("MAE"), "rmse": selected.get("RMSE"), "r2": selected.get("R2"),
        "feature_importance": results["feature_importance"], "model_version": results["model_version"],
        "last_retrained": results["last_retrained"], "source_breakdown": results["source_breakdown"],
        "datasets_loaded": results["datasets_loaded"], "model_comparison": results.get("model_comparison", {}),
        "selected_model": results.get("selected_model"), "plots": results.get("plots", []),
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body))); self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type"); self.end_headers(); self.wfile.write(body)

    def do_OPTIONS(self): self._send(204, {})

    def do_POST(self):
        if self.path not in ("/api/ml/predict", "/api/ml/predict-batch", "/api/ml/retrain"):
            self._send(404, {"error": "Not found"}); return
        try:
            if self.path == "/api/ml/retrain":
                subprocess.run([sys.executable, str(ROOT / "generate_dataset.py")], cwd=ROOT, check=True)
                subprocess.run([sys.executable, str(ROOT / "train_model.py")], cwd=ROOT, check=True)
                global MODEL
                with MODEL_LOCK: MODEL = joblib.load(MODEL_PATH)
                self._send(200, metadata()); return
            length = int(self.headers.get("Content-Length", 0)); payload = json.loads(self.rfile.read(length))
            if self.path.endswith("batch"):
                self._send(200, {"predictions": [predict(item) for item in payload.get("projects", [])]})
            else: self._send(200, predict(payload.get("project", payload)))
        except Exception as error: self._send(400, {"error": str(error)})

    def do_GET(self):
        if self.path == "/api/ml/metadata": self._send(200, metadata()); return
        self._send(404, {"error": "Not found"})

    def log_message(self, format, *args): return


if __name__ == "__main__":
    port = int(os.environ.get("MODEL_API_PORT", "8100"))
    print(f"Synthetic delay regression model serving at http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
