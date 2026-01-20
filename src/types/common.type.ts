export interface CustomerLevelField {
  id: number;
  name: string;
  level: number;
  emin: number;
  emax: number;
  tg: number;
  day_jiuji_point: number;
  reward_discount: string;
  sign_in_points: number;
  sign_in_blessing: number;
}

export interface RKey {
  key: string;
}
