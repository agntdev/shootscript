import { Composer } from "grammy";
import type { Ctx } from "../bot.js";

const composer = new Composer<Ctx>();

composer.command("reset", async (ctx) => {
  ctx.session.step = "idle";
  ctx.session.submittedImage = undefined;
  await ctx.reply("Your pending photo has been cleared. Send a new photo when you’re ready.");
});

export default composer;
