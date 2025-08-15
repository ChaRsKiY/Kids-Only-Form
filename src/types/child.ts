import { FormType } from "@/schemas/subscription-form.schema";

export interface Child {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
    dob: string;
}

export interface ChildError {
    firstName?: string;
    lastName?: string;
    gender?: string;
    dob?: string;
}

export type ErrorsType = Partial<Omit<FormType, 'children'>> & { children?: Partial<ChildError>[] };