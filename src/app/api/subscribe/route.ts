import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateContact, ContactsApi } from "@getbrevo/brevo";

const serverFormSchema = z.object({
  firstName: z.string().min(1, { message: "errors.required" }).max(50, { message: "errors.tooLong" }),
  lastName: z.string().min(1, { message: "errors.required" }).max(50, { message: "errors.tooLong" }),
  email: z.string().email({ message: "errors.invalidEmail" }),
  dob: z.string().min(1, { message: "errors.required" }).refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, { message: "errors.invalidDate" }),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    const phoneRegex = /^[\+]?[^A-Za-z]{7,20}$/;
    return phoneRegex.test(val);
  }, { message: "errors.invalidPhone" }),
  // Optional address fields
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  branchCode: z.string().max(10, { message: "errors.tooLong" }).optional(),
  agree: z.boolean().refine(val => val, { message: "errors.checkboxRequired" }),
  signature: z.string().min(1, { message: "errors.signatureRequired" }),
  children: z.array(z.object({
    firstName: z.string().min(1, { message: "errors.required" }).max(50, { message: "errors.tooLong" }),
    lastName: z.string().min(1, { message: "errors.required" }).max(50, { message: "errors.tooLong" }),
    gender: z.enum(['male', 'female', 'other'], { message: "errors.required" }),
    dob: z.string().min(1, { message: "errors.required" }).refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, { message: "errors.invalidDate" }),
  })).max(5, { message: "errors.tooManyChildren" }).optional(),
});

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ 
        error: "Invalid request body",
        details: "Request body must be a valid JSON object"
      }, { status: 400 });
    }

    const result = serverFormSchema.safeParse(body);
    if (!result.success) {
      const errors: Record<string, string> = {};
      
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });

      return NextResponse.json({ 
        error: "Validation failed",
        details: errors
      }, { status: 400 });
    }

    const validatedData = result.data;

    try {

      // Postal code validation only if provided
      let postalCode: number | null = null;
      if (validatedData.postalCode) {
        const parsed = parseInt(validatedData.postalCode);
        if (isNaN(parsed) || parsed <= 0) {
          return NextResponse.json({ 
            error: "Invalid postal code",
            details: { postalCode: "errors.invalidPostalCode" }
          }, { status: 400 });
        }
        postalCode = parsed;
      }

      const branchCode = req.cookies.get('kiosk-branch')?.value;

      if (!branchCode) {
        return NextResponse.json({ 
          error: "Invalid branch code",
          details: { postalCode: "errors.branchNotFound" }
        }, { status: 404 });
      }
      
      const parentDob = new Date(validatedData.dob);
      if (isNaN(parentDob.getTime())) {
        return NextResponse.json({ 
          error: "Invalid parent date of birth",
          details: { dob: "errors.invalidDate" }
        }, { status: 400 });
      }


      if (validatedData.children) {
        for (let i = 0; i < validatedData.children.length; i++) {
          const childDob = new Date(validatedData.children[i].dob);
          if (isNaN(childDob.getTime())) {
            return NextResponse.json({ 
            error: `Invalid date of birth for child ${i + 1}`,
            details: { [`children.${i}.dob`]: "errors.invalidDate" }
          }, { status: 400 });
          }
        }
      }

      let contactAPI = new ContactsApi();
      // @ts-ignore
      contactAPI.authentications.apiKey.apiKey = process.env.BREVO_API || ""

      let contact = new CreateContact();
      contact.email = validatedData.email;
      const firstChild = validatedData.children?.[0];
      const secondChild = validatedData.children?.[1];
      const thirdChild = validatedData.children?.[2];
      contact.attributes = {
        FIRSTNAME: validatedData.firstName,
        LASTNAME: validatedData.lastName,
        POSTCODE: validatedData.postalCode,
        SIGNATURE: validatedData.signature,
        STREET: validatedData.street || "",
        CITY: validatedData.city || "",
        COUNTRY: validatedData.country || "",
        PROVINCE: validatedData.province || "",
        PHONENUMBER: validatedData.phone || "",
        DOB: validatedData.dob,
        KID1_FIRSTNAME: firstChild?.firstName ?? "",
        KID1_LASTNAME: firstChild?.lastName ?? "",
        KID1_GENDER: firstChild?.gender ?? "",
        KID1_DOB: firstChild?.dob ?? "",
        KID2_FIRSTNAME: secondChild?.firstName ?? "",
        KID2_LASTNAME: secondChild?.lastName ?? "",
        KID2_GENDER: secondChild?.gender ?? "",
        KID2_DOB: secondChild?.dob ?? "",
        KID3_FIRSTNAME: thirdChild?.firstName ?? "",
        KID3_LASTNAME: thirdChild?.lastName ?? "",
        KID3_GENDER: thirdChild?.gender ?? "",
        KID3_DOB: thirdChild?.dob ?? "",
      };

      const listId = branchCode?.toUpperCase() === "PD" ? 5 : 6;
      contact.listIds = [listId];

      contactAPI.createContact(contact).then(res => {
        console.log(JSON.stringify(res.body));
      }).catch(err => {
        console.error("Error creating contact:", err.body);
      });

      return NextResponse.json({ 
        message: "Subscription created successfully",
        success: true
      });

    } catch (dbError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Database error:', dbError);
      }
      return NextResponse.json({ 
        error: "Database operation failed",
        details: "Unable to save subscription to database"
      }, { status: 500 });
    }

  } catch (parseError) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('JSON parse error:', parseError);
    }
    return NextResponse.json({ 
      error: "Invalid JSON",
      details: "Request body must be valid JSON"
    }, { status: 400 });
  }
};