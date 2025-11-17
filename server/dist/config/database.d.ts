import { Pool } from 'pg';
export declare const connectDB: () => Promise<void>;
export declare const disconnectDB: () => Promise<void>;
export declare const getPool: () => Pool;
export declare const query: (text: string, params?: any[]) => Promise<any>;
//# sourceMappingURL=database.d.ts.map