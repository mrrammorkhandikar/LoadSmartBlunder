# LoadSmart - Code Change Report

**Project:** LoadSmart (powered by Roadex) - Digital Freight Marketplace
**Date:** 21 February 2026
**Total Commits:** 37
**Time Range:** 13:29 UTC - 17:13 UTC
**Source Files Changed:** 16
**Screenshot Assets Added:** 31
**Net Lines Changed:** +3,086 / -387

---

## Change Summary

All changes made on 21 February 2026:

1. **Pricing Calculator on Admin Post-Load Page** -- Full inline pricing calculator with per-tonne rate support, distance-based estimation, shipper pricing auto-population, and real-time payout breakdown.
2. **Carrier "My Orders" Page** -- New dedicated page for carriers to view loads directly assigned by admins (bypass marketplace).
3. **Real Carrier Data Integration** -- Replaced all mock/hardcoded carrier data with live API data from `/api/admin/carriers` across admin pages and pricing drawer.
4. **Direct Carrier Assignment Flow** -- Admins can directly assign loads to specific carriers through pricing drawer and load management pages.
5. **Pricing Convention Enforcement** -- `adminFinalPrice` = shipper gross price, `finalPrice` = carrier payout. Carrier endpoints sanitized to strip shipper-only fields.
6. **Carrier Payout Safety Net** -- Auto-calculates payout when `finalPrice` is zero/missing, using 10% default platform margin (90% of adminFinalPrice).
7. **Invoice Auto-Generation** -- "Send Invoice" button now auto-generates invoice via `/api/admin/invoice/generate-and-send` if none exists, instead of showing error.
8. **Shipment ID Formatting** -- UUIDs displayed as human-readable `SH-XXXXXXXX` format in carrier my-orders page.
9. **Saved Address Query Fix** -- Fixed saved pickup/dropoff addresses not appearing for selected shippers.
10. **Multi-language Navigation Labels** -- "My Orders" nav label added in English, Hindi, Punjabi, Marathi, and Tamil.

---

## 1. Frontend Changes

---

### 1.1 Admin Post-Load Page

**File:** `client/src/pages/admin/post-load.tsx`
**Change Type:** Modified
**Lines Changed:** +542 / -69

#### Hunk 1 -- Import Update (Line 5)

```id="pl-h1"
Lines Changed: 5

Old Code:
import { MapPin, Package, Calendar, Truck, ArrowRight, Sparkles, Info, Clock, CheckCircle2, Send, Building2, ChevronRight, Container, Droplet, Check, ChevronsUpDown, Loader2, Phone, DollarSign, Users, ClipboardList, User, X, Search } from "lucide-react";

New Code:
import { MapPin, Package, Calendar, Truck, ArrowRight, Sparkles, Info, Clock, CheckCircle2, Send, Building2, ChevronRight, Container, Droplet, Check, ChevronsUpDown, Loader2, Phone, DollarSign, Users, ClipboardList, User, X, Search, Calculator, TrendingUp, IndianRupee, Percent, BarChart3, Scale } from "lucide-react";
```

#### Hunk 2 -- Separator Import + Rate/Distance Data (Lines 56-96)

```id="pl-h2"
Lines Added: 56 -> 96

import { Separator } from "@/components/ui/separator";

const ratePerKmByType: Record<string, number> = {
  "17 ft": 38,
  "19 ft": 40,
  "20 ft": 42,
  "22 ft": 45,
  "24 ft": 48,
  "28 ft SXL": 52,
  "28 ft MXL": 55,
  "32 ft SXL": 58,
  "32 ft MXL": 62,
  "Open Truck": 45,
  "Trailer 20ft": 65,
  "Trailer 40ft": 75,
  "Container 20ft": 60,
  "Container 40ft": 70,
  "Taurus 14T": 55,
  "Taurus 16T": 58,
  "Taurus 21T": 62,
  "TATA Ace": 25,
  "Bolero Pickup": 28,
};

function estimateDistance(pickup: string, drop: string): number {
  const distanceMap: Record<string, number> = {
    "mumbai_delhi": 1400, "delhi_mumbai": 1400,
    "bangalore_chennai": 350, "chennai_bangalore": 350,
    "bengaluru_chennai": 350, "chennai_bengaluru": 350,
    "kolkata_delhi": 1500, "delhi_kolkata": 1500,
    "mumbai_chennai": 1340, "chennai_mumbai": 1340,
    "bangalore_hyderabad": 570, "hyderabad_bangalore": 570,
    "bengaluru_hyderabad": 570, "hyderabad_bengaluru": 570,
    "delhi_jaipur": 280, "jaipur_delhi": 280,
    "mumbai_pune": 150, "pune_mumbai": 150,
    "bhiwandi_ahmedabad": 530, "ahmedabad_bhiwandi": 530,
    "ahmedabad_mumbai": 524, "mumbai_ahmedabad": 524,
    "ludhiana_jaipur": 580, "jaipur_ludhiana": 580,
    "kolkata_guwahati": 980, "guwahati_kolkata": 980,
    "delhi_ludhiana": 310, "ludhiana_delhi": 310,
    "chennai_hyderabad": 625, "hyderabad_chennai": 625,
    "surat_mumbai": 284, "mumbai_surat": 284,
    "ahmedabad_surat": 265, "surat_ahmedabad": 265,
    "nagpur_mumbai": 840, "mumbai_nagpur": 840,
    "indore_mumbai": 585, "mumbai_indore": 585,
  };
  const key = `${pickup.toLowerCase().split(",")[0].trim()}_${drop.toLowerCase().split(",")[0].trim()}`;
  return distanceMap[key] || Math.floor(400 + Math.random() * 1200);
}

function calculatePricingBreakdown(pickupCity: string, dropoffCity: string, weight: number, truckType: string) {
  const distanceKm = estimateDistance(pickupCity, dropoffCity);
  const baseRate = ratePerKmByType[truckType] || 45;
  let baseAmount = distanceKm * baseRate;
  if (weight > 5) {
    baseAmount *= (1 + (weight - 5) * 0.02);
  }
  const fuelSurcharge = Math.round(baseAmount * 0.12);
  const platformFee = Math.round(baseAmount * 0.08);
  const handlingFee = 500;
  const suggestedPrice = Math.round(baseAmount + fuelSurcharge + platformFee + handlingFee);
  return {
    suggestedPrice,
    breakdown: { baseAmount: Math.round(baseAmount), fuelSurcharge, platformFee, handlingFee },
    params: { distanceKm, weightTons: weight, baseRatePerKm: baseRate },
  };
}
```

#### Hunk 3 -- Saved Address Query Key Fix (Lines 694-704)

```id="pl-h3"
Lines Changed: 697 -> 704

Old Code:
  const { data: savedPickupAddresses = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/saved-addresses', selectedShipperId, 'pickup'],
    enabled: !!selectedShipperId,
  });
  const { data: savedDropoffAddresses = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/saved-addresses', selectedShipperId, 'dropoff'],
    enabled: !!selectedShipperId,
  });

New Code:
  const { data: savedPickupAddresses = [] } = useQuery<any[]>({
    queryKey: [`/api/admin/saved-addresses/${selectedShipperId}/pickup`],
    enabled: !!selectedShipperId,
  });
  const { data: savedDropoffAddresses = [] } = useQuery<any[]>({
    queryKey: [`/api/admin/saved-addresses/${selectedShipperId}/dropoff`],
    enabled: !!selectedShipperId,
  });
```

