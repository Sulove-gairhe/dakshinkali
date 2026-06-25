import { NextRequest, NextResponse } from "next/server";
import {
  validateCartStock,
  type StockValidationItem,
} from "@/lib/cart/stock-validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json(
        {
          valid: false,
          issues: [
            {
              productId: "",
              productName: "",
              code: "invalid_request",
              requestedQuantity: 0,
              availableQuantity: 0,
              message: "Invalid request: items array is required.",
            },
          ],
        },
        { status: 400 },
      );
    }

    const items: StockValidationItem[] = body.items.map(
      (item: { productId?: string; quantity?: number }) => ({
        productId: item.productId ?? "",
        quantity: item.quantity ?? 0,
      }),
    );

    const result = await validateCartStock(items);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stock validation failed.";

    return NextResponse.json(
      {
        valid: false,
        issues: [
          {
            productId: "",
            productName: "",
            code: "validation_error",
            requestedQuantity: 0,
            availableQuantity: 0,
            message,
          },
        ],
      },
      { status: 500 },
    );
  }
}
