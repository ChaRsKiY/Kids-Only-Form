import { z } from "zod";

export const childSchema = z.object({
    firstName: z.string().min(1, { message: 'errors.required' }),
    lastName: z.string().min(1, { message: 'errors.required' }),
    gender: z.enum(['male', 'female', 'other'], { message: 'errors.required' }),
    dob: z.string().min(1, { message: 'errors.required' }),
  });

export const formSchema = z.object({
    firstName: z.string().min(1, { message: 'errors.required' }),
    lastName: z.string().min(1, { message: 'errors.required' }),
    email: z.string().email({ message: 'errors.invalidEmail' }),
    dob: z.string().min(1, { message: 'errors.required' }),
    phone: z.string().optional(),
    // Адресные поля теперь опциональные на уровне формы
    street: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    // Филиал определяется сервером по cookie киоска, поле не требуется на клиенте
    branchCode: z.string().optional(),
    agree: z.boolean().refine(val => val, { message: 'errors.checkboxRequired' }),
    signature: z.string().min(1, { message: 'errors.signatureRequired' }),
    children: z.array(childSchema)
      .min(0, { message: 'errors.invalidChildrenCount' })
      .max(5, { message: 'errors.tooManyChildren' })
      .refine((children) => {
        // Проверяем, что если ребенок добавлен, то все его данные заполнены
        return children.every(child => 
          child.firstName.trim() !== '' && 
          child.lastName.trim() !== '' && 
          child.dob !== ''
        );
      }, { message: 'errors.incompleteChildData' }),
  });

export type FormType = z.infer<typeof formSchema>;