#### Hunk 4 -- Shipper Pricing Auto-Population Effect (Lines 813-857)

```id="pl-h4"
Lines Added: 813 -> 857

  const postImmediately = form.watch("postImmediately");
  const watchedRateType = form.watch("rateType");
  const watchedShipperFixedPrice = form.watch("shipperFixedPrice");
  const watchedShipperPricePerTon = form.watch("shipperPricePerTon");
  const watchedAdvancePaymentPercent = form.watch("advancePaymentPercent");
  const prevShipperValuesRef = useRef({ rateType: "", fixedPrice: "", perTon: "", advance: "" });

  useEffect(() => {
    if (!postImmediately) return;

    const prev = prevShipperValuesRef.current;
    const currentFixed = watchedShipperFixedPrice || "";
    const currentPerTon = watchedShipperPricePerTon || "";
    const currentAdvance = watchedAdvancePaymentPercent || "";
    const currentRateType = watchedRateType || "fixed_price";

    if (currentRateType === "fixed_price" && currentFixed && currentFixed !== prev.fixedPrice) {
      const val = parseFloat(currentFixed.replace(/,/g, ""));
      if (val > 0) form.setValue("adminGrossPrice", Math.round(val).toString());
    }

    if (currentRateType === "per_ton" && currentPerTon && currentPerTon !== prev.perTon) {
      const val = parseFloat(currentPerTon.replace(/,/g, ""));
      if (val > 0) form.setValue("adminGrossPrice", Math.round(val).toString());
    }

    if (currentAdvance && currentAdvance !== prev.advance) {
      const adv = parseInt(currentAdvance);
      if (adv >= 0 && adv <= 100) form.setValue("carrierAdvancePercent", adv.toString());
    }

    prevShipperValuesRef.current = {
      rateType: currentRateType,
      fixedPrice: currentFixed,
      perTon: currentPerTon,
      advance: currentAdvance,
    };
  }, [postImmediately, watchedRateType, watchedShipperFixedPrice, watchedShipperPricePerTon, watchedAdvancePaymentPercent]);
```

#### Hunk 5 -- Per-Tonne Calculation in Form Submission (Lines 903-916)

```id="pl-h5"
Lines Changed: 903 -> 916

Old Code:
        adminGrossPrice: data.adminGrossPrice ? data.adminGrossPrice.replace(/,/g, '') : null,

New Code:
        adminGrossPrice: data.adminGrossPrice ? (() => {
          const rawPrice = parseFloat(data.adminGrossPrice.replace(/,/g, ''));
          if (data.rateType === "per_ton" && rawPrice > 0) {
            const wt = parseFloat(data.weight || "0");
            if (wt > 0) return Math.round(rawPrice * wt).toString();
          }
          return data.adminGrossPrice.replace(/,/g, '');
        })() : null,
```

#### Hunk 6 -- Card Comment Update (Line 2041)

```id="pl-h6"
Lines Changed: 2041

Old Code:
              {/* Admin Options Card */}

New Code:
              {/* Admin Options Card - Pricing Calculator */}
```

#### Hunk 7 -- Complete Pricing Calculator UI Replacement (Lines 2075-2498)

```id="pl-h7"
Lines Changed: 2075 -> 2498

Old Code (73 lines):
  {form.watch("postImmediately") && (
    <>
      <FormField control={form.control} name="adminGrossPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gross Price for Carriers (INR)</FormLabel>
            <FormControl>
              <Input type="text" placeholder="e.g. 45,000" {...field} data-testid="admin-input-gross-price" />
            </FormControl>
            <FormDescription>The price carriers will see and bid on</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="platformMargin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Platform Margin %</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10" min="0" max="50" {...field} data-testid="admin-input-platform-margin" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="carrierAdvancePercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carrier Advance %</FormLabel>
              <FormControl>
                <Input type="number" placeholder="30" min="0" max="100" {...field} data-testid="admin-input-carrier-advance" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )}

New Code (424 lines -- major sections):
  {form.watch("postImmediately") && (() => {
    // Computed pricing variables from form state
    const pickupCity, dropoffCity, weight, truckType, shipperRateType, etc.
    const effectiveTotalPrice = shipperRateType === "per_ton" ? grossPrice * weight : grossPrice;
    const platformEarning = effectiveTotalPrice * (marginPercent / 100);
    const carrierPayout = effectiveTotalPrice - platformEarning;
    const carrierAdvance = carrierPayout * (advancePercent / 100);

    return (
      <div className="space-y-4">
        {/* 1. Shipper's Pricing Preference Card (amber theme) */}
        {/* Shows shipper fixed price or per-tonne rate from form */}
        {/* "Use Shipper Price" and "Use Shipper Advance" buttons */}

        {/* 2. Price Estimation Card */}
        {/* Distance x base rate breakdown */}
        {/* Fuel surcharge (12%), Platform fee (8%), Handling fee */}
        {/* "Use Suggested Price" button */}

        {/* 3. Pricing Method Selection (Fixed Price / Per Tonne) */}
        {/* Two toggle buttons for rate type */}

        {/* 4. Admin Gross Price Input */}
        {/* Per-tonne rate input (shown when per_ton selected) */}
        {/* Effective total display for per-tonne */}

        {/* 5. Platform Margin Slider */}
        {/* Slider 0-50% with live percentage display */}

        {/* 6. Carrier Advance % Slider */}
        {/* Slider 0-100% with live percentage display */}

        {/* 7. Pricing Summary Cards */}
        {/* Shipper Pays (gross) | Platform Earning | Carrier Payout */}
        {/* Carrier Advance | Balance After Delivery */}
      </div>
    );
  })()}
```

---

### 1.2 Carrier My Orders Page (NEW FILE)

**File:** `client/src/pages/carrier/my-orders.tsx`
**Change Type:** Added
**Lines Added:** 594

```id="mo-add1"
Lines Added: 1 -> 594 (entire new file)

Key sections:

Lines 1-10: Imports (React, tanstack-query, lucide-react, shadcn/ui components)

Lines 12-25: Helper functions
  - formatCurrency(value): Indian Rupee formatting "Rs. X,XX,XXX"
  - formatLoadId(load): "LD-XXX" format from shipperLoadNumber or adminRefNumber
  - formatShipmentId(id): "SH-XXXXXXXX" format from UUID (first 8 chars, uppercase, no hyphens)

Lines 27-70: Status configuration
  - statusConfig object mapping 9 load statuses to colors and labels:
    awarded, in_transit, delivered, completed, closed,
    pickup_confirmed, pending, posted_to_carriers, cancelled
  - Each status has: label, bgColor, textColor

Lines 72-108: DetailRow component
  - Reusable component: icon + label + value display
  - Used throughout the order detail sheet

Lines 110-350: OrderDetailSheet component
  - Sheet (slide-out panel) with comprehensive order information
  - Sections: Route Info, Pricing Summary, Cargo Details, Schedule, Shipper Info, Shipment Info
  - Route section: pickup city -> dropoff city with arrow
  - Pricing section: Order Value (carrier payout), advance %, balance
  - Cargo section: material type, weight, truck type
  - Schedule section: pickup date, delivery date, assigned date
  - Shipper section: company name, phone
  - Shipment section: shipment ID (SH-format), shipment status

Lines 352-594: Main page component (default export)
  - API query: GET /api/carrier/my-orders
  - Tab filters: All, Active (awarded/in_transit/pickup_confirmed), Completed, Cancelled
  - Stats cards: Total Orders, Active, Completed
  - Filtered order list with OrderCard components
  - Each OrderCard shows: route, load ID, carrier info, price, status badge
  - Click opens OrderDetailSheet
  - Loading skeleton state
  - Empty state with message
```

