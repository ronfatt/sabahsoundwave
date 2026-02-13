import { DISTRICT_LABELS, DISTRICT_VALUES, type DistrictValue } from "./constants";

const districtSet = new Set<string>(DISTRICT_VALUES);

export function parseDistrict(value?: string | null): DistrictValue | undefined {
  if (!value) return undefined;
  return districtSet.has(value) ? (value as DistrictValue) : undefined;
}

export function getDistrictLabel(value: string) {
  if (value in DISTRICT_LABELS) {
    return DISTRICT_LABELS[value as DistrictValue];
  }
  return value;
}
