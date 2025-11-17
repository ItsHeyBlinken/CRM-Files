export interface IUser {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'PLANNER' | 'CLIENT' | 'ADMIN';
    isActive: boolean;
    emailVerified: boolean;
    avatarUrl?: string;
    phone?: string;
    bio?: string;
    company?: string;
    jobTitle?: string;
    managerId?: string;
    lastLogin?: Date;
    emailVerifiedAt?: Date;
    preferences: {
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
        dashboard: {
            defaultView: string;
            widgets: string[];
        };
        theme: 'light' | 'dark' | 'auto';
        timezone: string;
        language: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserCreate {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'PLANNER' | 'CLIENT' | 'ADMIN';
    phone?: string;
    bio?: string;
    company?: string;
    jobTitle?: string;
    managerId?: string;
}
export interface IUserUpdate {
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    company?: string;
    jobTitle?: string;
    managerId?: string;
    preferences?: Partial<IUser['preferences']>;
}
export declare class UserModel {
    static create(userData: IUserCreate): Promise<IUser>;
    static findById(id: string): Promise<IUser | null>;
    static findByEmail(email: string): Promise<IUser | null>;
    static findByRole(role: string): Promise<IUser[]>;
    static update(id: string, userData: IUserUpdate): Promise<IUser | null>;
    static updateLastLogin(id: string): Promise<void>;
    static verifyEmail(id: string): Promise<void>;
    static comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    static getFullName(user: IUser): string;
    private static mapRowToUser;
}
export declare const User: typeof UserModel;
//# sourceMappingURL=User.d.ts.map