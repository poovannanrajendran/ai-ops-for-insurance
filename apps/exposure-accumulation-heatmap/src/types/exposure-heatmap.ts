export interface ExposureRow {
  country: string;
  latitude: number;
  locationId: string;
  longitude: number;
  peril?: string;
  tiv: number;
}

export interface HeatPoint {
  country: string;
  intensity: number;
  latitude: number;
  locationId: string;
  longitude: number;
  tiv: number;
}

export interface Hotspot {
  country: string;
  locationCount: number;
  rank: number;
  totalTiv: number;
}

export interface ConcentrationMetric {
  label: string;
  sharePct: number;
  totalTiv: number;
}

export interface ExposureWarning {
  code: "high_country_concentration" | "single_location_peak" | "low_data_density";
  message: string;
}

export interface ExposureCommentary {
  actions: string[];
  executiveSummary: string;
  observations: string[];
}

export interface ExposureSummary {
  hotspotCount: number;
  maxLocationTiv: number;
  rowCount: number;
  totalTiv: number;
}

export interface ExposureInsight {
  commentary: ExposureCommentary;
  countryConcentration: ConcentrationMetric[];
  heatPoints: HeatPoint[];
  hotspots: Hotspot[];
  queryHits: string[];
  summary: ExposureSummary;
  warnings: ExposureWarning[];
}
