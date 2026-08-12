import * as z from "zod";

const phoneField = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number.")
  .regex(/^[0-9+\-() ]+$/, "Enter a valid phone number.");

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["BUYER", "SELLER"], { error: "Choose an account type." }),
});

export type RegisterFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        role?: string[];
        fxLicense?: string[];
        businessRegistration?: string[];
        idCard?: string[];
        livePhoto?: string[];
      };
      message?: string;
    }
  | undefined;

export type VerificationDocsFormState =
  | {
      errors?: {
        businessRegistration?: string[];
      };
      message?: string;
    }
  | undefined;

export type BecomeSellerFormState =
  | {
      errors?: {
        fxLicense?: string[];
        businessRegistration?: string[];
        idCard?: string[];
        livePhoto?: string[];
      };
      message?: string;
    }
  | undefined;

export type BecomeBuyerFormState = { message?: string } | undefined;

export const PhoneSchema = z.object({
  phone: phoneField,
});

export type PhoneFormState =
  | {
      errors?: {
        phone?: string[];
      };
      message?: string;
    }
  | undefined;

export const LoginSchema = z.object({
  email: z.email("Enter a valid email.").trim(),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const RateSchema = z.object({
  currency: z.string().length(3, "Choose a currency."),
  buyRate: z.coerce.number().positive("Buy rate must be positive."),
  sellRate: z.coerce.number().positive("Sell rate must be positive."),
});

export type RateFormState =
  | {
      errors?: {
        currency?: string[];
        buyRate?: string[];
        sellRate?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const OrderSchema = z.object({
  sellerId: z.string().min(1),
  currency: z.string().length(3, "Choose a currency."),
  type: z.enum(["BUY", "SELL"]),
  amount: z.coerce.number().positive("Amount must be positive."),
  contactPhone: phoneField,
});

export type OrderFormState =
  | {
      errors?: {
        amount?: string[];
        contactPhone?: string[];
      };
      message?: string;
    }
  | undefined;
