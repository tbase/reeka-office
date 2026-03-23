
import { normalizeImageURL } from "../../lib/image-url";

export const RESOURCE_CATEGORY_SLUG = "resource";

export type ResourceFields = {
  category: string;
  logo?: string;
  contentImages: string[];
  contactName: string;
  contactPhone: string;
};

export type ResourceContent = {
  id: number;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
} & ResourceFields;


export function normalizeResourceContent(item: {
  id: number;
  categoryId: number;
  name: string;
  content: string;
  fields: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ResourceContent {
  const fields = item.fields as ResourceFields;

  return {
    id: item.id,
    name: item.name,
    content: item.content,
    logo: normalizeImageURL(fields.logo),
    contentImages: fields.contentImages.map(normalizeImageURL).filter((image): image is string => image !== undefined),
    category: fields.category,
    contactName: fields.contactName,
    contactPhone: fields.contactPhone,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

