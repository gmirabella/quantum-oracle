
export enum TimeMode {
  FUTURE = 'FUTURE', // 2026
  PAST = 'PAST',     // 2025
  EVOCA = 'EVOCA'    // Energy Accumulation / Explosion
}

export enum ShapeType {
  RANDOM = 'RANDOM',
  SPHERE = 'SPHERE',
  TORUS = 'TORUS',
  SPIRAL = 'SPIRAL',
  CUBE = 'CUBE',
  HEART = 'HEART',
  STAR = 'STAR',
  FACE = 'FACE'
}

export interface OracleResponse {
  keyword: string;
  shape: ShapeType;
  message: string;
}
