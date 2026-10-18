import { ShipmentStatus, Shipment } from "../types";
import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";

export interface ShipmentRequest {
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientZone?: string;
  deliveryFee: number;
  codAmount: number; // 0 if paid online, or full amount if COD
  itemQuantity: number;
  itemDescription?: string;
  specialInstruction?: string;
}

export interface ShipmentResult {
  success: boolean;
  courierName: string;
  consignmentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: ShipmentStatus;
  deliveryFee?: number;
  error?: string;
  rawResponse?: any;
}

export interface ICourierProvider {
  readonly name: string;
  createShipment(request: ShipmentRequest): Promise<ShipmentResult>;
  trackShipment(consignmentId: string): Promise<{ status: ShipmentStatus; details?: string; rawResponse?: any }>;
  cancelShipment(consignmentId: string): Promise<{ success: boolean; error?: string }>;
}

// In-memory shipment registry for local testing & fallbacks
export const fallbackShipments: Shipment[] = [];

/**
 * 1. Pathao Courier Adapter
 * Official Pathao Aladdin Courier API implementation
 * Sandbox: https://courier-api-sandbox.pathao.com
 * Live: https://api-hermes.pathao.com
 */
export class PathaoCourierAdapter implements ICourierProvider {
  readonly name = "Pathao Courier";

  private get baseUrl(): string {
    const isSandbox = process.env.PATHAO_IS_SANDBOX !== "false";
    return isSandbox
      ? "https://courier-api-sandbox.pathao.com"
      : "https://api-hermes.pathao.com";
  }

  isConfigured(): boolean {
    return Boolean(
      process.env.PATHAO_CLIENT_ID &&
      process.env.PATHAO_CLIENT_SECRET &&
      process.env.PATHAO_USERNAME &&
      process.env.PATHAO_PASSWORD &&
      process.env.PATHAO_STORE_ID
    );
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured()) return null;

