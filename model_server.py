import json
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

ROOT = Path(__file__).resolve().parent
MODEL = joblib.load(ROOT / 'trained_model.pkl')
STAGE_MODELS = joblib.load(ROOT / 'stage_models.pkl') if (ROOT / 'stage_models.pkl').exists() else {}
EXPLAINER = shap.TreeExplainer(MODEL)
MODEL_LOCK = threading.Lock()


def value_or(value, default):
    return default if value is None or value == '' else value


def model_features(project):
    if 'compensation_disbursed_pct' in project:
        return [
            float(value_or(project.get('land_area_hectares'), 100)),
            float(value_or(project.get('affected_families_count', project.get('affected_families')), 300)),
            float(value_or(project.get('compensation_disbursed_pct'), 50)),
            float(value_or(project.get('pending_approvals_count'), 0)),
            float(value_or(project.get('legal_disputes_count'), 0)),
            float(value_or(project.get('possession_percentage', project.get('possession_pct')), 0)),
            float(value_or(project.get('rr_progress_percentage', project.get('rr_progress_pct')), 0)),
            float(value_or(project.get('avg_stakeholder_response_days', project.get('stakeholder_response_days')), 14)),
        ]

    compensation = project.get('compensation') or {}
    assessed = max(1.0, float(value_or(compensation.get('total_compensation_assessed_cr'), 100)))
    disbursed = float(value_or(compensation.get('total_compensation_disbursed_cr'), 50))
    approvals = project.get('approvals') or []
    legal = project.get('legal_disputes') or []
    possession = project.get('possession') or {}
    rehabilitation = project.get('rehabilitation') or {}
    stakeholders = project.get('stakeholder_responsiveness') or {}

    return [
        float(value_or(project.get('land_area_hectares'), 100)),
        float(value_or(project.get('affected_families_count'), 300)),
        (disbursed / assessed) * 100,
        sum(1 for item in approvals if item.get('status') in ('Pending', 'In-Progress')),
        sum(1 for item in legal if item.get('status') == 'Pending'),
        float(value_or(possession.get('possession_percentage'), 0)),
        (float(value_or(rehabilitation.get('families_rehabilitated'), 0)) /
         max(1.0, float(value_or(rehabilitation.get('total_affected_families'), 1)))) * 100,
        float(value_or(stakeholders.get('avg_response_time_days'), 14)),
    ]


def predict(project):
    with MODEL_LOCK:
        feature_values = model_features(project)
        features = pd.DataFrame([feature_values], columns=MODEL.feature_names_in_)
        probability = float(MODEL.predict_proba(features)[0][1])
        shap_values = EXPLAINER.shap_values(features)
        values = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0, :, 1]
        stage_predictions = {
            stage: round(float(stage_model.predict_proba(features)[0][1]), 4)
            for stage, stage_model in STAGE_MODELS.items()
        }
    factors = [
        {'feature': feature, 'contribution': round(float(value), 4)}
        for feature, value in zip(MODEL.feature_names_in_, values)
    ]
    factors.sort(key=lambda item: abs(item['contribution']), reverse=True)
    print(json.dumps({
        'event': 'ML_VALIDATION',
        'uploaded_values': project,
        'processed_values': dict(zip(MODEL.feature_names_in_, feature_values)),
        'predicted_values': {
            'probability_of_delay': round(probability, 4),
            'risk_score': round(probability * 100),
            'stage_probabilities': stage_predictions,
        },
    }, default=str), flush=True)
    return {
        'probability_of_delay': round(probability, 4),
        'risk_score': round(probability * 100),
        'shap_values': factors,
        'stage_probabilities': stage_predictions,
        'explanation_method': 'TreeSHAP',
    }


def metadata():
    results = json.loads((ROOT / 'real_model_results.json').read_text(encoding='utf-8'))
    return {
        'trained_on_records': results['train_size'],
        'test_records': results['test_size'],
        'total_records': results.get('total_records', results['train_size'] + results['test_size']),
        'accuracy': results['accuracy'] * 100,
        'precision': results['precision'] * 100,
        'recall': results['recall'] * 100,
        'f1_score': results['f1_score'] * 100,
        'roc_auc': results['roc_auc'],
        'feature_importance': results['feature_importance'],
        'model_version': results.get('model_version', 'v3.0.0'),
        'last_retrained': results.get('last_retrained', ''),
        'source_breakdown': results.get('source_breakdown', {}),
        'confusion_matrix': results.get('confusion_matrix', {}),
        'datasets_loaded': results.get('datasets_loaded', []),
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_POST(self):
        if self.path not in ('/api/ml/predict', '/api/ml/predict-batch', '/api/ml/retrain'):
            self._send(404, {'error': 'Not found'})
            return
        try:
            if self.path == '/api/ml/retrain':
                subprocess.run([sys.executable, str(ROOT / 'train_model.py')], cwd=ROOT, check=True)
                global MODEL
                with MODEL_LOCK:
                    MODEL = joblib.load(ROOT / 'trained_model.pkl')
                self._send(200, metadata())
                return
            length = int(self.headers.get('Content-Length', 0))
            payload = json.loads(self.rfile.read(length))
            if self.path.endswith('batch'):
                projects = payload.get('projects', [])
                result = {'predictions': [predict(project) for project in projects]}
            else:
                result = predict(payload.get('project', payload))
            self._send(200, result)
        except Exception as error:
            self._send(400, {'error': str(error)})

    def do_GET(self):
        if self.path == '/api/ml/metadata':
            try:
                self._send(200, metadata())
            except Exception as error:
                self._send(500, {'error': str(error)})
            return
        self._send(404, {'error': 'Not found'})

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    print('Trained Random Forest model serving at http://localhost:8000')
    ThreadingHTTPServer(('localhost', 8000), Handler).serve_forever()
