export interface IEvent {
    id: string;
    title: string;
    description?: string;
    eventType: 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CONFERENCE' | 'PARTY' | 'OTHER';
    status: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startDate: Date;
    endDate: Date;
    startTime?: string;
    endTime?: string;
    location: {
        name: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    clientId: string;
    plannerId: string;
    budget?: {
        total: number;
        spent: number;
        currency: string;
    };
    guestCount?: number;
    specialRequirements?: string;
    notes?: string;
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IEventCreate {
    title: string;
    description?: string;
    eventType: 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CONFERENCE' | 'PARTY' | 'OTHER';
    startDate: Date;
    endDate: Date;
    startTime?: string;
    endTime?: string;
    location: {
        name: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    clientId: string;
    plannerId: string;
    budget?: {
        total: number;
        spent: number;
        currency: string;
    };
    guestCount?: number;
    specialRequirements?: string;
    notes?: string;
    isPrivate?: boolean;
}
export interface IEventUpdate {
    title?: string;
    description?: string;
    eventType?: 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CONFERENCE' | 'PARTY' | 'OTHER';
    status?: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startDate?: Date;
    endDate?: Date;
    startTime?: string;
    endTime?: string;
    location?: {
        name: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    budget?: {
        total: number;
        spent: number;
        currency: string;
    };
    guestCount?: number;
    specialRequirements?: string;
    notes?: string;
    isPrivate?: boolean;
}
export declare class EventModel {
    static create(eventData: IEventCreate): Promise<IEvent>;
    static findById(id: string): Promise<IEvent | null>;
    static findByClientId(clientId: string): Promise<IEvent[]>;
    static findByPlannerId(plannerId: string): Promise<IEvent[]>;
    static findByStatus(status: string): Promise<IEvent[]>;
    static findUpcoming(limit?: number): Promise<IEvent[]>;
    static update(id: string, eventData: IEventUpdate): Promise<IEvent | null>;
    static delete(id: string): Promise<boolean>;
    static getStats(plannerId?: string): Promise<{
        total: number;
        planning: number;
        confirmed: number;
        inProgress: number;
        completed: number;
        cancelled: number;
    }>;
    private static mapRowToEvent;
}
export declare const Event: typeof EventModel;
//# sourceMappingURL=Event.d.ts.map