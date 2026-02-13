export const DISTRICT_VALUES = [
  "KOTA_KINABALU",
  "PAPAR",
  "PENAMPANG",
  "TUARAN",
  "RANAU",
  "KUDAT",
  "SANDAKAN",
  "LAHAD_DATU",
  "TAWAU",
  "SEMPORNA",
  "KENINGAU",
  "BEAUFORT",
  "SIPITANG",
  "TAMBUNAN",
  "KOTA_BELUD"
] as const;

export type DistrictValue = (typeof DISTRICT_VALUES)[number];

export const DISTRICT_LABELS: Record<DistrictValue, string> = {
  KOTA_KINABALU: "Kota Kinabalu",
  PAPAR: "Papar",
  PENAMPANG: "Penampang",
  TUARAN: "Tuaran",
  RANAU: "Ranau",
  KUDAT: "Kudat",
  SANDAKAN: "Sandakan",
  LAHAD_DATU: "Lahad Datu",
  TAWAU: "Tawau",
  SEMPORNA: "Semporna",
  KENINGAU: "Keningau",
  BEAUFORT: "Beaufort",
  SIPITANG: "Sipitang",
  TAMBUNAN: "Tambunan",
  KOTA_BELUD: "Kota Belud"
};

export const DISTRICT_SHORT_LABELS: Record<DistrictValue, string> = {
  KOTA_KINABALU: "KK",
  PAPAR: "Papar",
  PENAMPANG: "Penampang",
  TUARAN: "Tuaran",
  RANAU: "Ranau",
  KUDAT: "Kudat",
  SANDAKAN: "Sandakan",
  LAHAD_DATU: "Lahad Datu",
  TAWAU: "Tawau",
  SEMPORNA: "Semporna",
  KENINGAU: "Keningau",
  BEAUFORT: "Beaufort",
  SIPITANG: "Sipitang",
  TAMBUNAN: "Tambunan",
  KOTA_BELUD: "Kota Belud"
};

export const DISTRICT_OPTIONS = DISTRICT_VALUES.map((value) => ({
  value,
  label: DISTRICT_LABELS[value],
  shortLabel: DISTRICT_SHORT_LABELS[value]
}));

export const GENRES = [
  "Indie",
  "Alternative",
  "Pop",
  "R&B",
  "Hip Hop",
  "Rock",
  "Folk",
  "EDM",
  "Traditional",
  "Acoustic"
] as const;
