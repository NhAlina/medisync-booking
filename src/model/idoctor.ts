import type { ServiceType } from "./type";

export interface IDoctor {
  name: string;
  specialty: string;
  price: number;
  type: ServiceType;
  schedule?: Record<string, string[]>;
}