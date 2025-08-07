import { load } from "jsr:@std/dotenv";

export const env = await load({
  envPath: "../.env",
  export: true,
});
