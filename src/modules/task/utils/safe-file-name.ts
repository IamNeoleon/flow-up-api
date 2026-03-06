export const safeFileName = (name: string) => {
   return name
      .replace(/[/\\]+/g, '_')
      .replace(/[^\w.\-() ]+/g, '_')
      .trim()
      .slice(0, 120);
}