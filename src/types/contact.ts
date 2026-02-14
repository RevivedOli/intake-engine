export type ContactFieldType = "email" | "tel" | "text" | "instagram";

export interface ContactField {
  id: string;
  type: ContactFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
}
