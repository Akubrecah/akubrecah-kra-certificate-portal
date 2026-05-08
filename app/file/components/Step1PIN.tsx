// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  ArrowDown,
  Flag,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  User,
  Mail,
  Building2,
  MapPin,
  LogIn,
  FileText,
  FileDown,
  CheckCircle,
  PhoneIcon,
  CreditCard,
  AlertTriangle,
  X,
  Shield,
  ShieldCheck,
  Fingerprint,
  Clock,
  Search,
  ArrowLeft,
  UserCircle,
  AlertCircle,
  Sparkles,
  Settings2,
  QrCode,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import SessionManagementService from "@/src/sessionManagementService";
import {
  FilingStatus,
  ManufacturerDetails,
  TaxpayerData,
  Step1Props,
  Step2Props,
  Step3Props,
  Step4Props,
  PaymentStatus,
  ValidationStatus,
} from "../lib/types";
import {
  COUNTIES,
  GET_SUB_COUNTIES,
  GET_STATIONS,
  GET_LOCALITIES,
  GET_POSTAL_CODES,
} from "@/lib/kenya-data";

const sessionService = new SessionManagementService();

export default function Step1PIN({
  pin,
  password,
  error,
  passwordError,
  pinValidationStatus,
  passwordValidationStatus,
  onPINChange,
  onPasswordChange,
  onPasswordReset,
  onRecoverPin,
  onPasswordValidate,
  onNext,
  onManufacturerDetailsFound,
}: Step1Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [idNumber, setIdNumber] = useState("");
  const searchParams = useSearchParams();

  // Effect to handle ID from query params
  useEffect(() => {
    const idFromQuery = searchParams.get("id");
    if (idFromQuery && !idNumber) {
      console.log("[STEP1] Found ID in query params:", idFromQuery);
      setIdNumber(idFromQuery.toUpperCase());
    }
  }, [searchParams]);

  // Trigger search when idNumber is set from query params
  useEffect(() => {
    if (idNumber && idSearchStatus === "idle") {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        handleIdSearch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [idNumber]);

  // Helper to format district name as per user requirements
  const formatDistrictName = (name: string) => {
    if (!name) return "";
    return (
      name
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") + " District"
    );
  };

  const [firstName, setFirstName] = useState("");
  const [idSearchStatus, setIdSearchStatus] = useState<
    "idle" | "searching" | "found" | "not-found" | "preview"
  >("idle");
  const [taxpayerData, setTaxpayerData] = useState<TaxpayerData | null>(null);
  const [idSearchError, setIdSearchError] = useState<string | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [countySearch, setCountySearch] = useState("");
  const [addressForm, setAddressForm] = useState({
    building: "",
    street: "",
    city: "",
    county: "",
    district: "",
    taxArea: "",
    station: "",
    poBox: "",
    postalCode: "",
    email: "",
  });

  const handleDownloadWithAddress = async () => {
    setShowAddressDialog(false);
    const loadingToast = toast.loading("Generating your certificate...");
    try {
      const res = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: taxpayerData.pin,
          name: taxpayerData.taxpayerName,
          idNumber: idNumber, // Using the state variable directly
          email: addressForm.email || taxpayerData.mainEmailId,
          mobileNumber: taxpayerData.mobileNumber,
          ...addressForm,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate certificate");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KRA_Certificate_${taxpayerData.pin}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Certificate downloaded successfully!", {
        id: loadingToast,
      });
    } catch (err) {
      console.error("[DOWNLOAD ERROR]", err);
      toast.error("Failed to download certificate. Please try again.", {
        id: loadingToast,
      });
    }
  };

  const handleIdentityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits for ID (up to 12) and Alphanumeric for PIN (11)
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    setIdNumber(val);
  };

  const handleIdSearch = async () => {
    if (!idNumber) return;

    // Detect if input is a KRA PIN (11 chars, starts with A/P) or National ID (7-12 digits)
    const isPin = /^[AP][0-9]{9}[A-Z]$/i.test(idNumber);
    const isId = /^[0-9]{7,12}$/.test(idNumber);

    if (!isId && !isPin) {
      setIdSearchError("Please enter a valid 7-12 digit ID or 11-character KRA PIN (e.g. A012345678B).");
      return;
    }

    setIdSearchStatus("searching");
    setIdSearchError(null);
    setTaxpayerData(null); // Clear previous results

    try {
      console.log("[ID SEARCH] Starting search for ID:", idNumber);

      // Record search attempt in database
      const currentSessionId = sessionService.getData("currentSessionId");
      if (currentSessionId) {
        try {
          await supabase.from("session_activities").insert([
            {
              session_id: currentSessionId,
              activity_type: "user_action",
              description: "ID number search attempted",
              metadata: {
                id_number: idNumber,
                timestamp: new Date().toISOString(),
              },
            },
          ]);

          console.log("[DB] Recorded ID search attempt in database");
        } catch (dbError) {
          console.error("[DB ERROR] Failed to record search attempt:", dbError);
        }
      }

      // Use appropriate API endpoint based on input type
      const endpoint = isPin ? "/api/kra/validate-pin" : "/api/kra/fetch-by-id";
      const body = isPin ? { pin: idNumber } : { idNumber };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Failed to fetch details from KRA",
        );
      }

      const data = await response.json();
      console.log("[ID SEARCH] API response:", data);

      if (data.success && data.pin) {
        const md = data.manufacturerDetails;
        const fullName =
          md?.basic?.fullName ||
          md?.basic?.manufacturerName ||
          data.validation ||
          "KRA Taxpayer";

        // Format data for Step1PIN component
        const enrichedData = {
          pin: data.pin,
          taxpayerName: fullName,
          mainEmailId: md?.contact?.mainEmail || "",
          mobileNumber: md?.contact?.mobileNumber || "",
          secondaryEmail: md?.contact?.secondaryEmail || "",
          descriptiveAddress: md?.address?.descriptive || "",
          postalAddress: {
            postalCode: md?.address?.postalCode || "",
            town: md?.address?.town || "",
            poBox: md?.address?.poBox || "",
          },
          addressDetails: {
            county: md?.address?.county || "",
            district: md?.address?.district || "",
            taxArea: md?.address?.taxArea || "",
            station: md?.address?.jurisdictionStationId || "",
            buildingNumber: md?.address?.buildingNumber || "",
            streetRoad: md?.address?.streetRoad || "",
          },
          businessInfo: {
            name: md?.business?.businessName || fullName,
            registrationNumber: md?.basic?.registrationNumber || "",
            registrationDate: md?.business?.registrationDate || "",
            commencementDate: md?.business?.commencementDate || "",
          },
        };

        setTaxpayerData(enrichedData);
        setIdSearchStatus("found");

        // Propagation of details to parent
        const manufacturerDetailsForParent = {
          pin: data.pin,
          name: fullName,
          contactDetails: {
            mobile: md?.contact?.mobileNumber || md?.contact?.mobile || "",
            email: md?.contact?.mainEmail || md?.contact?.email || "",
            secondaryEmail: md?.contact?.secondaryEmail || "",
          },
          businessDetails: {
            name: md?.business?.businessName || fullName,
            registrationNumber: md?.basic?.registrationNumber || "",
            registrationDate: md?.business?.registrationDate || "",
            commencedDate: md?.business?.commencementDate || md?.business?.commencedDate || "",
          },
          postalAddress: {
            postalCode: md?.address?.postalCode || "",
            town: md?.address?.town || "",
            poBox: md?.address?.poBox || "",
          },
          physicalAddress: {
            descriptive: md?.address?.descriptive || "",
            county: md?.address?.county || "",
            district: md?.address?.district || "",
            taxArea: md?.address?.taxArea || "",
            station: md?.address?.jurisdictionStationId || "",
            building: md?.address?.buildingNumber || "",
            street: md?.address?.streetRoad || "",
          },
        };

        if (onManufacturerDetailsFound) {
          onManufacturerDetailsFound(manufacturerDetailsForParent);
        }
        
        // Auto-update the PIN field in parent
        onPINChange({ target: { value: data.pin } } as any);

        // Record successful search in database
        const currentSessionId = sessionService.getData("currentSessionId");
        if (currentSessionId) {
          try {
            await supabase.from("session_activities").insert([
              {
                session_id: currentSessionId,
                activity_type: "user_action",
                description: "ID search successful",
                metadata: {
                  id_number: idNumber,
                  found_pin: data.pin,
                  taxpayer_name: fullName,
                },
              },
            ]);
            console.log("[DB] Recorded successful ID search in database");
          } catch (dbError) {
            console.error("[DB ERROR] Failed to record search success:", dbError);
          }
        }

        // AUTO-TRANSITION: Wait for 2s then proceed to Step 2
        setTimeout(() => {
          onNext();
        }, 2000);
      } else {
        console.log("No matching records found or invalid response format");
        setIdSearchStatus("not-found");
        setIdSearchError(
          "No matching records found. Please verify your details.",
        );

        // Record failed search in database
        const currentSessionId = sessionService.getData("currentSessionId");
        if (currentSessionId) {
          try {
            await supabase.from("session_activities").insert([
              {
                session_id: currentSessionId,
                activity_type: "user_action",
                description: "ID search failed",
                metadata: {
                  id_number: idNumber,
                  reason: "No matching records",
                },
              },
            ]);

            console.log("[DB] Recorded failed ID search in database");
          } catch (dbError) {
            console.error(
              "[DB ERROR] Failed to record failed search:",
              dbError,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error during ID search:", error);
      setIdSearchStatus("not-found");
      setIdSearchError(
        error.message || "An error occurred while searching. Please try again.",
      );

      // Record error in database
      const currentSessionId = sessionService.getData("currentSessionId");
      if (currentSessionId) {
        try {
          await supabase.from("session_activities").insert([
            {
              session_id: currentSessionId,
              activity_type: "user_action",
              description: "ID search error",
              metadata: {
                id_number: idNumber,
                error: error.message,
              },
            },
          ]);

          console.log("[DB] Recorded ID search error in database");
        } catch (dbError) {
          console.error("[DB ERROR] Failed to record search error:", dbError);
        }
      }
    }
  };

  const handleProceedWithPin = async () => {
    if (taxpayerData) {
      console.log(
        "[PROCEED] Proceeding with PIN from taxpayer data:",
        taxpayerData.pin,
      );

      // Update the password if it's not already set
      if (!password) {
        onPasswordChange({
          target: { value: taxpayerData.password || "1234" },
        } as React.ChangeEvent<HTMLInputElement>);
      }

      // Convert taxpayer data to manufacturer details format
      const manufacturerDetails = {
        pin: taxpayerData.pin,
        name: taxpayerData.taxpayerName,
        contactDetails: {
          mobile: taxpayerData.mobileNumber,
          email: taxpayerData.mainEmailId,
          secondaryEmail: taxpayerData.secondaryEmail,
        },
        businessDetails: {
          name: taxpayerData.businessInfo?.name || taxpayerData.taxpayerName,
          registrationNumber:
            taxpayerData.businessInfo?.registrationNumber || "",
          registrationDate: taxpayerData.businessInfo?.registrationDate || "",
          commencedDate: taxpayerData.businessInfo?.commencementDate || "",
        },
        postalAddress: taxpayerData.postalAddress || {
          postalCode: "",
          town: "",
          poBox: "",
        },
        physicalAddress: {
          descriptive: taxpayerData.descriptiveAddress || "",
        },
      };

      console.log(
        "[PROCEED] Constructed manufacturer details:",
        manufacturerDetails,
      );

      // Record authenticated user in database
      const currentSessionId = sessionService.getData("currentSessionId");
      if (currentSessionId) {
        try {
          console.log("[DB] Updating session with user data");

          // Generate UUID for user
          const userId = crypto.randomUUID();

          // First check if user already exists
          const { data: existingUser, error: userCheckError } = await supabase
            .from("users")
            .select("id")
            .eq("email", taxpayerData.mainEmailId)
            .single();

          // If user exists, update instead of insert
          if (existingUser) {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .update({
                pin: taxpayerData.pin,
                name: taxpayerData.taxpayerName,
                phone: taxpayerData.mobileNumber,
                id_number: idNumber,
                updated_at: new Date().toISOString(),
              })
              .eq("email", taxpayerData.mainEmailId)
              .select()
              .single();

            if (userError) {
              console.error(
                "[DB ERROR] Failed to update user data:",
                userError,
              );
            } else {
              console.log("[DB] User data updated:", userData);
            }
          } else {
            // Create new user with a generated ID
            const userId = crypto.randomUUID();
            const { data: userData, error: userError } = await supabase
              .from("users")
              .insert({
                id: userId,
                pin: taxpayerData.pin,
                name: taxpayerData.taxpayerName,
                email: taxpayerData.mainEmailId,
                phone: taxpayerData.mobileNumber,
                id_number: idNumber,
              })
              .select()
              .single();

            if (userError) {
              console.error(
                "[DB ERROR] Failed to create user data:",
                userError,
              );
            } else {
              console.log("[DB] User data created:", userData);
            }
          }

          // Then update session with user data
          const { data: sessionData, error: sessionError } = await supabase
            .from("sessions")
            .update({
              pin: taxpayerData.pin,
              email: taxpayerData.mainEmailId,
              name: taxpayerData.taxpayerName,
              current_step: 1,
              form_data: {
                pin: taxpayerData.pin,
                taxpayer_name: taxpayerData.taxpayerName,
                email: taxpayerData.mainEmailId,
                id_number: idNumber,
              },
            })
            .eq("id", currentSessionId);

          if (sessionError) {
            console.error(
              "[DB ERROR] Failed to update session data:",
              sessionError,
            );
          } else {
            console.log("[DB] Session data updated:", sessionData);
          }

          // Record step completion
          const { data: stepData, error: stepError } = await supabase
            .from("session_steps")
            .insert([
              {
                session_id: currentSessionId,
                step_name: "pin_verification",
                step_data: {
                  pin: taxpayerData.pin,
                  taxpayer_name: taxpayerData.taxpayerName,
                  email: taxpayerData.mainEmailId,
                  id_number: idNumber,
                  first_name: firstName,
                },
                is_completed: true,
              },
            ]);

          if (stepError) {
            console.error(
              "[DB ERROR] Failed to record step completion:",
              stepError,
            );
          } else {
            console.log("[DB] Step completion recorded:", stepData);
          }

          // Record activity
          const { data: activityData, error: activityError } = await supabase
            .from("session_activities")
            .insert([
              {
                session_id: currentSessionId,
                activity_type: "form_submit",
                description: "Proceeded with PIN from ID search",
                metadata: {
                  pin: taxpayerData.pin,
                  taxpayer_name: taxpayerData.taxpayerName,
                  id_number: idNumber,
                  first_name: firstName,
                },
              },
            ]);

          if (activityError) {
            console.error(
              "[DB ERROR] Failed to record activity:",
              activityError,
            );
          } else {
            console.log("[DB] Activity recorded:", activityData);
          }
        } catch (dbError) {
          console.error("[DB ERROR] Error updating database:", dbError);
        }
      }

      // Pass manufacturer details to parent
      onManufacturerDetailsFound(manufacturerDetails);
    }
  };

  const handlePINChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const enteredPin = e.target.value;

    // Pass the event to the parent component's handler
    onPINChange(e);

    // If PIN came from ID search (taxpayerData exists), skip validation - it's already valid
    if (taxpayerData && taxpayerData.pin === enteredPin) {
      console.log(
        "[PIN] PIN from ID search - already validated, skipping check",
      );
      return;
    }

    // For manually entered PINs, validate by fetching manufacturer details
    if (enteredPin.length >= 10) {
      try {
        console.log("[PIN] Validating manually entered PIN:", enteredPin);

        const response = await fetch("/api/kra/validate-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: enteredPin }),
        });

        const data = await response.json();

        if (data.success && data.manufacturerDetails) {
          console.log("[PIN] Valid PIN - manufacturer details found");
          // Store the fetched data
          const fullName =
            data.manufacturerDetails.basic?.fullName ||
            data.manufacturerDetails.basic?.manufacturerName ||
            "Unknown";

          setTaxpayerData({
            pin: enteredPin,
            taxpayerName: fullName,
            mainEmailId: data.manufacturerDetails.contact?.mainEmail || "",
            mobileNumber: data.manufacturerDetails.contact?.mobileNumber || "",
            secondaryEmail:
              data.manufacturerDetails.contact?.secondaryEmail || "",
            descriptiveAddress:
              data.manufacturerDetails.address?.descriptive || "",
            postalAddress: {
              postalCode: data.manufacturerDetails.address?.postalCode || "",
              town: data.manufacturerDetails.address?.town || "",
              poBox: data.manufacturerDetails.address?.poBox || "",
            },
            businessInfo: {
              name: data.manufacturerDetails.business?.businessName || fullName,
              registrationNumber:
                data.manufacturerDetails.basic?.registrationNumber || "",
              registrationDate:
                data.manufacturerDetails.business?.registrationDate || "",
              commencementDate:
                data.manufacturerDetails.business?.commencementDate || "",
            },
            addressDetails: {
              county: data.manufacturerDetails.address?.county || "",
              district: data.manufacturerDetails.address?.district || "",
              taxArea: data.manufacturerDetails.address?.taxArea || "",
              station: data.manufacturerDetails.address?.jurisdictionStationId || "",
              buildingNumber: data.manufacturerDetails.address?.buildingNumber || "",
              streetRoad: data.manufacturerDetails.address?.streetRoad || "",
            },
          });
        } else {
          console.log("[PIN] Invalid PIN - no manufacturer details found");
          setTaxpayerData(null);
        }
      } catch (error) {
        console.error("[PIN] Error validating PIN:", error);
        setTaxpayerData(null);
      }
    }
  };

  // Effect to automatically populate address form from taxpayer data
  useEffect(() => {
    if (taxpayerData) {
      const parts = taxpayerData.descriptiveAddress ? taxpayerData.descriptiveAddress.split(',').map(s => s.trim()) : [];
      
      // Fallback to parts if specific address fields are empty
      const buildingFallback = parts.length > 0 ? parts[0] : addressForm.building;
      const streetFallback = parts.length > 1 ? parts[1] : addressForm.street;
      
      const building = taxpayerData.addressDetails?.buildingNumber || buildingFallback;
      const street = taxpayerData.addressDetails?.streetRoad || streetFallback;
      
      setAddressForm(prev => ({
        ...prev,
        poBox: taxpayerData.postalAddress?.poBox || prev.poBox,
        postalCode: taxpayerData.postalAddress?.postalCode || prev.postalCode,
        city: taxpayerData.postalAddress?.town || prev.city,
        building: building || prev.building,
        street: street || prev.street,
        county: taxpayerData.addressDetails?.county || prev.county,
        district: taxpayerData.addressDetails?.district || prev.district,
        taxArea: taxpayerData.addressDetails?.taxArea || prev.taxArea,
        station: taxpayerData.addressDetails?.station || prev.station,
        email: taxpayerData.mainEmailId || prev.email,
      }));
    }
  }, [taxpayerData]);

  return (
    <>

      {/* Premium Multi-Step Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-4xl w-[95%] p-0 rounded-[3rem] overflow-hidden border-border shadow-4xl glass backdrop-blur-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-cyan/5 pointer-events-none" />

          <div className="relative p-12 space-y-10">
            <DialogHeader className="space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-background/50 flex items-center justify-center border border-border mx-auto shadow-2xl backdrop-blur-xl group/dl animate-bounce-subtle">
                <FileDown className="w-10 h-10 text-brand-cyan" />
              </div>
              <div className="text-center space-y-3">
                <DialogTitle className="text-4xl font-black text-foreground tracking-tight">
                  Generate Certificate
                </DialogTitle>
                <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                  <Clock className="w-4 h-4" />
                  {new Date()
                    .toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="grid gap-10 max-h-[60vh] overflow-y-auto px-4 custom-scrollbar-premium">
              {/* Primary Address Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                      Location Intelligence
                    </span>
                    <span className="text-[8px] font-bold text-brand-cyan/60 uppercase tracking-[0.2em] animate-pulse">
                      {new Date().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* County Searchable Select */}
                  <div className="space-y-3 group/field">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2 group-focus-within/field:text-brand-cyan transition-colors">
                      Tax District (County)
                    </Label>
                    <Select
                      value={addressForm.county}
                      onValueChange={(value) => {
                        const subCounties = GET_SUB_COUNTIES(value);
                        const localities = GET_LOCALITIES(
                          value,
                          subCounties[0],
                        );
                        const stations = GET_STATIONS(value);
                        const postalCodes = GET_POSTAL_CODES(value);
                        const isWestPokot = value === "WEST POKOT";

                        setAddressForm({
                          ...addressForm,
                          county: value,
                          district: subCounties[0],
                          station: stations[0],
                          taxArea: isWestPokot ? "KAPENGURIA" : localities[0],
                          postalCode: postalCodes[0].code,
                          city: postalCodes[0].town,
                          building: isWestPokot
                            ? "HUDUMA CYBER"
                            : addressForm.building,
                          street: isWestPokot
                            ? "LOTODO ROAD"
                            : addressForm.street,
                          poBox: isWestPokot ? "1" : addressForm.poBox,
                        });
                      }}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black text-lg focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all px-6">
                        <SelectValue placeholder="SELECT COUNTY" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl max-h-80">
                        <div className="p-3 sticky top-0 bg-background/80 backdrop-blur-xl z-20 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Filter counties..."
                              value={countySearch}
                              onChange={(e) => setCountySearch(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-10 bg-background/50 border-border text-foreground text-sm pl-10 rounded-xl"
                            />
                          </div>
                        </div>
                        {COUNTIES.filter((c) =>
                          c.includes(countySearch.toUpperCase()),
                        ).map((c) => (
                          <SelectItem
                            key={c}
                            value={c}
                            className="text-foreground hover:bg-brand-cyan/20 cursor-pointer py-3 font-bold uppercase"
                          >
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 group/field">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2 group-focus-within/field:text-brand-cyan transition-colors">
                      Sub-County / District
                    </Label>
                    <Select
                      value={addressForm.district}
                      onValueChange={(value) => {
                        const localities = GET_LOCALITIES(
                          addressForm.county,
                          value,
                        );
                        setAddressForm({
                          ...addressForm,
                          district: value,
                          taxArea: localities[0] || "",
                        });
                      }}
                      disabled={!addressForm.county}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black px-6">
                        <SelectValue placeholder="DISTRICT">
                          {addressForm.district
                            ? addressForm.district
                                .toLowerCase()
                                .split(" ")
                                .map(
                                  (w) => w.charAt(0).toUpperCase() + w.slice(1),
                                )
                                .join(" ") + " District"
                            : "SELECT DISTRICT"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        {GET_SUB_COUNTIES(addressForm.county).map((sc) => (
                          <SelectItem
                            key={sc}
                            value={sc}
                            className="text-foreground py-3 font-bold capitalize"
                          >
                            {sc
                              .toLowerCase()
                              .split(" ")
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1),
                              )
                              .join(" ")}{" "}
                            District
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Tax Area
                    </Label>
                    <Select
                      value={addressForm.taxArea}
                      onValueChange={(value) =>
                        setAddressForm({ ...addressForm, taxArea: value })
                      }
                      disabled={!addressForm.county}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black px-6">
                        <SelectValue placeholder="AREA" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        {GET_LOCALITIES(
                          addressForm.county,
                          addressForm.district,
                        ).map((l) => (
                          <SelectItem
                            key={l}
                            value={l}
                            className="text-foreground py-3 font-bold"
                          >
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Reporting Station
                    </Label>
                    <Select
                      value={addressForm.station}
                      onValueChange={(value) =>
                        setAddressForm({ ...addressForm, station: value })
                      }
                      disabled={
                        !addressForm.county ||
                        addressForm.county === "WEST POKOT" ||
                        addressForm.county === "TRANS NZOIA"
                      }
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black px-6">
                        <SelectValue placeholder="STATION" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        {GET_STATIONS(addressForm.county).map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-foreground py-3 font-bold"
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Postal Code
                    </Label>
                    <Select
                      value={addressForm.postalCode}
                      onValueChange={(value) => {
                        const found = GET_POSTAL_CODES(addressForm.county).find(
                          (p) => p.code === value,
                        );
                        setAddressForm({
                          ...addressForm,
                          postalCode: value,
                          city: found ? found.town : addressForm.city,
                        });
                      }}
                      disabled={!addressForm.county}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black px-6">
                        <SelectValue placeholder="CODE" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        {GET_POSTAL_CODES(addressForm.county).map((p) => (
                          <SelectItem
                            key={p.code}
                            value={p.code}
                            className="text-foreground py-3 font-bold"
                          >
                            {p.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Detailed Building Info */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                    Structure & Access
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Building / Complex Name
                    </Label>
                    <Input
                      value={addressForm.building}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          building: e.target.value.toUpperCase(),
                        })
                      }
                      className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black placeholder:text-muted-foreground focus:border-brand-cyan transition-all px-6"
                      placeholder="E.G. TIMES TOWER"
                      readOnly={addressForm.county === "WEST POKOT"}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Street / Avenue
                    </Label>
                    <Input
                      value={addressForm.street}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          street: e.target.value.toUpperCase(),
                        })
                      }
                      className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black placeholder:text-muted-foreground focus:border-brand-cyan transition-all px-6"
                      placeholder="E.G. HAILE SELASSIE"
                      readOnly={addressForm.county === "WEST POKOT"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      City / Town
                    </Label>
                    <Input
                      value={addressForm.city}
                      className="h-16 rounded-2xl bg-background/50 border-border text-muted-foreground font-black px-6 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      P. O. Box
                    </Label>
                    <Input
                      value={addressForm.poBox}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          poBox: e.target.value,
                        })
                      }
                      className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black placeholder:text-muted-foreground focus:border-brand-cyan transition-all px-6"
                      placeholder="PO BOX NO."
                      readOnly={addressForm.county === "WEST POKOT"}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                    Contact Info
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                    Official Email Address
                  </Label>
                  <Input
                    value={addressForm.email}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        email: e.target.value,
                      })
                    }
                    type="email"
                    className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black placeholder:text-muted-foreground focus:border-brand-cyan transition-all px-6"
                    placeholder="ENTER OFFICIAL EMAIL"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-border items-center justify-between">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-background/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  Secured Generation Active
                </span>
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddressDialog(false)}
                  className="h-16 px-10 rounded-2xl text-muted-foreground font-black uppercase text-xs tracking-widest hover:bg-background/50 hover:text-foreground transition-all flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDownloadWithAddress}
                  className="h-16 px-12 bg-gradient-to-r from-brand-cyan via-brand-cyan to-blue-700 hover:scale-[1.05] active:scale-[0.95] text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-3xl shadow-brand-cyan/40 transition-all flex-1 sm:flex-none group border-0"
                >
                  Finalize Certificate
                  <FileDown className="ml-3 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-4xl mx-auto pb-10"
      >
        {/* Main Card */}
        <div className="glass p-10 rounded-[2.5rem] border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Shield className="w-48 h-48 text-brand-cyan" />
          </div>

          <div className="relative space-y-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 mx-auto shadow-inner relative group/icon">
                <div className="absolute inset-0 bg-brand-cyan/20 rounded-3xl blur-xl opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                <Shield className="w-10 h-10 text-brand-cyan relative z-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-foreground tracking-tight">
                  Security Gateway
                </h2>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                  KRA Identity Verification
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/10 backdrop-blur-md border border-destructive/20 text-destructive px-6 py-4 rounded-[1.5rem] flex items-start gap-4 shadow-xl"
              >
                <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Security Alert
                  </p>
                  <p className="text-sm font-bold leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Unified Search Section */}
            <AnimatePresence mode="wait">
              <motion.div
                key="search-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between px-1">
                      <Label
                        htmlFor="id-number"
                        className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]"
                      >
                        Identification details
                      </Label>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-black tracking-widest uppercase py-1 border-brand-cyan/20 text-brand-cyan"
                      >
                        ID or KRA PIN
                      </Badge>
                    </div>
                    <div className="relative group/input max-w-2xl mx-auto w-full">
                      <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none transition-colors duration-300 group-focus-within/input:text-[#2E8B75] text-muted-foreground/30">
                        <Fingerprint className="w-8 h-8" />
                      </div>
                      <Input
                        id="id-number"
                        value={idNumber}
                        onChange={handleIdentityChange}
                        placeholder="Enter ID or KRA PIN..."
                        required
                        className="h-24 rounded-full border-border bg-background/40 backdrop-blur-md text-xl font-black tracking-widest focus:ring-[#2E8B75]/20 focus:border-[#2E8B75] transition-all pl-20 pr-48 shadow-2xl hover:shadow-[#2E8B75]/5"
                      />
                      <div className="absolute inset-y-2 right-2">
                        <Button
                          type="button"
                          onClick={handleIdSearch}
                          disabled={idNumber.length < 8 || idSearchStatus === "searching"}
                          className="h-20 px-10 text-base font-black bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white rounded-full shadow-2xl shadow-[#B91C1C]/20 transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden border-0"
                        >
                          <div className="relative flex items-center justify-center gap-3">
                            {idSearchStatus === "searching" ? (
                              <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="tracking-tighter">VERIFYING</span>
                              </>
                            ) : (
                              <>
                                Verify Now
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </div>
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground font-black px-2 mt-4 italic uppercase tracking-wider opacity-60">
                      * Instant profile retrieval using 8-digit ID or 11-character KRA PIN.
                    </p>
                    {idSearchError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-3xl flex items-center gap-3 mt-6 max-w-2xl mx-auto"
                      >
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span className="text-xs font-black uppercase tracking-tight">
                          {idSearchError}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Identified Profile Section */}
                {idSearchStatus === "found" && taxpayerData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mt-12 p-12 rounded-[3.5rem] border border-[#2E8B75]/30 bg-gradient-to-br from-card via-card to-[#2E8B75]/[0.05] shadow-4xl relative overflow-hidden group/profile"
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover/profile:opacity-[0.1] transition-opacity duration-1000">
                      <ShieldCheck className="w-48 h-48 text-[#2E8B75]" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-3xl bg-[#2E8B75]/10 flex items-center justify-center border border-[#2E8B75]/20 shadow-2xl relative">
                          <div className="absolute inset-0 bg-[#2E8B75]/20 blur-xl rounded-full animate-pulse" />
                          <CheckCircle className="h-10 w-10 text-[#2E8B75] relative z-10" />
                        </div>
                        <div>
                          <h4 className="text-4xl font-black text-foreground tracking-tight uppercase">
                            Records Verified
                          </h4>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="px-3 py-1 border-[#2E8B75]/20 text-[#2E8B75] text-[9px] font-black tracking-widest uppercase">
                              Official KRA Ledger
                            </Badge>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              Session ID: {sessionService.getData('currentSessionId')?.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <p className="text-[10px] font-black text-[#2E8B75] uppercase tracking-[0.3em] flex items-center gap-3">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Auto-generating certificate...
                        </p>
                        <div className="w-64 h-2 bg-muted/20 rounded-full overflow-hidden border border-border/50 p-0.5">
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 5, ease: "linear" }}
                            className="h-full bg-gradient-to-r from-[#2E8B75] to-[#B91C1C] rounded-full shadow-[0_0_15px_rgba(46,139,117,0.5)]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 relative z-10">
                      <div className="p-10 rounded-[2.5rem] bg-background/40 backdrop-blur-xl border border-border/50 shadow-2xl group/item hover:border-[#2E8B75]/30 transition-all duration-700 hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-8">
                            <div className="p-5 rounded-2xl bg-secondary text-muted-foreground group-hover/item:text-[#2E8B75] transition-colors duration-500 shadow-inner">
                              <User className="w-10 h-10" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">
                                Legal Taxpayer Name
                              </p>
                              <p className="text-3xl font-black text-foreground uppercase truncate tracking-tight">
                                {taxpayerData.taxpayerName}
                              </p>
                            </div>
                          </div>
                          <div className="hidden md:block">
                            <Badge className="bg-[#2E8B75]/10 text-[#2E8B75] border-none px-4 py-2 text-[10px] font-black tracking-widest uppercase">
                              Verified
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-10 rounded-[2.5rem] bg-background/40 backdrop-blur-xl border border-border/50 shadow-2xl group/item hover:border-[#2E8B75]/30 transition-all duration-700 hover:-translate-y-1">
                          <div className="flex items-center gap-8">
                            <div className="p-5 rounded-2xl bg-secondary text-muted-foreground group-hover/item:text-[#2E8B75] transition-colors duration-500 shadow-inner">
                              <Fingerprint className="w-10 h-10" />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">
                                Official KRA PIN
                              </p>
                              <p className="text-3xl font-mono font-black text-foreground tracking-[0.2em]">
                                {taxpayerData.pin}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-10 rounded-[2.5rem] bg-background/40 backdrop-blur-xl border border-border/50 shadow-2xl group/item hover:border-[#2E8B75]/30 transition-all duration-700 hover:-translate-y-1">
                          <div className="flex items-center gap-8">
                            <div className="p-5 rounded-2xl bg-secondary text-muted-foreground group-hover/item:text-[#2E8B75] transition-colors duration-500 shadow-inner">
                              <Mail className="w-10 h-10" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">
                                Primary Vault Email
                              </p>
                              <p className="text-2xl font-black text-foreground truncate tracking-tight">
                                {taxpayerData.mainEmailId || "NOT REGISTERED"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-4 h-4 rounded-full bg-[#2E8B75] animate-ping absolute inset-0" />
                          <div className="w-4 h-4 rounded-full bg-[#2E8B75] relative shadow-[0_0_15px_#2E8B75]" />
                        </div>
                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                          Ready for secure document retrieval...
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                          onClick={() => handleDownloadWithAddress()}
                          className="h-20 flex-1 md:flex-none rounded-[1.5rem] px-10 bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white font-black uppercase tracking-widest shadow-2xl shadow-[#B91C1C]/20 transition-all hover:scale-[1.05] flex items-center gap-4 group/dl"
                        >
                          <FileDown className="w-6 h-6 group-hover/dl:translate-y-1 transition-transform" />
                          Download Certificate
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => onNext()}
                          className="h-20 flex-1 md:flex-none rounded-[1.5rem] px-10 text-[11px] font-black uppercase tracking-[0.3em] text-[#2E8B75] hover:bg-[#2E8B75]/10 hover:shadow-brand-cyan/20 border border-[#2E8B75]/20 transition-all flex items-center gap-4 group/skip"
                        >
                          Proceed to Filing
                          <ArrowRight className="w-5 h-5 group-hover/skip:translate-x-2 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Premium Multi-Step Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-4xl w-[95%] p-0 rounded-[3rem] overflow-hidden border-border shadow-4xl glass backdrop-blur-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-cyan/5 pointer-events-none" />

          <div className="relative p-12 space-y-10">
            <DialogHeader className="space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-background/50 flex items-center justify-center border border-border mx-auto shadow-2xl backdrop-blur-xl group/dl animate-bounce-subtle">
                <FileDown className="w-10 h-10 text-brand-cyan" />
              </div>
              <div className="text-center space-y-3">
                <DialogTitle className="text-4xl font-black text-foreground tracking-tight">
                  Generate Certificate
                </DialogTitle>
                <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                  <Clock className="w-4 h-4" />
                  {new Date()
                    .toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="grid gap-10 max-h-[60vh] overflow-y-auto px-4 custom-scrollbar-premium">
              {/* Primary Address Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                      Location Intelligence
                    </span>
                    <span className="text-[8px] font-bold text-brand-cyan/60 uppercase tracking-[0.2em] animate-pulse">
                      {new Date().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* County Searchable Select */}
                  <div className="space-y-3 group/field">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2 group-focus-within/field:text-brand-cyan transition-colors">
                      Tax District (County)
                    </Label>
                    <Select
                      value={addressForm.county}
                      onValueChange={(value) => {
                        const subCounties = GET_SUB_COUNTIES(value);
                        const localities = GET_LOCALITIES(
                          value,
                          subCounties[0],
                        );
                        const stations = GET_STATIONS(value);
                        const postalCodes = GET_POSTAL_CODES(value);
                        const isWestPokot = value === "WEST POKOT";

                        setAddressForm({
                          ...addressForm,
                          county: value,
                          district: subCounties[0],
                          station: stations[0],
                          taxArea: isWestPokot ? "KAPENGURIA" : localities[0],
                          postalCode: postalCodes[0].code,
                          city: postalCodes[0].town,
                          building: isWestPokot
                            ? "HUDUMA CYBER"
                            : addressForm.building,
                          street: isWestPokot
                            ? "LOTODO ROAD"
                            : addressForm.street,
                          poBox: isWestPokot ? "1" : addressForm.poBox,
                        });
                      }}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black text-lg focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all px-6">
                        <SelectValue placeholder="SELECT COUNTY" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl max-h-80">
                        <div className="p-3 sticky top-0 bg-background/80 backdrop-blur-xl z-20 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Filter counties..."
                              value={countySearch}
                              onChange={(e) => setCountySearch(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-10 bg-background/50 border-border text-foreground text-sm pl-10 rounded-xl"
                            />
                          </div>
                        </div>
                        {COUNTIES.filter((c) =>
                          c.includes(countySearch.toUpperCase()),
                        ).map((c) => (
                          <SelectItem
                            key={c}
                            value={c}
                            className="text-foreground hover:bg-brand-cyan/20 cursor-pointer py-3 font-bold uppercase"
                          >
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 group/field">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2 group-focus-within/field:text-brand-cyan transition-colors">
                      Sub-County / District
                    </Label>
                    <Select
                      value={addressForm.district}
                      onValueChange={(value) => {
                        const localities = GET_LOCALITIES(
                          addressForm.county,
                          value,
                        );
                        setAddressForm({
                          ...addressForm,
                          district: value,
                          taxArea: localities[0] || "",
                        });
                      }}
                      disabled={!addressForm.county}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black px-6">
                        <SelectValue placeholder="DISTRICT">
                          {addressForm.district
                            ? addressForm.district
                                .toLowerCase()
                                .split(" ")
                                .map(
                                  (w) => w.charAt(0).toUpperCase() + w.slice(1),
                                )
                                .join(" ") + " District"
                            : "SELECT DISTRICT"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        {GET_SUB_COUNTIES(addressForm.county).map((sc) => (
                          <SelectItem
                            key={sc}
                            value={sc}
                            className="text-foreground py-3 font-bold capitalize"
                          >
                            {sc
                              .toLowerCase()
                              .split(" ")
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1),
                              )
                              .join(" ")}{" "}
                            District
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Tax Area
                    </Label>
                    <Select
                      value={addressForm.taxArea}
                      onValueChange={(value) =>
                        setAddressForm({ ...addressForm, taxArea: value })
                      }
                      disabled={!addressForm.county}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black px-6">
                        <SelectValue placeholder="AREA" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        {GET_LOCALITIES(
                          addressForm.county,
                          addressForm.district,
                        ).map((l) => (
                          <SelectItem
                            key={l}
                            value={l}
                            className="text-foreground py-3 font-bold"
                          >
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Reporting Station
                    </Label>
                    <Select
                      value={addressForm.station}
                      onValueChange={(value) =>
                        setAddressForm({ ...addressForm, station: value })
                      }
                      disabled={
                        !addressForm.county ||
                        addressForm.county === "WEST POKOT" ||
                        addressForm.county === "TRANS NZOIA"
                      }
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black px-6">
                        <SelectValue placeholder="STATION" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        {GET_STATIONS(addressForm.county).map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-foreground py-3 font-bold"
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Postal Code
                    </Label>
                    <Select
                      value={addressForm.postalCode}
                      onValueChange={(value) => {
                        const found = GET_POSTAL_CODES(addressForm.county).find(
                          (p) => p.code === value,
                        );
                        setAddressForm({
                          ...addressForm,
                          postalCode: value,
                          city: found ? found.town : addressForm.city,
                        });
                      }}
                      disabled={!addressForm.county}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black px-6">
                        <SelectValue placeholder="CODE" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        {GET_POSTAL_CODES(addressForm.county).map((p) => (
                          <SelectItem
                            key={p.code}
                            value={p.code}
                            className="text-foreground py-3 font-bold"
                          >
                            {p.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Detailed Building Info */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                    Structure & Access
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Building / Complex Name
                    </Label>
                    <Input
                      value={addressForm.building}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          building: e.target.value.toUpperCase(),
                        })
                      }
                      className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black placeholder:text-muted-foreground focus:border-brand-cyan transition-all px-6"
                      placeholder="E.G. TIMES TOWER"
                      readOnly={addressForm.county === "WEST POKOT"}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      Street / Avenue
                    </Label>
                    <Input
                      value={addressForm.street}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          street: e.target.value.toUpperCase(),
                        })
                      }
                      className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black placeholder:text-muted-foreground focus:border-brand-cyan transition-all px-6"
                      placeholder="E.G. HAILE SELASSIE"
                      readOnly={addressForm.county === "WEST POKOT"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      City / Town
                    </Label>
                    <Input
                      value={addressForm.city}
                      className="h-16 rounded-2xl bg-background/50 border-border text-muted-foreground font-black px-6 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                      P. O. Box
                    </Label>
                    <Input
                      value={addressForm.poBox}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          poBox: e.target.value,
                        })
                      }
                      className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black placeholder:text-muted-foreground focus:border-brand-cyan transition-all px-6"
                      placeholder="PO BOX NO."
                      readOnly={addressForm.county === "WEST POKOT"}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                    Contact Info
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                    Official Email Address
                  </Label>
                  <Input
                    value={addressForm.email}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        email: e.target.value,
                      })
                    }
                    type="email"
                    className="h-16 rounded-2xl bg-background/50 border-border text-foreground font-black placeholder:text-muted-foreground focus:border-brand-cyan transition-all px-6"
                    placeholder="ENTER OFFICIAL EMAIL"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-border items-center justify-between">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-background/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  Secured Generation Active
                </span>
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddressDialog(false)}
                  className="h-16 px-10 rounded-2xl text-muted-foreground font-black uppercase text-xs tracking-widest hover:bg-background/50 hover:text-foreground transition-all flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDownloadWithAddress}
                  className="h-16 px-12 bg-gradient-to-r from-brand-cyan via-brand-cyan to-blue-700 hover:scale-[1.05] active:scale-[0.95] text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-3xl shadow-brand-cyan/40 transition-all flex-1 sm:flex-none group border-0"
                >
                  Finalize Certificate
                  <FileDown className="ml-3 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
