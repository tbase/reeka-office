import {
  GetCategoryQuery,
  GetContentQuery,
  ListContentsQuery,
} from "@reeka-office/domain-cms";
import { createRpcError } from "@reeka-office/jsonrpc";

const RESOURCE_CATEGORY_SLUG = "resource";

type UnknownRecord = Record<string, unknown>;
type NormalizedResourceFields = UnknownRecord & {
  banner?: string;
  category: string;
  contentImage: string[];
  contactName: string;
  contactPhone: string;
  contactQrcode?: string;
};
type FamilyOfficeResourceContent = {
  id: number;
  categoryId: number;
  name: string;
  content: string;
  fields: NormalizedResourceFields;
  createdAt: Date;
  updatedAt: Date;
};
type FamilyOfficeResourceCategory = {
  id: number;
  slug: string;
  name: string;
  resourceCount: number;
};
type ListFamilyOfficeResourcesResult = {
  categories: FamilyOfficeResourceCategory[];
  currentCategorySlug: string;
  contents: FamilyOfficeResourceContent[];
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFields(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function pickString(source: UnknownRecord, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

function pickStringArray(source: UnknownRecord, key: string): string[] {
  const value = source[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeImageURL(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.includes("://") || src.startsWith("cloud://")) return src;

  const normalizedPath = src.replace(/^\/+/, "");
  const bucket = process.env.COS_BUCKET;

  if (!bucket) {
    return normalizedPath;
  }

  return `https://${bucket}.tcb.qcloud.la/${normalizedPath}`;
}

function extractImageList(fields: UnknownRecord): string[] {
  return pickStringArray(fields, "contentImage")
    .map((item) => normalizeImageURL(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeResourceFields(value: unknown): NormalizedResourceFields {
  const fields = getFields(value);

  return {
    ...fields,
    banner: normalizeImageURL(pickString(fields, "banner")),
    category: pickString(fields, "category"),
    contentImage: extractImageList(fields),
    contactName: pickString(fields, "contactName"),
    contactPhone: pickString(fields, "contactPhone"),
    contactQrcode: normalizeImageURL(pickString(fields, "contactQrcode")),
  };
}

function normalizeFamilyOfficeResourceItem(item: {
  id: number;
  categoryId: number;
  name: string;
  content: string;
  fields: unknown;
  createdAt: Date;
  updatedAt: Date;
}): FamilyOfficeResourceContent {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    content: item.content,
    fields: normalizeResourceFields(item.fields),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function getFamilyOfficeGroup(fields: UnknownRecord) {
  const name = pickString(fields, "category");

  const normalizedName = name || "未分类";
  return {
    name: normalizedName,
    slug: toSlug(normalizedName) || "uncategorized",
  };
}

async function getResourceCategory() {
  return new GetCategoryQuery({ slug: RESOURCE_CATEGORY_SLUG }).query();
}

export async function listFamilyOfficeResources(): Promise<ListFamilyOfficeResourcesResult> {
  const resourceCategory = await getResourceCategory();
  if (!resourceCategory) {
    return {
      categories: [],
      currentCategorySlug: "",
      contents: [],
    };
  }

  const contentResult = await new ListContentsQuery({ categoryId: resourceCategory.id }).query();
  const contents = contentResult.contents.map((item) => normalizeFamilyOfficeResourceItem(item));

  const categoryMap = new Map<string, FamilyOfficeResourceCategory>();

  for (const item of contents) {
    const group = getFamilyOfficeGroup(getFields(item.fields));
    const current = categoryMap.get(group.slug);
    if (current) {
      current.resourceCount += 1;
      continue;
    }

    categoryMap.set(group.slug, {
      id: categoryMap.size + 1,
      slug: group.slug,
      name: group.name,
      resourceCount: 1,
    });
  }

  const categories = Array.from(categoryMap.values());
  const currentCategory = categories[0] ?? null;

  return {
    categories,
    currentCategorySlug: currentCategory?.slug ?? "",
    contents,
  };
}

export async function getFamilyOfficeResourceDetail(id: string): Promise<FamilyOfficeResourceContent> {
  const [resourceCategory, content] = await Promise.all([
    getResourceCategory(),
    new GetContentQuery({ id: Number(id) }).query(),
  ]);

  if (!content) {
    throw createRpcError.notFound("家办资源不存在");
  }

  if (!resourceCategory || content.categoryId !== resourceCategory.id) {
    throw createRpcError.notFound("家办资源不存在");
  }

  return normalizeFamilyOfficeResourceItem(content);
}
