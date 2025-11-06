export type InitOptions = {
  apiUrl?: string;
  apiKey?: string;
  title?: string;
  imageUrl?: string; // URL del logo/imagen en el header
  position?: "left" | "right";
  theme?: { brand?: string };
};
