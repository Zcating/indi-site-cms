import { type Product } from "@/api";
import { defaultSiteJson } from "./constants";

export function transformToForm(json: any, products: Product[] = []): any {
  const data = JSON.parse(JSON.stringify(json || defaultSiteJson));
  
  // Refresh product data from backend if linked
  if (data.products && Array.isArray(data.products)) {
    data.products = data.products.map((p: any) => {
      if (p.id) {
        const latest = products.find(prod => prod.id === p.id);
        if (latest) {
          return {
            ...p,
            name: latest.name,
            flavor: latest.description || p.flavor,
          };
        }
      }
      return p;
    });
  }

  if (data.oem?.features) {
    data.oem.features = data.oem.features.map((s: string) => ({ value: s }));
  }
  if (data.about?.content) {
    data.about.content = data.about.content.map((s: string) => ({ value: s }));
  }
  if (data.consult?.channels) {
    data.consult.channels = data.consult.channels.map((s: string) => ({ value: s }));
  }
  
  return data;
}

export function transformFromForm(formData: any): any {
  const data = JSON.parse(JSON.stringify(formData));
  
  if (data.oem?.features) {
    data.oem.features = data.oem.features.map((o: any) => o.value);
  }
  if (data.about?.content) {
    data.about.content = data.about.content.map((o: any) => o.value);
  }
  if (data.consult?.channels) {
    data.consult.channels = data.consult.channels.map((o: any) => o.value);
  }
  
  return data;
}
