export const extractUserMentions = (text: string): string[] => {
   const regex = /@([a-zA-Z0-9_]+)/g;
   const mentions = new Set<string>();
   let match: RegExpExecArray | null;

   while ((match = regex.exec(text)) !== null) {
      mentions.add(match[1]);
   }

   return Array.from(mentions);
};