---

### 1.3 Carrier Index Export

**File:** `client/src/pages/carrier/index.ts`
**Change Type:** Modified
**Lines Added:** 1

```id="ci-add1"
Lines Added: 5

export { default as CarrierMyOrdersPage } from "./my-orders";
```

---

### 1.4 App Router

**File:** `client/src/App.tsx`
**Change Type:** Modified
**Lines Added:** 2

```id="app-add1"
Lines Added: 63, 281

Line 63:
const CarrierMyOrdersPage = lazy(() => import("@/pages/carrier").then(m => ({ default: m.CarrierMyOrdersPage })));

Line 281:
<Route path="/carrier/my-orders" component={() => <CarrierOnboardingGate><CarrierMyOrdersPage /></CarrierOnboardingGate>} />
```

---

### 1.5 App Sidebar Navigation

**File:** `client/src/components/app-sidebar.tsx`
**Change Type:** Modified
**Lines Added:** 2

```id="sb-add1"
Lines Added: 65, 79

Line 65 (enterprise carrier nav items):
{ titleKey: "nav.myOrders", url: "/carrier/my-orders", icon: ClipboardList },

Line 79 (solo carrier nav items):
{ titleKey: "nav.myOrders", url: "/carrier/my-orders", icon: ClipboardList },
```

---

### 1.6 Admin Pricing Drawer

**File:** `client/src/components/admin/pricing-drawer.tsx`
**Change Type:** Modified
**Lines Changed:** +138 / -68

#### Hunk 1 -- Import Addition (Line 48)

```id="pd-h1"
Lines Added: 48

  Search,
```

#### Hunk 2 -- CarrierOption Interface Extension (Lines 80-87)

```id="pd-h2"
Lines Changed: 80 -> 87

Old Code:
interface CarrierOption {
  id: string;
  name: string;
  // ... existing fields
}

New Code:
interface CarrierOption {
  id: string;
  name: string;
  // ... existing fields
  carrierType: "enterprise" | "solo";
  phone?: string;
}
```

#### Hunk 3 -- Assign State Variables (Lines 165-172)

```id="pd-h3"
Lines Added: 166 -> 167

  const [assignedCarrier, setAssignedCarrier] = useState("");
  const [drawerCarrierSearch, setDrawerCarrierSearch] = useState("");
```

#### Hunk 4 -- Assign Validation (Lines 496-510)

```id="pd-h4"
Lines Added: 496 -> 504

    if (postMode === "assign" && !assignedCarrier) {
      toast({
        title: "Validation Error",
        description: "Please select a carrier to assign this load to.",
        variant: "destructive",
      });
      return;
    }
```

#### Hunk 5 -- Lock & Post Logic Split: Assign vs Open Market (Lines 523-609)

```id="pd-h5"
Lines Changed: 523 -> 609

Old Code (55 lines):
  // Single code path: save pricing -> lock & post
  const saveResponse = await apiRequest("POST", "/api/admin/pricing/save", {...});
  const saveData = await saveResponse.json();
  const currentPricingId = saveData.pricing?.id || pricingId;
  if (!currentPricingId) throw new Error("Failed to create pricing record");
  const response = await apiRequest("POST", "/api/admin/pricing/lock", {...});
  await response.json();
  toast({ title: "Load Posted Successfully", ... });

New Code (87 lines):
  if (postMode === "assign") {
    // Save pricing
    const saveResponse = await apiRequest("POST", "/api/admin/pricing/save", {...});
    await saveResponse.json();
    // Direct assign to carrier
    await apiRequest("POST", "/api/admin/assign", {
      load_id: load.id,
      carrier_id: assignedCarrier,
      final_price: finalPrice.toString(),
      gross_price: grossPrice.toString(),
    });
    const selectedCarrierName = carriers.find(c => c.id === assignedCarrier)?.name || "carrier";
    toast({ title: "Load Assigned Successfully", description: `...assigned to ${selectedCarrierName}...` });
  } else {
    // Save pricing -> lock & post (original flow)
    const saveResponse = await apiRequest("POST", "/api/admin/pricing/save", {...});
    const saveData = await saveResponse.json();
    const currentPricingId = saveData.pricing?.id || pricingId;
    if (!currentPricingId) throw new Error("Failed to create pricing record");
    await apiRequest("POST", "/api/admin/pricing/lock", {...});
    toast({ title: "Load Posted Successfully", ... });
  }
  // Cache invalidation now includes /api/carrier/my-orders
  queryClient.invalidateQueries({ queryKey: ["/api/carrier/my-orders"] });
```

#### Hunk 6 -- Carrier Search Filter Function (Lines 620-636)

```id="pd-h6"
Lines Added: 620 -> 633

  const drawerFilteredCarriers = useMemo(() => {
    if (!drawerCarrierSearch.trim()) return carriers;
    const q = drawerCarrierSearch.toLowerCase();
    return carriers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        c.carrierType.toLowerCase().includes(q)
    );
  }, [carriers, drawerCarrierSearch]);
```

#### Hunk 7 -- "Invite" Tab Replaced with "Direct Assign" (Lines 1125-1185)

```id="pd-h7"
Lines Changed: 1125 -> 1185

Old Code (48 lines):
  <Checkbox id="post-invite" checked={postMode === "invite"} onCheckedChange={() => setPostMode("invite")} />
  <Label htmlFor="post-invite">
    <span className="font-medium">Invite Specific Carriers</span>
    <p>Only invited carriers can view and bid</p>
  </Label>
  {postMode === "invite" && carriers.length > 0 && (
    <div className="ml-7 space-y-2 max-h-32 overflow-y-auto">
      {carriers.map((carrier) => (
        <div key={carrier.id}>
          <Checkbox id={`carrier-${carrier.id}`} checked={selectedCarriers.includes(carrier.id)}
            onCheckedChange={() => toggleCarrier(carrier.id)} />
          <Label>{carrier.name} ({carrier.completedLoads} loads)</Label>
        </div>
      ))}
    </div>
  )}
  <Checkbox id="allow-counter" checked={allowCounterBids} ... />
  <Label>Allow carriers to submit counter-offers</Label>

New Code (61 lines):
  <Checkbox id="post-assign" checked={postMode === "assign"} onCheckedChange={() => setPostMode("assign")} />
  <Label htmlFor="post-assign">
    <span className="font-medium">Direct Assign</span>
    <p>Assign directly to a carrier, bypassing marketplace</p>
  </Label>
  {postMode === "assign" && carriers.length > 0 && (
    <div className="ml-7 space-y-2">
      <Select value={assignedCarrier} onValueChange={setAssignedCarrier}>
        <SelectTrigger data-testid="select-drawer-assign-carrier">
          <SelectValue placeholder="Select carrier to assign" />
        </SelectTrigger>
        <SelectContent>
          {carriers.map((carrier) => (
            <SelectItem key={carrier.id} value={carrier.id}>
              <span className="flex items-center gap-2">
                {carrier.name}
                <Badge variant={carrier.carrierType === "solo" ? "secondary" : "outline"}>
                  {carrier.carrierType === "solo" ? "Solo" : "Fleet"}
                </Badge>
                <span className="text-xs">({carrier.completedLoads} loads)</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {assignedCarrier && (
        <p className="text-xs text-blue-600">
          Load will be directly assigned to {carriers.find(c => c.id === assignedCarrier)?.name}. It will appear in their My Orders page.
        </p>
      )}
    </div>
  )}
  {postMode !== "assign" && (
    <Checkbox id="allow-counter" checked={allowCounterBids} ... />
    <Label>Allow carriers to submit counter-offers</Label>
  )}
```

