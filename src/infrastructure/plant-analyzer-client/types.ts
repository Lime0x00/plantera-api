export interface MlClassifyPrediction {
  class_id: number;
  class_name: string;
  confidence: number;
}

export interface MlDiagnoseInstance {
  confidence: number;
  bbox: number[];
}

export interface MlDiagnoseDetection {
  class: string;
  instances: MlDiagnoseInstance[];
}

export interface MlClassifyResponse {
  success: boolean;
  message: string;
  data: MlClassifyPrediction[];
}

export interface MlDiagnoseResponse {
  success: boolean;
  message: string;
  data: {
    detections: MlDiagnoseDetection[];
  };
}

export interface MlHealthResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    models_loaded: boolean;
  };
}

export interface MlErrorResponse {
  success: false;
  errorCode: string;
  message: string;
  error: string;
  details: Record<string, unknown>;
}
