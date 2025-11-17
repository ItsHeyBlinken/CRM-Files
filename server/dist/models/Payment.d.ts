export interface IPayment {
    id: string;
    eventId: string;
    vendorId?: string;
    clientId: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
    paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'OTHER';
    paymentType: 'DEPOSIT' | 'FINAL_PAYMENT' | 'INSTALLMENT' | 'FULL_PAYMENT' | 'REFUND';
    description?: string;
    notes?: string;
    dueDate?: Date;
    paidDate?: Date;
    invoiceNumber?: string;
    transactionId?: string;
    referenceNumber?: string;
    isRecurring: boolean;
    recurringDetails?: {
        frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        interval: number;
        endDate?: Date;
        nextPaymentDate?: Date;
    };
    metadata?: {
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface IPaymentCreate {
    eventId: string;
    vendorId?: string;
    clientId: string;
    amount: number;
    currency?: string;
    paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'OTHER';
    paymentType: 'DEPOSIT' | 'FINAL_PAYMENT' | 'INSTALLMENT' | 'FULL_PAYMENT' | 'REFUND';
    description?: string;
    notes?: string;
    dueDate?: Date;
    invoiceNumber?: string;
    transactionId?: string;
    referenceNumber?: string;
    isRecurring?: boolean;
    recurringDetails?: {
        frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        interval: number;
        endDate?: Date;
        nextPaymentDate?: Date;
    };
    metadata?: {
        [key: string]: any;
    };
}
export interface IPaymentUpdate {
    amount?: number;
    currency?: string;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
    paymentMethod?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'OTHER';
    paymentType?: 'DEPOSIT' | 'FINAL_PAYMENT' | 'INSTALLMENT' | 'FULL_PAYMENT' | 'REFUND';
    description?: string;
    notes?: string;
    dueDate?: Date;
    paidDate?: Date;
    invoiceNumber?: string;
    transactionId?: string;
    referenceNumber?: string;
    isRecurring?: boolean;
    recurringDetails?: {
        frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        interval: number;
        endDate?: Date;
        nextPaymentDate?: Date;
    };
    metadata?: {
        [key: string]: any;
    };
}
export declare class PaymentModel {
    static create(paymentData: IPaymentCreate): Promise<IPayment>;
    static findById(id: string): Promise<IPayment | null>;
    static findByEventId(eventId: string): Promise<IPayment[]>;
    static findByClientId(clientId: string): Promise<IPayment[]>;
    static findByVendorId(vendorId: string): Promise<IPayment[]>;
    static findByStatus(status: string): Promise<IPayment[]>;
    static findOverdue(): Promise<IPayment[]>;
    static findUpcoming(days?: number): Promise<IPayment[]>;
    static update(id: string, paymentData: IPaymentUpdate): Promise<IPayment | null>;
    static delete(id: string): Promise<boolean>;
    static getStats(eventId?: string, clientId?: string): Promise<{
        total: number;
        totalAmount: number;
        pending: number;
        completed: number;
        failed: number;
        refunded: number;
        overdue: number;
        byStatus: {
            [key: string]: number;
        };
        byPaymentMethod: {
            [key: string]: number;
        };
    }>;
    private static mapRowToPayment;
}
export declare const Payment: typeof PaymentModel;
//# sourceMappingURL=Payment.d.ts.map