---

### 1.7 Admin Loads Page

**File:** `client/src/pages/admin/loads.tsx`
**Change Type:** Modified
**Lines Changed:** +67 / -24

#### Hunk 1 -- Import Update (Line 1)

```id="al-h1"
Lines Changed: 4

Old Code:
import { queryClient } from "@/lib/queryClient";

New Code:
import { apiRequest, queryClient } from "@/lib/queryClient";
```

#### Hunk 2 -- Removed Mock Carriers, Added Real Carrier Query (Lines 144-177)

```id="al-h2"
Lines Changed: 144

Old Code:
  const { carriers, updateLoad, assignCarrier, updateLoadStatus, addActivity } = useAdminData();

New Code:
  const { updateLoad, updateLoadStatus, addActivity } = useAdminData();

Lines Added: 149 -> 177

  type RealCarrier = {
    id: string;
    username: string;
    companyName: string | null;
    phone: string | null;
    isVerified: boolean | null;
    profile: {
      carrierType: string | null;
      totalDeliveries: number | null;
      fleetSize: number | null;
    } | null;
    bidCount: number;
  };

  const { data: realCarriers = [] } = useQuery<RealCarrier[]>({
    queryKey: ["/api/admin/carriers"],
  });

  const verifiedRealCarriers = useMemo(() => 
    realCarriers.filter(c => c.isVerified),
    [realCarriers]
  );
```

#### Hunk 3 -- handleAssignCarrier Rewrite (Lines 357-392)

```id="al-h3"
Lines Changed: 357 -> 392

Old Code:
  const handleAssignCarrier = () => {
    if (selectedLoad && selectedCarrierId) {
      const carrier = carriers.find(c => c.carrierId === selectedCarrierId);
      if (carrier) {
        assignCarrier(selectedLoad.loadId, carrier.carrierId, carrier.companyName);
        toast({
          title: "Carrier Assigned",
          description: `${carrier.companyName} assigned to load ${selectedLoad.loadId}`,
        });
      }
      setIsAssignModalOpen(false);
      setSelectedLoad(null);

New Code:
  const handleAssignCarrier = async () => {
    if (selectedLoad && selectedCarrierId) {
      const carrier = verifiedRealCarriers.find(c => c.id === selectedCarrierId);
      if (carrier) {
        try {
          const apiLoad = apiLoads.find(l => l.id === selectedLoad.loadId);
          const carrierPayout = apiLoad?.finalPrice || "0";
          const shipperGross = apiLoad?.adminFinalPrice || apiLoad?.adminSuggestedPrice || carrierPayout;

          await apiRequest("POST", "/api/admin/assign", {
            load_id: selectedLoad.loadId,
            carrier_id: carrier.id,
            final_price: carrierPayout,
            gross_price: shipperGross,
          });

          queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
          queryClient.invalidateQueries({ queryKey: ["/api/carrier/my-orders"] });

          toast({
            title: "Carrier Assigned",
            description: `${carrier.companyName || carrier.username} assigned to this load`,
          });
        } catch (error: any) {
          toast({
            title: "Assignment Failed",
            description: error.message || "Could not assign carrier",
            variant: "destructive",
          });
        }
      }
      setIsAssignModalOpen(false);
      setSelectedLoad(null);
```

#### Hunk 4 -- Remove Old verifiedCarriers Variable (Line 491)

```id="al-h4"
Lines Deleted: 491 -> 492

Old Code:
  const verifiedCarriers = carriers.filter(c => c.verificationStatus === "verified");
```

#### Hunk 5 -- Carrier Dropdown UI Update (Lines 1114-1150)

```id="al-h5"
Lines Changed: 1114 -> 1150

Old Code:
  {verifiedCarriers.map((carrier) => (
    <SelectItem key={carrier.carrierId} value={carrier.carrierId}>
      <div className="flex items-center justify-between w-full gap-4">
        <span>{carrier.companyName}</span>
        <Badge variant="secondary" className="text-xs">
          {carrier.rating.toFixed(1)} rating
        </Badge>
      </div>
    </SelectItem>
  ))}

New Code:
  {verifiedRealCarriers.map((carrier) => (
    <SelectItem key={carrier.id} value={carrier.id}>
      <div className="flex items-center gap-2">
        <span>{carrier.companyName || carrier.username}</span>
        <Badge variant={carrier.profile?.carrierType === "solo" ? "secondary" : "outline"} className="text-[9px] px-1 py-0">
          {carrier.profile?.carrierType === "solo" ? "Solo" : "Fleet"}
        </Badge>
        <span className="text-xs text-muted-foreground">({carrier.profile?.totalDeliveries || 0} loads)</span>
      </div>
    </SelectItem>
  ))}
```

#### Hunk 6 -- Carrier Info Panel Update (Lines 1131-1150)

```id="al-h6"
Lines Changed: 1131 -> 1150

Old Code:
  const carrier = carriers.find(c => c.carrierId === selectedCarrierId);
  // Shows: Fleet Size, On-Time %, Deliveries

New Code:
  const carrier = verifiedRealCarriers.find(c => c.id === selectedCarrierId);
  // Shows: Type (Solo Driver / Fleet Carrier), Phone, Completed Loads
```

---

### 1.8 Admin Load Details Page

**File:** `client/src/pages/admin/load-details.tsx`
**Change Type:** Modified
**Lines Changed:** +63 / -13

#### Hunk 1 -- RealCarrier Type + Query (Lines 890-920)

```id="ld-h1"
Lines Changed: 892 -> 893

Old Code:
  const { getDetailedLoad, updateLoadStatus, cancelLoad, assignCarrier, addAdminNote, approveDocument, rejectDocument, carriers, refreshFromShipperPortal } = useAdminData();

New Code:
  const { getDetailedLoad, updateLoadStatus, cancelLoad, assignCarrier, addAdminNote, approveDocument, rejectDocument, refreshFromShipperPortal } = useAdminData();

Lines Added: 894 -> 920

  type RealCarrier = {
    id: string;
    username: string;
    companyName: string | null;
    phone: string | null;
    isVerified: boolean | null;
    profile: {
      carrierType: string | null;
      totalDeliveries: number | null;
      fleetSize: number | null;
    } | null;
    bidCount: number;
  };

  const { data: realCarriers = [] } = useQuery<RealCarrier[]>({
    queryKey: ["/api/admin/carriers"],
  });

  const verifiedRealCarriers = useMemo(() => 
    realCarriers.filter(c => c.isVerified),
    [realCarriers]
  );
```

