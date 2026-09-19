import { LandProject } from '../types';

export interface ModelPrediction {
  probability_of_delay: number;
  risk_score: number;
  shap_values?: { feature: string; contribution: number }[];
  stage_probabilities?: Record<string, number>;
  explanation_method?: string;
}

export interface ModelMetadata {
  trained_on_records: number;
  test_records: number;
  total_records?: number;
  model_version?: string;
  last_retrained?: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  feature_importance: Record<string, number>;
  source_breakdown?: Record<string, number>;
  datasets_loaded?: string[];
  confusion_matrix?: { TP: number; FP: number; FN: number; TN: number };
}

const MODEL_API_URL = 'http://localhost:8000/api/ml';

export async function predictWithTrainedModel(project: Partial<LandProject>): Promise<ModelPrediction> {
  const response = await fetch(`${MODEL_API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  });

  if (!response.ok) {
    throw new Error(`Model service returned ${response.status}`);
  }

  return response.json() as Promise<ModelPrediction>;
}

export async function predictBatchWithTrainedModel(projects: LandProject[]): Promise<ModelPrediction[]> {
  const response = await fetch(`${MODEL_API_URL}/predict-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects }),
  });

  if (!response.ok) {
    throw new Error(`Model service returned ${response.status}`);
  }

  const result = (await response.json()) as { predictions: ModelPrediction[] };
  return result.predictions;
}

export async function getTrainedModelMetadata(): Promise<ModelMetadata> {
  const response = await fetch(`${MODEL_API_URL}/metadata`);
  if (!response.ok) throw new Error(`Model service returned ${response.status}`);
  return response.json() as Promise<ModelMetadata>;
}

export async function retrainTrainedModel(): Promise<ModelMetadata> {
  const response = await fetch(`${MODEL_API_URL}/retrain`, { method: 'POST' });
  if (!response.ok) throw new Error(`Model service returned ${response.status}`);
  return response.json() as Promise<ModelMetadata>;
}
