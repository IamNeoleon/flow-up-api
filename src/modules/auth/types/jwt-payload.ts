export type TJwtPayload = {
   sub: string;
   sid: string;
   type: 'access' | 'refresh'
};