#### Hunk 2 -- handleReassignCarrier Rewrite (Lines 1443-1478)

```id="ld-h2"
Lines Changed: 1443 -> 1478

Old Code:
  const handleReassignCarrier = () => {
    const carrier = carriers.find(c => c.carrierId === selectedCarrierId);
    if (carrier) {
      assignCarrier(loadId, carrier.carrierId, carrier.companyName);
      setIsReassignModalOpen(false);
      toast({
        title: "Carrier Reassigned",
        description: `${carrier.companyName} has been assigned to this load`,
      });
    }
  };

New Code:
  const handleReassignCarrier = async () => {
    const carrier = verifiedRealCarriers.find(c => c.id === selectedCarrierId);
    if (carrier) {
      try {
        const carrierPayout = apiLoad?.finalPrice || "0";
        const shipperGross = apiLoad?.adminFinalPrice || apiLoad?.adminSuggestedPrice || carrierPayout;

        await apiRequest("POST", "/api/admin/assign", {
          load_id: loadId,
          carrier_id: carrier.id,
          final_price: carrierPayout,
          gross_price: shipperGross,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
        queryClient.invalidateQueries({ queryKey: ["/api/loads", loadId] });
        queryClient.invalidateQueries({ queryKey: ["/api/carrier/my-orders"] });

        setIsReassignModalOpen(false);
        toast({
          title: "Carrier Assigned",
          description: `${carrier.companyName || carrier.username} has been assigned to this load`,
        });
      } catch (error: any) {
        toast({
          title: "Assignment Failed",
          description: error.message || "Could not assign carrier",
          variant: "destructive",
        });
      }
    }
  };
```

#### Hunk 3 -- Carrier Selection Dropdown Update (Lines 2814-2828)

```id="ld-h3"
Lines Changed: 2814 -> 2828

Old Code:
  {carriers.filter(c => c.verificationStatus === "verified").slice(0, 20).map((carrier) => (
    <SelectItem key={carrier.carrierId} value={carrier.carrierId}>
      {carrier.companyName} (Rating: {carrier.rating})
    </SelectItem>
  ))}

New Code:
  {verifiedRealCarriers.map((carrier) => (
    <SelectItem key={carrier.id} value={carrier.id}>
      <div className="flex items-center gap-2">
        <span>{carrier.companyName || carrier.username}</span>
        <Badge variant={carrier.profile?.carrierType === "solo" ? "secondary" : "outline"} className="text-[9px] px-1 py-0">
          {carrier.profile?.carrierType === "solo" ? "Solo" : "Fleet"}
        </Badge>
        <span className="text-xs text-muted-foreground">({carrier.profile?.totalDeliveries || 0} loads)</span>
      </div>
    </SelectItem>
  ))}
```

---

### 1.9 Admin Load Queue

**File:** `client/src/pages/admin/load-queue.tsx`
**Change Type:** Modified
**Lines Changed:** +113 / -63

#### Hunk 1 -- CarrierOption Interface Extension (Lines 121-128)

```id="lq-h1"
Lines Added: 123 -> 124

  carrierType: "enterprise" | "solo";
  phone?: string;
```

#### Hunk 2 -- Mock Carriers Removed (Lines 225-231)

```id="lq-h2"
Lines Deleted: 225 -> 231

const mockCarriers: CarrierOption[] = [
  { id: "c1", name: "Rajesh Transport", rating: 4.8, trucks: 45, zone: "North India", completedLoads: 234 },
  { id: "c2", name: "Sharma Logistics", rating: 4.6, trucks: 28, zone: "West India", completedLoads: 189 },
  { id: "c3", name: "Kumar Fleet", rating: 4.9, trucks: 62, zone: "South India", completedLoads: 312 },
  { id: "c4", name: "Singh Carriers", rating: 4.5, trucks: 35, zone: "North India", completedLoads: 156 },
  { id: "c5", name: "Patel Movers", rating: 4.7, trucks: 41, zone: "West India", completedLoads: 278 },
];
```

#### Hunk 3 -- Carrier Search State (Line 341)

```id="lq-h3"
Lines Added: 341

  const [carrierSearchQuery, setCarrierSearchQuery] = useState("");
```

#### Hunk 4 -- Real Carrier Data Fetch + Transform + Filter (Lines 429-465)

```id="lq-h4"
Lines Added: 429 -> 465

  const { data: realCarriersRaw = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/carriers"],
  });

  const realCarriers: CarrierOption[] = useMemo(() => {
    return realCarriersRaw
      .filter((c: any) => c.isVerified)
      .map((c: any) => ({
        id: c.id,
        name: c.companyName || c.username || "Unknown",
        rating: 0,
        trucks: 0,
        zone: "",
        completedLoads: c.bidCount || 0,
        carrierType: (c.profile?.carrierType === "solo" ? "solo" : "enterprise") as "enterprise" | "solo",
        phone: c.phone || undefined,
      }))
      .sort((a, b) => b.completedLoads - a.completedLoads);
  }, [realCarriersRaw]);

  const filteredCarriers = useMemo(() => {
    if (!carrierSearchQuery.trim()) return realCarriers;
    const q = carrierSearchQuery.toLowerCase();
    return realCarriers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        c.carrierType.toLowerCase().includes(q)
    );
  }, [realCarriers, carrierSearchQuery]);
```

#### Hunk 5 -- Invoice Send: Auto-Generate When Missing (Lines 602-653)

```id="lq-h5"
Lines Changed: 602 -> 653

Old Code:
      // First, check if invoice exists for this load
      if (!loadToSendInvoice.invoiceId) {
        toast({
          title: t('common.error'),
          description: "No invoice found for this load. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Send the invoice to shipper
      console.log(`[LoadQueue] Sending invoice ${loadToSendInvoice.invoiceId} for load ${loadToSendInvoice.id}`);
      const res = await apiRequest('POST', `/api/admin/invoices/${loadToSendInvoice.invoiceId}/send`);

New Code:
      let res;

      if (!loadToSendInvoice.invoiceId) {
        const shipperGross = loadToSendInvoice.adminFinalPrice || loadToSendInvoice.finalPrice || "0";
        console.log(`[LoadQueue] No invoice exists, generating and sending for load ${loadToSendInvoice.id} with amount ${shipperGross}`);
        res = await apiRequest('POST', '/api/admin/invoice/generate-and-send', {
          load_id: loadToSendInvoice.id,
          amount: shipperGross,
        });
      } else {
        console.log(`[LoadQueue] Sending existing invoice ${loadToSendInvoice.invoiceId} for load ${loadToSendInvoice.id}`);
        res = await apiRequest('POST', `/api/admin/invoices/${loadToSendInvoice.invoiceId}/send`);
      }
```

#### Hunk 6 -- Invoice Success Check Update (Lines 629-643)

```id="lq-h6"
Lines Changed: 629 -> 643

Old Code:
      if (invoiceData && invoiceData.status === 'sent') {

New Code:
      const isSent = invoiceData?.status === 'sent' || invoiceData?.success || invoiceData?.invoice?.status === 'sent';
      if (isSent) {
```

