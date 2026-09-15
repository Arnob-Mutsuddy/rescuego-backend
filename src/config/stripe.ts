
import Stripe from "stripe";
import config from "./env.js";

const stripe = new Stripe(config.stripe_secret_key, {
  apiVersion: "2025-08-27.basil" as any,
});

export default stripe;