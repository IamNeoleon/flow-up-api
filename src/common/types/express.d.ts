import { WorkspaceMember } from '@prisma/client';

declare global {
   namespace Express {
      interface User {
         id: string,
         sessionId: string
      }

      interface Request {
         user: User;
         workspace: {
            workspaceRole: 'MEMBER' | 'EDITOR' | 'OWNER';
            workspaceId: string;
         }
      }
   }
}

export { };