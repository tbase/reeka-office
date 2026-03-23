import { ListContentsQuery } from "@reeka-office/domain-cms";
import { mustAgent, rpc } from "../../context";
import {
  normalizeResourceContent,
  RESOURCE_CATEGORY_SLUG,
  type ResourceContent,
} from "./resourceShared";

type ListResourceContentsOutput = {
  categories: string[];
  contents: ResourceContent[];
}

export const listResourceContents = rpc.define({
  execute: mustAgent(async (): Promise<ListResourceContentsOutput> => {
    const result = await new ListContentsQuery({
      categorySlug: RESOURCE_CATEGORY_SLUG,
    }).query();

    const contents = result.contents.map((item) => normalizeResourceContent(item));

    const categories = Array.from(new Set(
      contents
        .map((item) => item.category.trim())
        .filter((item) => item.length > 0)
    ));

    return {
      categories,
      contents,
    };
  }),
});