#### Hunk 7 -- Search State Reset (Line 792)

```id="lq-h7"
Lines Added: 792

    setCarrierSearchQuery("");
```

#### Hunk 8 -- mockCarriers -> realCarriers References (Lines 815-835)

```id="lq-h8"
Lines Changed: 815 -> 835

Old Code:
        carrier: postMode === "assign" ? mockCarriers.find(c => c.id === assignedCarrier)?.name || null : null,
        // ...
          ? `Load assigned to ${mockCarriers.find(c => c.id === assignedCarrier)?.name}`

New Code:
        carrier: postMode === "assign" ? realCarriers.find(c => c.id === assignedCarrier)?.name || null : null,
        // ...
          ? `Load assigned to ${realCarriers.find(c => c.id === assignedCarrier)?.name}`
```

#### Hunk 9 -- Invite Tab: Carrier Search + Badge Enhancement (Lines 1301-1364)

```id="lq-h9"
Lines Changed: 1301 -> 1364

Old Code (43 lines):
  <ScrollArea className="h-[150px] border rounded-md p-2">
    {mockCarriers.map((carrier) => (
      <div key={carrier.id} className="flex items-center justify-between p-2 hover-elevate rounded-md">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={selectedCarriers.includes(carrier.id)} ... />
          <div>
            <p className="font-medium text-sm">{carrier.name}</p>
            <p className="text-xs text-muted-foreground">
              {carrier.zone} | {carrier.trucks} trucks | {carrier.completedLoads} loads
            </p>
          </div>
        </div>
        <Badge variant="secondary">{carrier.rating.toFixed(1)} rating</Badge>
      </div>
    ))}
  </ScrollArea>
  {selectedCarriers.length > 0 && (
    <p className="text-sm">{selectedCarriers.length} carrier(s) selected</p>
  )}

New Code (64 lines):
  <div className="relative">
    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    <input type="text" placeholder="Search carriers by name, phone, or type..."
      value={carrierSearchQuery} onChange={(e) => setCarrierSearchQuery(e.target.value)}
      className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background"
      data-testid="input-carrier-search" />
  </div>
  <ScrollArea className="h-[200px] border rounded-md p-2">
    {filteredCarriers.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-4">No carriers found</p>
    ) : (
      filteredCarriers.map((carrier) => (
        <div key={carrier.id} className="flex items-center justify-between p-2 hover-elevate rounded-md"
          data-testid={`carrier-item-${carrier.id}`}>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={selectedCarriers.includes(carrier.id)} ...
              data-testid={`checkbox-carrier-${carrier.id}`} />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{carrier.name}</p>
                <Badge variant={carrier.carrierType === "solo" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                  {carrier.carrierType === "solo" ? "Solo Driver" : "Fleet"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {carrier.completedLoads} loads completed
                {carrier.phone ? ` -- ${carrier.phone}` : ""}
              </p>
            </div>
          </div>
        </div>
      ))
    )}
  </ScrollArea>
  <div className="flex items-center justify-between text-sm text-muted-foreground">
    {selectedCarriers.length > 0 && (<p>{selectedCarriers.length} carrier(s) selected</p>)}
    <p className="ml-auto">{filteredCarriers.length} of {realCarriers.length} carriers</p>
  </div>
```

#### Hunk 10 -- Assign Tab: mockCarriers -> realCarriers (Lines 1367-1435)

```id="lq-h10"
Lines Changed: 1367 -> 1435

Old Code:
  {mockCarriers.map((carrier) => (
    <SelectItem key={carrier.id} value={carrier.id}>
      <div className="flex items-center gap-2">
        <span>{carrier.name}</span>
        <Badge variant="outline" className="ml-2">{carrier.rating.toFixed(1)}</Badge>
      </div>
    </SelectItem>
  ))}
  // ...
  <strong>{mockCarriers.find(c => c.id === assignedCarrier)?.name}</strong>
  // ...
  carriers={mockCarriers}

New Code:
  {realCarriers.map((carrier) => (
    <SelectItem key={carrier.id} value={carrier.id}>
      <span className="flex items-center gap-2">
        {carrier.name}
        <Badge variant={carrier.carrierType === "solo" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
          {carrier.carrierType === "solo" ? "Solo" : "Fleet"}
        </Badge>
        <span className="text-muted-foreground text-xs">({carrier.completedLoads} loads)</span>
      </span>
    </SelectItem>
  ))}
  // ...
  <strong>{realCarriers.find(c => c.id === assignedCarrier)?.name}</strong>
  // ...
  carriers={realCarriers}
```

---

### 1.10 Internationalization (i18n)

**Files Modified:** 5 locale files
**Lines Added:** 2 per file (10 total)

| File | Lines Added | Key | Value |
|------|-----------|-----|-------|
| `client/src/i18n/locales/en.json` | 125, 691 | `nav.myOrders`, `carrier.myOrders` | `"My Orders"` |
| `client/src/i18n/locales/hi.json` | 119, 683 | `nav.myOrders`, `carrier.myOrders` | `"मेरे ऑर्डर"` |
| `client/src/i18n/locales/mr.json` | 119, 683 | `nav.myOrders`, `carrier.myOrders` | `"माझे ऑर्डर"` |
| `client/src/i18n/locales/pa.json` | 119, 683 | `nav.myOrders`, `carrier.myOrders` | `"ਮੇਰੇ ਆਰਡਰ"` |
| `client/src/i18n/locales/ta.json` | 119, 683 | `nav.myOrders`, `carrier.myOrders` | `"என் ஆர்டர்கள்"` |

---

## 2. Backend Changes

---

### 2.1 Server Routes

**File:** `server/routes.ts`
**Change Type:** Modified
**Lines Changed:** +92 / -13

#### Hunk 1 -- Per-Tonne Pricing Calculation in Admin Post-Load (Lines 2741-2758)

```id="rt-h1"
Lines Added: 2743 -> 2753

      // For per-tonne pricing, calculate the effective total price (rate x weight)
      let effectiveAdminGrossPrice = body.adminGrossPrice;
      if (body.adminGrossPrice && body.rateType === 'per_ton' && body.weight) {
        const perTonRate = parseFloat(String(body.adminGrossPrice).replace(/,/g, ''));
        const weightVal = parseFloat(String(body.weight));
        if (perTonRate > 0 && weightVal > 0) {
          effectiveAdminGrossPrice = String(Math.round(perTonRate * weightVal));
        }
      }

Lines Changed: 2754

Old Code:
      const status = body.postImmediately && body.adminGrossPrice ? 'posted_to_carriers' : 'pending';

New Code:
      const status = body.postImmediately && effectiveAdminGrossPrice ? 'posted_to_carriers' : 'pending';
```

#### Hunk 2 -- adminFinalPrice Uses effectiveAdminGrossPrice (Line 2788)

```id="rt-h2"
Lines Changed: 2790

Old Code:
        adminFinalPrice: body.postImmediately && body.adminGrossPrice ? String(body.adminGrossPrice) : null,

New Code:
        adminFinalPrice: body.postImmediately && effectiveAdminGrossPrice ? String(effectiveAdminGrossPrice) : null,
```

