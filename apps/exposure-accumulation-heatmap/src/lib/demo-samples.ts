export interface DemoSample {
  csvText: string;
  description: string;
  id: string;
  label: string;
  sourceLabel: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "balanced_exposure",
    label: "Balanced Europe",
    sourceLabel: "global-warehouse-portfolio.csv",
    description: "Distributed European locations with moderate concentration.",
    csvText: `location_id,country,latitude,longitude,tiv,peril
LOC-UK-001,United Kingdom,51.5074,-0.1278,12000000,Windstorm
LOC-UK-002,United Kingdom,52.4862,-1.8904,8000000,Flood
LOC-NL-001,Netherlands,52.3676,4.9041,5000000,Flood
LOC-DE-001,Germany,50.1109,8.6821,4500000,Hail
LOC-FR-001,France,48.8566,2.3522,4000000,Windstorm`
  },
  {
    id: "country_concentration",
    label: "US concentration",
    sourceLabel: "mixed-urban-accumulation.csv",
    description: "Heavy concentration in one country to trigger warning states.",
    csvText: `location_id,country,latitude,longitude,tiv,peril
LOC-US-001,United States,40.7128,-74.0060,25000000,Windstorm
LOC-US-002,United States,34.0522,-118.2437,18000000,Wildfire
LOC-US-003,United States,29.7604,-95.3698,14000000,Hurricane
LOC-CA-001,Canada,43.6532,-79.3832,6000000,Flood
LOC-MX-001,Mexico,19.4326,-99.1332,4500000,Earthquake`
  },
  {
    id: "required_gate",
    label: "Missing required gate",
    sourceLabel: "missing-required-gate.csv",
    description: "Intentionally invalid rows to trigger validation gate messaging.",
    csvText: `location_id,country,latitude,longitude,tiv
LOC-ERR-001,United Kingdom,51.50,-0.12,
LOC-ERR-002,,52.48,-1.89,3000000`
  }
];
