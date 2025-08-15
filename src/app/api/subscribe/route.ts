import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
      let phoneNumber: number | null = null;
      if (validatedData.phone) {
        const cleanPhone = validatedData.phone.replace(/[^0-9]/g, '');
        phoneNumber = parseInt(cleanPhone);
        if (isNaN(phoneNumber)) {
          return NextResponse.json({ 
            error: "Invalid phone number format",
            details: { phone: "errors.invalidPhone" }
          }, { status: 400 });
        }
      }

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

      // Resolve branch: explicit code or kiosk cookie -> fallback
      let branch = null as null | { id: string; isActive: boolean };
      if (validatedData.branchCode) {
        branch = await db.branch.findUnique({
          where: { code: validatedData.branchCode.toUpperCase() }
        });
      }
      if (!branch) {
        const kioskCode = req.cookies.get('kiosk-branch')?.value;
        if (kioskCode) {
          branch = await db.branch.findUnique({ where: { code: kioskCode.toUpperCase() } });
        }
      }
      if (!branch) {
        branch = await db.branch.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });
      }

      if (!branch || !branch.isActive) {
        return NextResponse.json({ 
          error: "Invalid or inactive branch",
          details: { branchCode: "errors.invalidBranch" }
        }, { status: 400 });
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

      const subscription = await db.subscription.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          dob: parentDob,
          phone: phoneNumber,
          street: validatedData.street || '',
          postalCode: postalCode ?? 0,
          city: validatedData.city || '',
          province: validatedData.province || '',
          country: validatedData.country || '',
          branchId: branch.id,
          agree: validatedData.agree,
          signature: validatedData.signature,
          children: {
            create: validatedData.children?.map((child) => ({
              firstName: child.firstName,
              lastName: child.lastName,
              gender: child.gender,
              dob: new Date(child.dob),
            })),
          },
        }
      });

      // Trigger subscription automations
      try {
        const automations = await db.emailAutomation.findMany({
          where: {
            trigger: 'subscription',
            isActive: true
          },
          include: {
            template: true
          }
        });

        for (const automation of automations) {
          try {
            // Call automation processing endpoint
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/email/automations/process`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                trigger: 'subscription',
                subscriptionId: subscription.id,
                automationId: automation.id
              })
            });

            if (response.ok) {
              const result = await response.json();
              console.log(`[SUBSCRIPTION] Automation ${automation.name} processed:`, result.message);
            } else {
              console.error(`[SUBSCRIPTION] Failed to process automation ${automation.name}:`, response.status);
              console.log(response);
            }
          } catch (automationError) {
            console.error(`[SUBSCRIPTION] Error processing automation ${automation.name}:`, automationError);
          }
        }
      } catch (automationError) {
        console.error('[SUBSCRIPTION] Error fetching automations:', automationError);
        // Don't fail the subscription creation if automation processing fails
      }

      return NextResponse.json({ 
        message: "Subscription created successfully",
        success: true
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: "Database operation failed",
        details: "Unable to save subscription to database"
      }, { status: 500 });
    }

  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    return NextResponse.json({ 
      error: "Invalid JSON",
      details: "Request body must be valid JSON"
    }, { status: 400 });
  }
};