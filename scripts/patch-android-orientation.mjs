import fs from "node:fs";
// برنامه فقط عمودی (portrait) کار کند؛ چرخش به حالت افقی ممنوع
const file = "android/app/src/main/AndroidManifest.xml";
let xml = fs.readFileSync(file, "utf8");
xml = xml.replace(/<activity\b([^>]*)>/, (m, attrs) => {
  if (/android:screenOrientation=/.test(attrs)) return m.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="portrait"');
  return `<activity${attrs}\n            android:screenOrientation="portrait">`;
});
fs.writeFileSync(file, xml);
console.log("Rexa locked to portrait in AndroidManifest.xml");