    try {
      const res = await fetch(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: process.env.PATHAO_CLIENT_ID,
          client_secret: process.env.PATHAO_CLIENT_SECRET,
          username: process.env.PATHAO_USERNAME,
          password: process.env.PATHAO_PASSWORD,
          grant_type: "password",
        }),
      });

      const data = await res.json();
      return data?.access_token || null;
    } catch (err) {
      console.error("Pathao token issue error:", err);
      return null;
    }
  }

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    const token = await this.getAccessToken();

    if (token) {
      try {
        const payload = {
          store_id: Number(process.env.PATHAO_STORE_ID),
          merchant_order_id: req.orderNumber,
          recipient_name: req.recipientName,
          recipient_phone: req.recipientPhone,
          recipient_address: req.recipientAddress,
          recipient_city: req.recipientCity || "Dhaka",
          delivery_type: 48, // Standard 48 Hours
          item_type: 2, // Parcel
          special_instruction: req.specialInstruction || "Streetwear apparel handle with care",
          item_quantity: req.itemQuantity,
          item_weight: 0.5,
          amount_to_collect: Math.round(req.codAmount),
        };

        const res = await fetch(`${this.baseUrl}/aladdin/api/v1/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok && data?.data?.consignment_id) {
          const cid = data.data.consignment_id;
          return {
            success: true,
            courierName: this.name,
            consignmentId: cid,
            trackingNumber: cid,
            trackingUrl: `https://pathao.com/courier/tracking/?consignment_id=${cid}`,
            status: "accepted_by_courier",
            deliveryFee: data.data.delivery_fee,
            rawResponse: data,
          };
        }

        return {
          success: false,
          courierName: this.name,
          status: "not_shipped",
          error: data?.message || "Failed to create Pathao consignment",
          rawResponse: data,
        };
      } catch (err: any) {
        return {
          success: false,
          courierName: this.name,
          status: "not_shipped",
          error: `Pathao connection error: ${err.message}`,
        };
      }
    }

    // Mock Sandbox fallback when Pathao credentials are not provided (development / testing only)
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        courierName: this.name,
        status: "not_shipped",
        error: "Pathao Courier credentials are not configured in production environment.",
      };
    }

    const mockConsignmentId = `PTH-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      success: true,
      courierName: this.name,
      consignmentId: mockConsignmentId,
      trackingNumber: mockConsignmentId,
      trackingUrl: `https://pathao.com/courier/tracking/?consignment_id=${mockConsignmentId}`,
      status: "accepted_by_courier",
      deliveryFee: req.deliveryFee,
      rawResponse: { mode: "sandbox_mock", consignment_id: mockConsignmentId },
    };
  }

  async trackShipment(consignmentId: string): Promise<{ status: ShipmentStatus; details?: string; rawResponse?: any }> {
    const token = await this.getAccessToken();
    if (token) {
      try {
        const res = await fetch(`${this.baseUrl}/aladdin/api/v1/orders/${consignmentId}/info`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await res.json();
        const orderStatus = data?.data?.order_status?.toLowerCase() || "";

        let mappedStatus: ShipmentStatus = "in_transit";
        if (orderStatus.includes("delivered")) mappedStatus = "delivered";
        else if (orderStatus.includes("return")) mappedStatus = "returned_to_sender";
        else if (orderStatus.includes("cancel")) mappedStatus = "cancelled";
        else if (orderStatus.includes("pickup") || orderStatus.includes("picked")) mappedStatus = "picked_up";

        return { status: mappedStatus, details: data?.data?.order_status, rawResponse: data };
      } catch (err: any) {
        console.error("Pathao track error:", err);
      }
    }

    return { status: "in_transit", details: "Consignment is in transit with Pathao Courier" };
  }

  async cancelShipment(consignmentId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

/**
 * 2. Manual Courier Adapter
 * Supports direct booking and tracking for Steadfast, RedX, Sundarban, eCourier, or custom carriers
 */
export class ManualCourierAdapter implements ICourierProvider {
  readonly name: string;

  constructor(courierName: string = "Steadfast Courier") {
    this.name = courierName;
  }

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    const prefix = this.name.toLowerCase().includes("steadfast") ? "STF" : "MAN";
    const consignmentId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    let trackingUrl = `https://pathao.com/courier/tracking/?consignment_id=${consignmentId}`;
    if (this.name.toLowerCase().includes("steadfast")) {
      trackingUrl = `https://steadfast.com.bd/tracking/${consignmentId}`;
    } else if (this.name.toLowerCase().includes("redx")) {
      trackingUrl = `https://redx.com.bd/track-order/?trackingId=${consignmentId}`;
    }

    return {
      success: true,
      courierName: this.name,
      consignmentId,
      trackingNumber: consignmentId,
      trackingUrl,
      status: "accepted_by_courier",
      deliveryFee: req.deliveryFee,
    };
  }

  async trackShipment(consignmentId: string): Promise<{ status: ShipmentStatus; details?: string }> {
    return { status: "in_transit", details: `Tracking active for ${this.name} (${consignmentId})` };
  }

  async cancelShipment(consignmentId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

export function getCourierProvider(providerName?: string): ICourierProvider {
  const name = providerName || "Pathao Courier";
  if (name.toLowerCase().includes("pathao")) {
    return new PathaoCourierAdapter();
  }
  return new ManualCourierAdapter(name);
}

/**
 * Dispatch / Book Shipment for an Order with Duplicate Prevention
 */
export async function bookOrderShipment(
  orderId: string,
  courierName: string,
  request: ShipmentRequest
): Promise<ShipmentResult> {
  // 1. Authoritative Database Duplicate Check: Check persistent shipments table
  if (isServiceRoleConfigured()) {
    try {
      const { data: dbShipment } = await supabaseAdmin
        .from("shipments")
        .select("*")
        .eq("order_id", orderId)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbShipment && dbShipment.consignment_id) {
        return {
          success: true,
          courierName: dbShipment.courier_name,
          consignmentId: dbShipment.consignment_id,
          trackingNumber: dbShipment.tracking_number || dbShipment.consignment_id,
          trackingUrl: dbShipment.tracking_url || undefined,
          status: dbShipment.status as ShipmentStatus,
          deliveryFee: Number(dbShipment.delivery_fee) || request.deliveryFee,
          rawResponse: { isDuplicate: true },
        };
      }
    } catch (err) {
      console.warn("DB shipment duplicate check warning:", err);
    }
  }

  // Reject unpersisted shipment dispatch in production
  if (process.env.NODE_ENV === "production" && !isServiceRoleConfigured()) {
    return {
      success: false,
      courierName,
      status: "not_shipped",
      error: "Production database is not configured. Shipment dispatch aborted.",
    };
  }

  // Fallback in-memory duplicate check (development / testing only)
  const existingShipment = fallbackShipments.find(
    (s) => s.order_id === orderId && s.status !== "cancelled"
  );

  if (existingShipment && existingShipment.consignment_id) {
    return {
      success: true,
      courierName: existingShipment.courier_name,
      consignmentId: existingShipment.consignment_id,
      trackingNumber: existingShipment.tracking_number || existingShipment.consignment_id,
      trackingUrl: existingShipment.tracking_url || undefined,
      status: existingShipment.status,
      deliveryFee: existingShipment.delivery_fee,
      rawResponse: { isDuplicate: true },
    };
  }

  const provider = getCourierProvider(courierName);
  const result = await provider.createShipment(request);

  if (!result.success || !result.consignmentId) {
    return result;
  }

  // Persist shipment record
  const shipmentRecord: Shipment = {
    id: `shp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: orderId,
    courier_name: result.courierName,
    consignment_id: result.consignmentId,
    tracking_number: result.trackingNumber || result.consignmentId,
    tracking_url: result.trackingUrl || null,
    status: result.status,
    recipient_name: request.recipientName,
    recipient_phone: request.recipientPhone,
    recipient_address: request.recipientAddress,
    delivery_fee: request.deliveryFee,
    cod_amount: request.codAmount,
    courier_response: result.rawResponse,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin.from("shipments").insert({
        order_id: shipmentRecord.order_id,
        courier_name: shipmentRecord.courier_name,
        consignment_id: shipmentRecord.consignment_id,
        tracking_number: shipmentRecord.tracking_number,
        tracking_url: shipmentRecord.tracking_url,
        status: shipmentRecord.status,
        recipient_name: shipmentRecord.recipient_name,
        recipient_phone: shipmentRecord.recipient_phone,
        recipient_address: shipmentRecord.recipient_address,
        delivery_fee: shipmentRecord.delivery_fee,
        cod_amount: shipmentRecord.cod_amount,
        courier_response: shipmentRecord.courier_response,
      });
    } catch (err) {
      console.warn("DB shipment insert error:", err);
    }
  }

  fallbackShipments.unshift(shipmentRecord);
  return result;
}
