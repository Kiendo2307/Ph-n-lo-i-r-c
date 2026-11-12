import * as tmImage from '@teachablemachine/image';

export interface TMClassPrediction {
  className: string;
  probability: number;
}

export interface TMModelMetadata {
  modelName?: string;
  labels: string[];
  imageSize?: number;
  [key: string]: unknown;
}

export interface LoadedTMModel {
  model: tmImage.CustomMobileNet;
  labels: string[];
  totalClasses: number;
}

export function normalizeModelUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  if (!url.endsWith('/')) {
    url += '/';
  }
  return url;
}

export async function loadTeachableModel(rawUrl: string): Promise<LoadedTMModel> {
  const baseUrl = normalizeModelUrl(rawUrl);
  const modelURL = baseUrl + 'model.json';
  const metadataURL = baseUrl + 'metadata.json';

  // Test fetch metadata first to verify existence and extract labels safely
  const metaRes = await fetch(metadataURL);
  if (!metaRes.ok) {
    throw new Error(`Không thể tải metadata từ: ${metadataURL} (Mã lỗi: ${metaRes.status})`);
  }
  const metaJson: TMModelMetadata = await metaRes.json();
  const labels = metaJson.labels || [];

  // Load the model using tmImage
  const model = await tmImage.load(modelURL, metadataURL);
  const totalClasses = model.getTotalClasses();
  const classLabels = model.getClassLabels();

  return {
    model,
    labels: classLabels && classLabels.length > 0 ? classLabels : labels,
    totalClasses,
  };
}
