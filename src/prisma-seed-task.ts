// prisma/seed-tasks.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COLUMNS = {
   IN_PROGRESS: "40eef02e-d6df-4a7e-a5eb-2564454d3aec",
   TODO: "6e2e9cff-a98d-4071-affc-d42594e019d4",
   DONE: "92f285d5-51f3-4a84-885f-b51dfe27b272",
} as const;

type StatusKey = keyof typeof COLUMNS;

function randInt(min: number, max: number) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}
function chance(p: number) {
   return Math.random() < p;
}
function pick<T>(arr: T[]): T {
   return arr[randInt(0, arr.length - 1)];
}
function randomDateInLastDays(days: number): Date {
   const now = new Date();
   const minutesBack = randInt(0, days * 24 * 60);
   return new Date(now.getTime() - minutesBack * 60_000);
}
function addMinutes(date: Date, minutes: number): Date {
   return new Date(date.getTime() + minutes * 60_000);
}

async function main() {
   const COUNT = 80;

   // опционально подчистить задачи в этих колонках
   await prisma.task.deleteMany({
      where: { colId: { in: Object.values(COLUMNS) } },
   });

   const names = [
      "Сделать макет",
      "Пофиксить баг",
      "Добавить валидацию",
      "Сверстать модалку",
      "Оптимизировать запросы",
      "Доработать статистику",
      "Интегрировать уведомления",
      "Рефакторинг стора",
      "Полировка UI",
      "Проверить крайние кейсы",
   ];

   const orderByCol: Record<string, number> = {
      [COLUMNS.TODO]: 1,
      [COLUMNS.IN_PROGRESS]: 1,
      [COLUMNS.DONE]: 1,
   };

   // распределение финальных статусов (как они будут лежать в колонках)
   // например: 40% TODO, 35% IN_PROGRESS, 25% DONE
   function finalStatus(): StatusKey {
      const r = Math.random();
      if (r < 0.4) return "TODO";
      if (r < 0.75) return "IN_PROGRESS";
      return "DONE";
   }

   const data = Array.from({ length: COUNT }).map((_, i) => {
      const createdAt = randomDateInLastDays(28);
      const status = finalStatus();

      // dueDate иногда
      const hasDue = status !== "DONE" ? chance(0.45) : chance(0.2);
      const dueDate = hasDue
         ? addMinutes(createdAt, randInt(6 * 60, 7 * 24 * 60)) // +6ч..+7д
         : null;

      // doneAt ставим ТОЛЬКО если финальный статус DONE
      // "момент переноса" = doneAt
      let doneAt: Date | null = null;
      if (status === "DONE") {
         // сколько времени заняло выполнение: +10 минут .. +5 дней
         doneAt = addMinutes(createdAt, randInt(10, 5 * 24 * 60));

         // не даём уйти в будущее
         const now = new Date();
         if (doneAt > now) {
            // если createdAt близко к сейчас, то doneAt делаем "чуть раньше сейчас"
            doneAt = addMinutes(now, -randInt(5, 180));
            // и всё равно гарантируем doneAt >= createdAt
            if (doneAt < createdAt) doneAt = addMinutes(createdAt, randInt(1, 120));
         }
      }

      const colId = COLUMNS[status];
      const order = orderByCol[colId]++;

      return {
         name: `${pick(names)} (${i + 1})`,
         description: chance(0.6) ? `Тестовая задача #${i + 1} для статистики` : null,
         order,
         colId,
         createdAt,
         dueDate,
         doneAt, // только для DONE
         // assigneeId: null,
         // priorityId: null,
      };
   });

   await prisma.task.createMany({ data });

   const total = await prisma.task.count({ where: { colId: { in: Object.values(COLUMNS) } } });
   const done = await prisma.task.count({ where: { colId: COLUMNS.DONE } });
   const doneWithDoneAt = await prisma.task.count({
      where: { colId: COLUMNS.DONE, doneAt: { not: null } },
   });

   console.log("Seed done ✅", { total, done, doneWithDoneAt });
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => prisma.$disconnect());
