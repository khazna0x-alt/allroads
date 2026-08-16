import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { normalizeIdentifier } from "./lib/identifiers";

const StaffPassword = Password<DataModel>({
  profile(params) {
    if (params.flow === "signUp") {
      throw new ConvexError("Public registration is disabled");
    }
    const parsed = normalizeIdentifier(String(params.email ?? ""));
    return {
      email: parsed.accountId,
      phone: parsed.phone,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [StaffPassword],
});