#### Hunk 3 -- Admin Decision Uses effectiveAdminGrossPrice + Rate Metadata (Lines 2798-2819)

```id="rt-h3"
Lines Changed: 2800 -> 2819

Old Code:
      if (body.postImmediately && body.adminGrossPrice) {
        await storage.createAdminDecision({
          loadId: load.id,
          adminId: adminUser.id,
          suggestedPrice: parseInt(body.adminGrossPrice),
          finalPrice: parseInt(body.adminGrossPrice),
          postingMode: 'open_market',
          invitedCarrierIds: null,
          comment: 'Posted by admin via Post a Load',
          pricingBreakdown: {
            grossPrice: body.adminGrossPrice,
            platformMargin: body.platformMargin || '10',
            carrierAdvance: body.carrierAdvancePercent || '30',
          },
          actionType: 'price_and_post',
        });

New Code:
      if (body.postImmediately && effectiveAdminGrossPrice) {
        await storage.createAdminDecision({
          loadId: load.id,
          adminId: adminUser.id,
          suggestedPrice: String(effectiveAdminGrossPrice),
          finalPrice: String(effectiveAdminGrossPrice),
          postingMode: 'open_market',
          invitedCarrierIds: null,
          comment: 'Posted by admin via Post a Load',
          pricingBreakdown: {
            grossPrice: effectiveAdminGrossPrice,
            platformMargin: body.platformMargin || '10',
            carrierAdvance: body.carrierAdvancePercent || '30',
            rateType: body.rateType || 'fixed_price',
            perTonRate: body.rateType === 'per_ton' ? body.adminGrossPrice : null,
            weight: body.weight || null,
          },
          actionType: 'price_and_post',
        });
```

#### Hunk 4 -- WebSocket Notification Uses effectiveAdminGrossPrice (Line 2828)

```id="rt-h4"
Lines Changed: 2830

Old Code:
            price: parseInt(body.adminGrossPrice),

New Code:
            price: parseInt(effectiveAdminGrossPrice),
```

#### Hunk 5 -- Response Uses effectiveAdminGrossPrice (Line 2838)

```id="rt-h5"
Lines Changed: 2840

Old Code:
        posted: body.postImmediately && body.adminGrossPrice ? true : false,

New Code:
        posted: body.postImmediately && effectiveAdminGrossPrice ? true : false,
```

#### Hunk 6 -- NEW ENDPOINT: GET /api/carrier/my-orders (Lines 4712-4762)

```id="rt-h6"
Lines Added: 4714 -> 4762

  // Carrier My Orders - loads directly assigned by admin (bypass marketplace)
  app.get("/api/carrier/my-orders", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "carrier") {
        return res.status(403).json({ error: "Carrier access required" });
      }

      const carrierLoads = await storage.getLoadsByCarrier(user.id);
      const directAssignments = carrierLoads.filter(
        (load) => load.adminPostMode === "assign"
      );

      const enrichedOrders = await Promise.all(
        directAssignments.map(async (load) => {
          const shipper = load.shipperId ? await storage.getUser(load.shipperId) : null;
          const shipment = await storage.getShipmentByLoad(load.id);
          const decision = load.adminDecisionId
            ? await storage.getAdminDecision(load.adminDecisionId)
            : null;

          // Safety net: auto-calculate carrier payout if missing
          let carrierPayout = load.finalPrice || "0";
          if (parseFloat(carrierPayout) <= 0 && load.adminFinalPrice && parseFloat(load.adminFinalPrice) > 0) {
            carrierPayout = String(Math.round(parseFloat(load.adminFinalPrice) * 0.9 * 100) / 100);
          }

          // Strip shipper-only pricing fields
          const { adminSuggestedPrice: _sp, adminPerTonneRate: _ptr, adminFinalPrice: _afp, ...carrierSafeLoad } = load;

          return {
            ...carrierSafeLoad,
            finalPrice: carrierPayout,
            shipperName: shipper?.companyName || shipper?.username || "Unknown",
            shipperPhone: shipper?.phone || null,
            shipmentId: shipment?.id || null,
            shipmentStatus: shipment?.status || null,
            assignedBy: decision ? "Admin" : "System",
            assignedAt: load.awardedAt || load.statusChangedAt || load.createdAt,
          };
        })
      );

      enrichedOrders.sort((a, b) => {
        const dateA = new Date(a.assignedAt || 0).getTime();
        const dateB = new Date(b.assignedAt || 0).getTime();
        return dateB - dateA;
      });

      res.json(enrichedOrders);
    } catch (error) {
      console.error("Get carrier my-orders error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
```

#### Hunk 7 -- MODIFIED ENDPOINT: GET /api/carrier/available-loads (Lines 4787-4800)

```id="rt-h7"
Lines Changed: 4789 -> 4800

Old Code:
          return {
            ...load,
            shipperName: shipper?.companyName || shipper?.username,

New Code:
          // Safety net: auto-calculate carrier payout if missing
          let carrierPayout = load.finalPrice || "0";
          if (parseFloat(carrierPayout) <= 0 && load.adminFinalPrice && parseFloat(load.adminFinalPrice) > 0) {
            carrierPayout = String(Math.round(parseFloat(load.adminFinalPrice) * 0.9 * 100) / 100);
          }
          // Strip shipper-only pricing fields
          const { adminSuggestedPrice: _sp, adminPerTonneRate: _ptr, adminFinalPrice: _afp, ...carrierSafeLoad } = load;
          return {
            ...carrierSafeLoad,
            finalPrice: carrierPayout,
            shipperName: shipper?.companyName || shipper?.username,
```

#### Hunk 8 -- MODIFIED ENDPOINT: POST /api/admin/assign (Lines 5178-5226)

```id="rt-h8"
Lines Changed: 5180 -> 5226

Old Code:
      const { load_id, carrier_id, truck_id, final_price } = req.body;

      // ...carrier/load validation...

      // Create admin decision for assignment
      const decision = await storage.createAdminDecision({
        loadId: load_id,
        adminId: user.id,
        suggestedPrice: load.adminSuggestedPrice || final_price,
        finalPrice: final_price || load.adminFinalPrice || "0",
        postingMode: 'assign',
        comment: `Direct assignment to ${carrier.companyName || carrier.username}`,
        actionType: 'assign',
      });

      const pickupId = await storage.generateUniquePickupId();

      // Update load with canonical awarded status
      const updatedLoad = await storage.updateLoad(load_id, {
        assignedCarrierId: carrier_id,
        assignedTruckId: truck_id || null,
        // ... (no adminFinalPrice, finalPrice, or adminSuggestedPrice set)

New Code:
      const { load_id, carrier_id, truck_id, final_price, gross_price } = req.body;

      // ...carrier/load validation...

      // Safety net: calculate carrier payout from shipper gross if needed
      let carrierPayout = final_price || load.finalPrice || "0";
      const shipperGross = gross_price || load.adminFinalPrice || load.adminSuggestedPrice || carrierPayout;
      if (parseFloat(carrierPayout) <= 0 && parseFloat(shipperGross) > 0) {
        carrierPayout = String(Math.round(parseFloat(shipperGross) * 0.9 * 100) / 100);
      }

      // Create admin decision for assignment
      const decision = await storage.createAdminDecision({
        loadId: load_id,
        adminId: user.id,
        suggestedPrice: shipperGross,
        finalPrice: carrierPayout,
        postingMode: 'assign',
        comment: `Direct assignment to ${carrier.companyName || carrier.username}`,
        actionType: 'assign',
      });

      const pickupId = await storage.generateUniquePickupId();

      // Update load: adminFinalPrice = shipper's gross price, finalPrice = carrier payout
      const updatedLoad = await storage.updateLoad(load_id, {
        assignedCarrierId: carrier_id,
        assignedTruckId: truck_id || null,
        // ...
        adminFinalPrice: shipperGross,
        finalPrice: carrierPayout,
        adminSuggestedPrice: shipperGross,
```

