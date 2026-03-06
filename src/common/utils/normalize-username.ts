export const normalizeUsername = (value: string) => {
   return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._-]/g, "");
};