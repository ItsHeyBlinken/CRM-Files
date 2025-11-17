export interface IActivity {
    id: string;
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'DEAL_UPDATE' | 'LEAD_UPDATE' | 'CONTACT_UPDATE';
    subject: string;
    description?: string;
    owner: string;
    relatedTo?: {
        type: 'CONTACT' | 'LEAD' | 'DEAL' | 'TASK';
        id: string;
    };
    participants: string[];
    duration?: number;
    outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'FOLLOW_UP_REQUIRED';
    nextAction?: string;
    nextActionDate?: Date;
    attachments: string[];
    tags: string[];
    isImportant: boolean;
    location?: string;
    meetingType?: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'EMAIL';
    direction?: 'INBOUND' | 'OUTBOUND';
    createdAt: Date;
    updatedAt: Date;
}
export interface IActivityCreate {
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'DEAL_UPDATE' | 'LEAD_UPDATE' | 'CONTACT_UPDATE';
    subject: string;
    description?: string;
    owner: string;
    relatedTo?: {
        type: 'CONTACT' | 'LEAD' | 'DEAL' | 'TASK';
        id: string;
    };
    participants?: string[];
    duration?: number;
    outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'FOLLOW_UP_REQUIRED';
    nextAction?: string;
    nextActionDate?: Date;
    attachments?: string[];
    tags?: string[];
    isImportant?: boolean;
    location?: string;
    meetingType?: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'EMAIL';
    direction?: 'INBOUND' | 'OUTBOUND';
}
export interface IActivityUpdate {
    subject?: string;
    description?: string;
    participants?: string[];
    duration?: number;
    outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'FOLLOW_UP_REQUIRED';
    nextAction?: string;
    nextActionDate?: Date;
    attachments?: string[];
    tags?: string[];
    isImportant?: boolean;
    location?: string;
    meetingType?: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'EMAIL';
    direction?: 'INBOUND' | 'OUTBOUND';
}
export declare class ActivityModel {
    static create(activityData: IActivityCreate): Promise<IActivity>;
    static findById(id: string): Promise<IActivity | null>;
    static findByOwner(ownerId: string): Promise<IActivity[]>;
    static findByRelatedTo(type: string, id: string): Promise<IActivity[]>;
    static update(id: string, activityData: IActivityUpdate): Promise<IActivity | null>;
    static delete(id: string): Promise<boolean>;
    static getActivitySummary(activity: IActivity): string;
    static getDurationText(activity: IActivity): string;
    private static mapRowToActivity;
}
export declare const Activity: typeof ActivityModel;
//# sourceMappingURL=Activity.d.ts.map