import { pinyin } from "pinyin-pro";

export function getNameInitial(name: string): string {
  const normalizedName = name.trim();
  const firstChar = normalizedName.charAt(0);
  if (!firstChar) {
    return "#";
  }

  const upperChar = firstChar.toUpperCase();
  if (upperChar >= "A" && upperChar <= "Z") {
    return upperChar;
  }

  const [initial] = pinyin(normalizedName, {
    pattern: "first",
    toneType: "none",
    type: "array",
    mode: "surname",
    surname: "head",
    traditional: true,
    nonZh: "consecutive",
  });
  const normalizedInitial = initial?.charAt(0).toUpperCase();

  return normalizedInitial && normalizedInitial >= "A" && normalizedInitial <= "Z"
    ? normalizedInitial
    : "#";
}
