const translitMap: Record<string, string> = {
   а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
   ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
   н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
   ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
   ы: 'y', э: 'e', ю: 'yu', я: 'ya',
   ъ: '', ь: '',

   ә: 'a', ө: 'o', ү: 'u', қ: 'q', ғ: 'g', ң: 'n',
   һ: 'h', і: 'i'
};

const toLatin = (text: string) =>
   text
      .toLowerCase()
      .split('')
      .map(c => translitMap[c] ?? c)
      .join('')
      .replace(/[^a-z0-9\s_]/g, '');

export const generateUsername = (displayName: string) => {
   const latin = toLatin(displayName);

   const underscored = latin
      .trim()
      .replace(/\s+/g, '_');

   const shortId = Math.floor(1000 + Math.random() * 9000);

   return `${underscored}_${shortId}`;
};
