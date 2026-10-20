/* جمله‌های محلی برای وقتی اینترنت نیست و جمله‌ی ذخیره‌شده‌ای هم وجود ندارد (اولین اجرا) */
export const FALLBACK_SENTENCES = [
  ["Practice makes progress, not perfection.", "تمرین پیشرفت می‌آورد، نه کمال."],
  ["Small steps every day lead to big results.", "قدم‌های کوچک هر روز به نتیجه‌های بزرگ می‌رسد."],
  ["I would like a glass of water, please.", "لطفاً یک لیوان آب می‌خواهم."],
  ["Could you tell me where the station is?", "می‌توانید بگویید ایستگاه کجاست؟"],
  ["It is better to be early than late.", "زود رسیدن بهتر از دیر رسیدن است."],
  ["Saving money is a habit, not a talent.", "پس‌انداز یک عادت است، نه استعداد."],
  ["What time does the meeting start?", "جلسه چه ساعتی شروع می‌شود؟"],
  ["I am learning something new today.", "امروز دارم چیز تازه‌ای یاد می‌گیرم."],
  ["Take your time and do it right.", "وقت بگذار و درستش انجام بده."],
  ["Every expense tells a small story.", "هر هزینه یک داستان کوچک دارد."],
  ["Please speak a little more slowly.", "لطفاً کمی آهسته‌تر صحبت کنید."],
  ["I have been working here for two years.", "دو سال است اینجا کار می‌کنم."],
  ["Good planning saves time and money.", "برنامه‌ریزی خوب وقت و پول را حفظ می‌کند."],
  ["Do you know a good place to eat nearby?", "جای خوبی برای غذا خوردن این نزدیکی می‌شناسی؟"],
  ["Mistakes help us learn and grow.", "اشتباه‌ها به ما کمک می‌کنند یاد بگیریم و رشد کنیم."],
  ["The weather is lovely this morning.", "هوا امروز صبح عالی است."],
  ["I will call you as soon as I arrive.", "به محض رسیدن بهت زنگ می‌زنم."],
  ["Keep your goals clear and your plans simple.", "هدف‌هایت را روشن و برنامه‌هایت را ساده نگه دار."],
  ["Thank you for your patience and help.", "از صبر و کمکتان ممنونم."],
  ["Reading a little every day changes a lot.", "هر روز کمی خواندن خیلی چیزها را عوض می‌کند."],
  ["Where can I buy a ticket for the bus?", "از کجا می‌توانم بلیت اتوبوس بخرم؟"],
  ["Be kind, even when it is difficult.", "مهربان باش، حتی وقتی سخت است."],
  ["Let us review our budget this weekend.", "آخر هفته بودجه‌مان را مرور کنیم."],
  ["I would rather walk than wait for a taxi.", "ترجیح می‌دهم پیاده بروم تا منتظر تاکسی بمانم."],
  ["Patience is the key to every good thing.", "صبر کلید هر چیز خوبی است."],
  ["Can you help me find my keys?", "می‌توانی کمک کنی کلیدهایم را پیدا کنم؟"],
  ["Consistency beats intensity in the long run.", "در بلندمدت پیوستگی از شدت مهم‌تر است."],
  ["She always pays her bills on time.", "او همیشه قبض‌هایش را سر وقت می‌پردازد."],
  ["We should leave early to avoid the traffic.", "باید زود برویم تا در ترافیک نمانیم."],
  ["Tomorrow is a fresh chance to start again.", "فردا فرصت تازه‌ای برای شروع دوباره است."],
].map(([en, fa], i) => ({ id: `fb${i}`, en, faPron: "", fa }));

// انتخاب ثابت برای هر روز
export function fallbackSentenceFor(dateISO) {
  const n = Number(String(dateISO).replace(/\D/g, "")) || 0;
  return FALLBACK_SENTENCES[n % FALLBACK_SENTENCES.length];
}
