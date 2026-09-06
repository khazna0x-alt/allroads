"use node";

import { v } from "convex/values";
import QRCode from "qrcode";
import { internalAction } from "./_generated/server";

export const renderPng = internalAction({
  args: { text: v.string() },
  returns: v.string(),
  handler: async (_ctx, args) => {
    const png = await QRCode.toBuffer(args.text, {
      type: "png",
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0A0A0A",
        light: "#FFFFFF",
      },
    });
    return png.toString("base64");
  },
});
