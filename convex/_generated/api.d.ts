/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bookingJobs from "../bookingJobs.js";
import type * as bookings from "../bookings.js";
import type * as contractJobs from "../contractJobs.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as importExport from "../importExport.js";
import type * as inquiries from "../inquiries.js";
import type * as inspections from "../inspections.js";
import type * as integrations_heffl from "../integrations/heffl.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bookings from "../lib/bookings.js";
import type * as lib_contracts from "../lib/contracts.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_identifiers from "../lib/identifiers.js";
import type * as lib_inspections from "../lib/inspections.js";
import type * as lib_passwords from "../lib/passwords.js";
import type * as lib_publish from "../lib/publish.js";
import type * as lib_staffUsers from "../lib/staffUsers.js";
import type * as lib_uploads from "../lib/uploads.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_vehicleCopy from "../lib/vehicleCopy.js";
import type * as lib_vehicleStatus from "../lib/vehicleStatus.js";
import type * as lib_vehicles from "../lib/vehicles.js";
import type * as lib_waagentsWebhook from "../lib/waagentsWebhook.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as public_ from "../public.js";
import type * as seed from "../seed.js";
import type * as staff from "../staff.js";
import type * as vehiclePhotos from "../vehiclePhotos.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bookingJobs: typeof bookingJobs;
  bookings: typeof bookings;
  contractJobs: typeof contractJobs;
  crons: typeof crons;
  http: typeof http;
  importExport: typeof importExport;
  inquiries: typeof inquiries;
  inspections: typeof inspections;
  "integrations/heffl": typeof integrations_heffl;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  "lib/bookings": typeof lib_bookings;
  "lib/contracts": typeof lib_contracts;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/identifiers": typeof lib_identifiers;
  "lib/inspections": typeof lib_inspections;
  "lib/passwords": typeof lib_passwords;
  "lib/publish": typeof lib_publish;
  "lib/staffUsers": typeof lib_staffUsers;
  "lib/uploads": typeof lib_uploads;
  "lib/validators": typeof lib_validators;
  "lib/vehicleCopy": typeof lib_vehicleCopy;
  "lib/vehicleStatus": typeof lib_vehicleStatus;
  "lib/vehicles": typeof lib_vehicles;
  "lib/waagentsWebhook": typeof lib_waagentsWebhook;
  migrations: typeof migrations;
  notifications: typeof notifications;
  public: typeof public_;
  seed: typeof seed;
  staff: typeof staff;
  vehiclePhotos: typeof vehiclePhotos;
  vehicles: typeof vehicles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
