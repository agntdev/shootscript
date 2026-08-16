import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const EXAMPLES =
  "Example: a sunlit city portrait with the tag “editorial streetwear.”\n\n" +
  "You’ll get a restrained palette, wardrobe direction, hair and makeup notes, a lighting setup, pose cues, camera angles, a shot list, a 45-minute timeline, and caption hooks.";

const examplesKeyboard = inlineKeyboard([
  [inlineButton("Submit a photo", "menu:submit-photo")],
  [inlineButton("Back to menu", "menu:main")],
]);

registerMainMenuItem({ label: "View examples", data: "menu:examples", order: 30 });

composer.command("examples", async (ctx) => {
  await ctx.reply(EXAMPLES, { reply_markup: examplesKeyboard });
});

composer.callbackQuery("menu:examples", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(EXAMPLES, { reply_markup: examplesKeyboard });
});

export default composer;
