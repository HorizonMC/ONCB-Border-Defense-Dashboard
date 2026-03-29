/**
 * Military sound effects for Border Defense Dashboard
 * Real audio files from BigSoundBank.com (CC0 Public Domain)
 * and FreeSoundsLibrary.com
 */

const cache = new Map<string, HTMLAudioElement>();

function play(src: string, volume = 0.7) {
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    cache.set(src, audio);
  }
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

/** เซ็นเซอร์ตรวจพบสัญญาณ — เสียง Sonar ping */
export function soundDetect() {
  play("/sounds/detect.mp3", 0.6);
}

/** แจ้งเตือนเหตุการณ์ — เสียงสัญญาณอพยพ (Evacuation Alarm) */
export function soundAlert() {
  play("/sounds/alert.mp3", 0.7);
}

/** ส่งโดรนออกปฏิบัติการ — เสียงวิทยุสื่อสาร + สัญญาณ */
export function soundDispatch() {
  play("/sounds/radio.mp3", 0.5);
  setTimeout(() => play("/sounds/dispatch.mp3", 0.6), 300);
}

/** AI ตรวจพบเป้าหมาย — เสียง Aerospace comm beep (lock-on) */
export function soundIdentify() {
  play("/sounds/identify.mp3", 0.7);
}

/** ยกระดับวิกฤต — เสียงสัญญาณเตือนภัยแห่งชาติ */
export function soundEscalate() {
  play("/sounds/escalate.mp3", 0.8);
}

/** โดรนกลับฐาน — เสียงวิทยุ (walkie talkie) */
export function soundReturning() {
  play("/sounds/returning.mp3", 0.5);
}

/** ปฏิบัติการสำเร็จ — เสียงสัญญาณปลอดภัย (all clear) */
export function soundComplete() {
  play("/sounds/complete.mp3", 0.6);
}