---

## 3. Database / Migration Changes

**No schema migrations on 21 February 2026.**

Direct data corrections applied via SQL during the session:
- 2 loads updated: `final_price` was `0.00`, set to `ROUND(admin_final_price * 0.9, 2)` (90% payout)
- 1 load (`471d1ca1`): `final_price` changed from `10000.00` to `9000.00` (10% platform margin applied)

---

## 4. Config / DevOps Changes

### 4.1 Project Documentation

**File:** `replit.md`
**Change Type:** Modified
**Lines Changed:** +25 / -137

**Summary:**
- Condensed overview section
- Replaced separate Frontend/Backend architecture sections with unified "Core Technologies" section
- Added "User Interface and Experience" section describing theme, language support, chat widget
- Added "Workflow and Feature Specifications" section listing all major platform features
- Removed verbose per-feature workflow descriptions
- Cleaned up external dependencies list

### 4.2 No package.json Changes

No new dependencies were added on this date.

---

## Module Classification Summary

| Module | Files Changed | Change Types |
|--------|--------------|-------------|
| **Admin Panel** | `post-load.tsx`, `loads.tsx`, `load-details.tsx`, `load-queue.tsx`, `pricing-drawer.tsx` | Modified |
| **Carrier Portal** | `my-orders.tsx` (new), `index.ts` | Added, Modified |
| **Navigation & Routing** | `App.tsx`, `app-sidebar.tsx` | Modified |
| **Payments / Invoicing** | `load-queue.tsx` (invoice send flow) | Modified |
| **APIs** | `server/routes.ts` (4 endpoints) | Modified |
| **Internationalization** | `en.json`, `hi.json`, `mr.json`, `pa.json`, `ta.json` | Modified |
| **Documentation** | `replit.md` | Modified |
| **UI Components** | `pricing-drawer.tsx` | Modified |

---

## API Change Summary

| Method | Endpoint | Change | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/carrier/my-orders` | **Added** | Returns carrier's directly assigned loads with sanitized pricing (strips adminFinalPrice, adminSuggestedPrice), enriched with shipper info, shipment status, payout safety net |
| `GET` | `/api/carrier/available-loads` | **Modified** | Added payout safety net (auto-calc from adminFinalPrice * 0.9 if finalPrice is 0), strips shipper-only pricing fields from response |
| `POST` | `/api/admin/assign` | **Modified** | Added `gross_price` request parameter, carrier payout auto-calculation, stores `adminFinalPrice` (shipper gross) and `finalPrice` (carrier payout) and `adminSuggestedPrice` on load record |
| `POST` | `/api/admin/post-load` | **Modified** | Per-tonne rate calculation (`rate x weight`), stores `rateType`, `perTonRate`, and `weight` in pricing breakdown metadata |

---

## Commit Log (Chronological)

| # | Time (UTC) | Commit | Description |
|---|------------|--------|-------------|
| 1 | 13:29 | `471d1ff` | Add pricing calculator to admin post load page |
| 2 | 13:33 | `a1af2fe` | Saved progress at the end of the loop |
| 3 | 13:37 | `ddead09` | Update pricing calculator to match load queue drawer UI |
| 4 | 13:41 | `9a39ec9` | Add shipper pricing preferences to admin post-load page |
| 5 | 13:46 | `ad35c2a` | Update pricing calculator to correctly handle per-tonne rates |
| 6 | 13:48 | `e1d6c64` | Automatically populate shipper pricing details into the admin calculator |
| 7 | 13:50 | `9f5e6bb` | Fix issue where saved addresses do not appear for selected shippers |
| 8 | 13:55 | `42a297e` | Calculate correct total price for per-tonne shipping rates |
| 9 | 13:57 | `d767b86` | Ensure accurate pricing by calculating total cost on the server |
| 10 | 13:59 | `21dab23` | Correctly calculate total shipment prices for per-tonne rates |
| 11 | 14:02 | `e61cdc1` | Update pricing display to reflect accurate administrative charges |
| 12 | 14:23 | `8b22663` | Add dedicated page for carriers to view directly assigned orders |
| 13 | 14:28 | `a611d97` | Saved progress at the end of the loop |
| 14 | 14:39 | `aaf237d` | Update carrier selection to use real data instead of mock data |
| 15 | 14:41 | `b9b2e12` | Saved progress at the end of the loop |
| 16 | 14:44 | `b59d87b` | Enhance carrier selection with filtering and verification |
| 17 | 14:46 | `f99fb93` | Show solo carriers and fleet carriers with correct badges and search |
| 18 | 14:50 | `b97c277` | Add functionality to directly assign loads to specific carriers |
| 19 | 14:52 | `55ca5a7` | Remove the ability to invite specific carriers to bid on shipments |
| 20 | 14:57 | `bfca6d9` | Enhance carrier order details view with comprehensive information |
| 21 | 15:01 | `9a21056` | Ensure order values are correctly displayed after assignment |
| 22 | 15:04 | `52825b4` | Update order value to show carrier payout instead of shipper price |
| 23 | 15:07 | `1544287` | Update order details to display carrier payout and remove unnecessary pricing |
| 24 | 15:09 | `06d4c08` | Update documentation to reflect standard carrier payout display |
| 25 | 15:18 | `4a8cc36` | Update carrier assignment to use a consistent backend API endpoint |
| 26 | 15:28 | `ec0f783` | Update to use real carrier data instead of mock data |
| 27 | 15:31 | `83e95b2` | Update carrier information display to match API structure |
| 28 | 15:35 | `74b0bd5` | Update order value display to show carrier payout accurately |
| 29 | 15:40 | `b07e008` | Correctly display carrier payouts and adjust admin pricing logic |
| 30 | 15:50 | `cf70d35` | Ensure carriers see accurate pricing and hide sensitive shipper costs |
| 31 | 16:47 | `53fad29` | Published your App |
| 32 | 16:57 | `5d70030` | Ensure accurate carrier payouts are displayed and calculated correctly |
| 33 | 17:02 | `9452036` | Format shipment IDs to display in a user-friendly style |
| 34 | 17:06 | `2458e1c` | Add ability to auto-generate and send invoices for loads |
| 35 | 17:08 | `3514b66` | Update admin and carrier pages with new features and fixes |
| 36 | 17:13 | `3b086c4` | Published your App |
| 37 | 17:15 | `b5e4182` | Update pricing, invoicing, and shipment ID displays across the platform |

---

*Report generated: 21 February 2026*
*Analysis scope: 21 Feb 2026 00:00 - 23:59 UTC*
*Read-only analysis -- no code modifications made*
