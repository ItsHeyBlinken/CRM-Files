export interface IVendor {
    id: string;
    name: string;
    businessName?: string;
    email: string;
    phone?: string;
    website?: string;
    description?: string;
    categories: string[];
    services: string[];
    location: {
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
    contactPerson?: {
        firstName: string;
        lastName: string;
        title: string;
        phone?: string;
        email?: string;
    };
    rating?: {
        average: number;
        count: number;
    };
    pricing: {
        minPrice?: number;
        maxPrice?: number;
        currency: string;
        pricingModel: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM';
    };
    availability: {
        isAvailable: boolean;
        workingHours?: {
            monday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            tuesday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            wednesday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            thursday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            friday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            saturday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            sunday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
        };
        blackoutDates?: Date[];
    };
    documents: {
        contracts?: string[];
        licenses?: string[];
        insurance?: string[];
        portfolio?: string[];
    };
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
    isActive: boolean;
    isVerified: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IVendorCreate {
    name: string;
    businessName?: string;
    email: string;
    phone?: string;
    website?: string;
    description?: string;
    categories: string[];
    services: string[];
    location: {
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
    contactPerson?: {
        firstName: string;
        lastName: string;
        title: string;
        phone?: string;
        email?: string;
    };
    pricing: {
        minPrice?: number;
        maxPrice?: number;
        currency: string;
        pricingModel: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM';
    };
    availability?: {
        isAvailable: boolean;
        workingHours?: {
            monday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            tuesday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            wednesday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            thursday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            friday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            saturday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            sunday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
        };
        blackoutDates?: Date[];
    };
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
    notes?: string;
}
export interface IVendorUpdate {
    name?: string;
    businessName?: string;
    email?: string;
    phone?: string;
    website?: string;
    description?: string;
    categories?: string[];
    services?: string[];
    location?: {
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
    contactPerson?: {
        firstName: string;
        lastName: string;
        title: string;
        phone?: string;
        email?: string;
    };
    rating?: {
        average: number;
        count: number;
    };
    pricing?: {
        minPrice?: number;
        maxPrice?: number;
        currency: string;
        pricingModel: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM';
    };
    availability?: {
        isAvailable: boolean;
        workingHours?: {
            monday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            tuesday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            wednesday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            thursday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            friday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            saturday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
            sunday: {
                start: string;
                end: string;
                isWorking: boolean;
            };
        };
        blackoutDates?: Date[];
    };
    documents?: {
        contracts?: string[];
        licenses?: string[];
        insurance?: string[];
        portfolio?: string[];
    };
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
    isActive?: boolean;
    isVerified?: boolean;
    notes?: string;
}
export declare class VendorModel {
    static create(vendorData: IVendorCreate): Promise<IVendor>;
    static findById(id: string): Promise<IVendor | null>;
    static findByCategory(category: string): Promise<IVendor[]>;
    static findByLocation(city: string, state?: string): Promise<IVendor[]>;
    static search(searchTerm: string, category?: string): Promise<IVendor[]>;
    static update(id: string, vendorData: IVendorUpdate): Promise<IVendor | null>;
    static delete(id: string): Promise<boolean>;
    static getStats(): Promise<{
        total: number;
        active: number;
        verified: number;
        byCategory: {
            [key: string]: number;
        };
    }>;
    private static mapRowToVendor;
}
export declare const Vendor: typeof VendorModel;
//# sourceMappingURL=Vendor.d.ts.map