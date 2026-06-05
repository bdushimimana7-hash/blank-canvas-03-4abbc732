export type Sector =
  | "salon"
  | "pharmacy"
  | "bank_sacco"
  | "health_facility"
  | "government"
  | "insurance"
  | "restaurant"
  | "other";

export const SECTORS: { value: Sector; label: string }[] = [
  { value: "bank_sacco", label: "Bank / SACCO" },
  { value: "health_facility", label: "Health facility" },
  { value: "government", label: "Government" },
  { value: "salon", label: "Salon" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "insurance", label: "Insurance" },
  { value: "restaurant", label: "Restaurant" },
  { value: "other", label: "Other" },
];

export const SECTOR_COPY: Record<Sector, { customer: string; called: string }> = {
  salon: { customer: "Client", called: "Ready for you" },
  pharmacy: { customer: "Patient", called: "Prescription ready" },
  bank_sacco: { customer: "Customer", called: "Teller is free" },
  health_facility: { customer: "Patient", called: "Doctor is ready" },
  government: { customer: "Citizen", called: "Window is available" },
  insurance: { customer: "Client", called: "Officer is available" },
  restaurant: { customer: "Guest", called: "Your table is ready" },
  other: { customer: "Customer", called: "Your turn" },
};

export function sectorCopy(sector: string | null | undefined) {
  return SECTOR_COPY[(sector as Sector) ?? "other"] ?? SECTOR_COPY.other;
}

export function sectorLabel(sector: string | null | undefined) {
  return SECTORS.find((s) => s.value === sector)?.label ?? "Other";
}
