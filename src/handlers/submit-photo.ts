import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const DAILY_LIMIT = 10;
const MIN_SIDE = 480;

let currentClock: () => Date = () => new Date();

/** Test seam for all day-boundary decisions in this feature. */
export function setPhotoStylerClock(clock: () => Date): void {
  currentClock = clock;
}

function now(): Date {
  return currentClock();
}

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function hasCyrillic(text: string): boolean {
  return /[\u0400-\u04ff]/.test(text);
}

function awaitingContextKeyboard() {
  return inlineKeyboard([
    [inlineButton("Skip context", "photo:skip-context")],
    [inlineButton("Start over", "menu:submit-photo")],
  ]);
}

function backKeyboard() {
  return inlineKeyboard([[inlineButton("Submit another photo", "menu:submit-photo")], [inlineButton("Back to menu", "menu:main")]]);
}

function englishPlan(context: string, lowQuality: boolean, horizontal: boolean): string {
  const subject = context || "a contemporary editorial portrait";
  const frame = horizontal ? "Use the wider frame for environment-led compositions." : "Keep the frame vertical for a strong portrait rhythm.";
  const quality = lowQuality ? "The source is small, so keep detail work simple and avoid texture-heavy close-ups." : "The source supports clean detail frames and controlled crop variations.";
  return "Styling plan\n\n" +
    `Concept: ${subject}. Build a clean, current story with one clear visual idea.\n` +
    "Mood: precise, tactile, understated.\n" +
    "Palette: charcoal, stone, soft white, and one muted accent from the setting.\n" +
    "Wardrobe and props: structured layers, matte fabrics, one practical prop with a simple silhouette.\n" +
    "Hair and makeup: natural skin, brushed texture, defined brows, and a restrained lip.\n" +
    "Poses: start neutral, use small shoulder turns, then add walking and hands-in-frame variations.\n" +
    "Lighting: use soft side light with negative fill; add a reflector only to recover the eyes.\n" +
    `Camera angles: eye level first, then a low three-quarter angle. ${frame}\n` +
    "Shot list: establishing frame, clean half-length, detail crop, movement frame, profile, and one graphic close-up.\n" +
    "Timeline: 5 min test frames; 15 min clean portraits; 15 min movement; 10 min detail crops; 5 min safety shots.\n" +
    "Caption hooks: “Quiet structure, strong light.” / “A study in texture and pace.”\n" +
    quality;
}

function russianPlan(context: string, lowQuality: boolean, horizontal: boolean): string {
  const subject = context || "современный редакционный портрет";
  const frame = horizontal ? "Используйте широкий кадр, чтобы показать среду." : "Держите вертикальный кадр для собранного портретного ритма.";
  const quality = lowQuality ? "Исходник небольшой: упростите детали и не делайте фактурные крупные планы." : "Качество позволяет снять чистые детали и несколько вариантов кадрирования.";
  return "План съёмки\n\n" +
    `Концепция: ${subject}. Постройте современную историю вокруг одной ясной идеи.\n` +
    "Настроение: точное, фактурное, сдержанное.\n" +
    "Палитра: графит, каменный, мягкий белый и один приглушённый акцент из локации.\n" +
    "Одежда и реквизит: структурные слои, матовые ткани, один практичный предмет с простым силуэтом.\n" +
    "Волосы и макияж: натуральная кожа, расчёсанная текстура, выразительные брови и спокойные губы.\n" +
    "Позы: начните нейтрально, добавьте небольшие развороты плеч, шаг и руки в кадре.\n" +
    "Свет: мягкий боковой свет и негативный заполняющий; отражатель — только для глаз.\n" +
    `Ракурсы: сначала уровень глаз, затем нижний ракурс в три четверти. ${frame}\n` +
    "Кадры: общий план, чистый поясной, деталь, движение, профиль и графичный крупный план.\n" +
    "Тайминг: 5 мин тесты; 15 мин портреты; 15 мин движение; 10 мин детали; 5 мин страховочные кадры.\n" +
    "Подписи: «Тихая структура, сильный свет.» / «Исследование фактуры и темпа.»\n" +
    quality;
}

function clearPending(ctx: Ctx): void {
  ctx.session.step = "idle";
  ctx.session.submittedImage = undefined;
}

function canAcceptPhoto(ctx: Ctx): boolean {
  const day = utcDay(now());
  const usage = ctx.session.usage;
  if (!usage || usage.day !== day) {
    ctx.session.usage = { day, requests: 1 };
    return true;
  }
  if (usage.requests >= DAILY_LIMIT) return false;
  usage.requests += 1;
  return true;
}

function completePlan(ctx: Ctx, context: string): Promise<unknown> {
  const image = ctx.session.submittedImage;
  if (!image) {
    clearPending(ctx);
    return ctx.reply("There’s no photo waiting for analysis. Tap Submit a photo to start.", { reply_markup: backKeyboard() });
  }
  const plan = hasCyrillic(context)
    ? russianPlan(context.trim(), image.lowQuality, image.width > image.height)
    : englishPlan(context.trim(), image.lowQuality, image.width > image.height);
  clearPending(ctx);
  return ctx.reply(plan, { reply_markup: backKeyboard() });
}

registerMainMenuItem({ label: "Submit a photo", data: "menu:submit-photo", order: 10 });

composer.callbackQuery("menu:submit-photo", async (ctx) => {
  await ctx.answerCallbackQuery();
  clearPending(ctx);
  await ctx.reply("Send one clear model or location photo. I’ll use it only for this styling plan.");
});

composer.callbackQuery("photo:skip-context", async (ctx) => {
  await ctx.answerCallbackQuery();
  await completePlan(ctx, "");
});

composer.on("message:photo", async (ctx) => {
  if (!canAcceptPhoto(ctx)) {
    await ctx.reply("You’ve reached today’s 10-photo limit. Send another photo tomorrow.");
    return;
  }
  const image = ctx.message.photo.at(-1);
  if (!image?.file_id || image.width <= 0 || image.height <= 0) {
    await ctx.reply("I couldn’t read that image. Send a standard JPG or PNG photo and try again.");
    return;
  }
  const lowQuality = Math.min(image.width, image.height) < MIN_SIDE;
  ctx.session.submittedImage = {
    imageData: image.file_id,
    width: image.width,
    height: image.height,
    timestamp: now().getTime(),
    lowQuality,
  };
  ctx.session.step = "awaiting_context";
  const qualityNote = lowQuality ? " The image is small, so the plan will favour broader frames." : "";
  await ctx.reply(`Photo received.${qualityNote}\n\nAdd an optional context tag, or tap Skip context.`, {
    reply_markup: awaitingContextKeyboard(),
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_context") return next();
  const context = ctx.message.text.trim();
  if (context.length > 120) {
    await ctx.reply("Keep the context tag under 120 characters, then send it again.");
    return;
  }
  await completePlan(ctx, context);
});

export default composer;
