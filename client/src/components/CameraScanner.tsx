/** Xưởng Cơ Khí Tốc Độ — local-only six-face camera scanner with center-color calibration. */
import { useEffect, useRef, useState } from "react";
import { Camera, Check, RotateCcw, ScanLine, Square, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ORDER = ["U", "R", "F", "D", "L", "B"] as const;
type Face = (typeof ORDER)[number];
type RGB = [number, number, number];

function distance(a: RGB, b: RGB) {
  const normalize = ([r, g, b]: RGB) => {
    const sum = Math.max(1, r + g + b);
    return [r / sum, g / sum, b / sum] as RGB;
  };
  const [ar, ag, ab] = normalize(a);
  const [br, bg, bb] = normalize(b);
  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
}

function css([r, g, b]: RGB) { return `rgb(${r}, ${g}, ${b})`; }

export function CameraScanner({ onState }: { onState: (state: string) => void }) {
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [faceIndex, setFaceIndex] = useState(0);
  const [captures, setCaptures] = useState<Partial<Record<Face, RGB[]>>>({});
  const [message, setMessage] = useState("Mở camera, đặt một mặt vào khung 3 × 3 rồi chụp.");
  const currentFace = ORDER[faceIndex];

  useEffect(() => {
    if (!active && Object.keys(captures).length === 0) {
      setMessage(language === "vi" ? "Mở camera, đặt một mặt vào khung 3 × 3 rồi chụp." : "Open the camera, place one face in the 3 × 3 frame, then capture it.");
    }
  }, [active, captures, language]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setActive(true);
      setMessage(language === "vi" ? `Đang quét mặt ${currentFace}. Giữ sticker nằm trong ô lưới.` : `Scanning face ${currentFace}. Keep stickers inside the grid.`);
    } catch {
      setMessage(language === "vi" ? "Không mở được camera. Kiểm tra quyền camera hoặc nhập màu 6 mặt." : "Camera could not open. Check permission or enter the 6-face colors.");
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    const size = Math.min(video.videoWidth, video.videoHeight) * 0.62;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    canvas.width = 300; canvas.height = 300;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);
    const points = [50, 150, 250];
    const samples: RGB[] = [];
    for (const y of points) for (const x of points) {
      const image = context.getImageData(x - 12, y - 12, 24, 24).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < image.length; i += 4) { r += image[i]; g += image[i + 1]; b += image[i + 2]; count += 1; }
      samples.push([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
    }
    const updated = { ...captures, [currentFace]: samples };
    setCaptures(updated);
    if (faceIndex < ORDER.length - 1) {
      setFaceIndex((value) => value + 1);
      setMessage(language === "vi" ? `Đã lưu ${currentFace}. Xoay cube và quét mặt ${ORDER[faceIndex + 1]}.` : `Saved ${currentFace}. Turn the cube and scan face ${ORDER[faceIndex + 1]}.`);
      return;
    }
    const centers = Object.fromEntries(ORDER.map((face) => [face, updated[face]![4]])) as Record<Face, RGB>;
    const state = ORDER.flatMap((face) => updated[face]!.map((sample) => ORDER.reduce((best, candidate) => distance(sample, centers[candidate]) < distance(sample, centers[best]) ? candidate : best, ORDER[0]))).join("");
    onState(state);
    setMessage(language === "vi" ? "Đã đọc đủ 6 mặt. Bấm Tạo hướng dẫn để kiểm tra." : "All 6 faces captured. Press Create guide to check it.");
    stop();
  }

  function reset() { setCaptures({}); setFaceIndex(0); setMessage(language === "vi" ? "Đã xóa lần quét. Bắt đầu lại từ mặt U." : "Scan cleared. Start again with face U."); }

  return <div className="rounded-[1rem] border-2 border-[#17221d] bg-[#e9e3d6] p-4">
    <div className="d-flex align-items-start justify-content-between gap-3"><div><p className="font-monospace text-[10px] fw-bold text-[#17221d]/55">{t("camera.title")}</p><p className="mt-1 text-sm fw-bold">{t("camera.help")}</p></div><Camera className="text-[#1ba77a]" /></div>
    {active && <div className="position-relative mt-3 overflow-hidden rounded-lg bg-[#17221d]"><video ref={videoRef} muted playsInline className="h-100 w-100" /><div className="position-absolute d-grid border-2 border-[#1ba77a]">{Array.from({ length: 9 }).map((_, index) => <span key={index} className="border border-[#1ba77a]/80" />)}</div><span className="position-absolute top-2 rounded bg-[#17221d]/80 px-2 py-1 font-monospace text-xs fw-bold text-[#f4f0e8]">FACE {currentFace}</span></div>}
    <div className="mt-3 d-flex align-items-center">{ORDER.map((face) => <span key={face} className={`grid h-6 w-6 place-items-center rounded-sm border font-mono text-[10px] font-bold ${captures[face] ? "border-[#1ba77a] bg-[#1ba77a] text-[#17221d]" : face === currentFace ? "border-[#17221d] bg-white" : "border-[#17221d]/20 bg-white/40 text-[#17221d]/45"}`}>{captures[face] ? <Check className="" /> : face}</span>)}</div>
    <p className="mt-3 text-xs text-[#17221d]/65">{message}</p>
    <div className="mt-3 d-flex flex-wrap gap-2">{!active ? <button onClick={start} className=""><Camera className="" />{t("camera.open")}</button> : <><button onClick={capture} className=""><ScanLine className="" />{t("camera.capture")} {currentFace}</button><button onClick={stop} className=""><X className="" />{t("camera.stop")}</button></>}<button onClick={reset} className=""><RotateCcw className="" />{t("camera.reset")}</button></div>
    {Object.values(captures).length > 0 && <div className="mt-3 d-flex gap-1">{ORDER.filter((face) => captures[face]).map((face) => <span key={face} className="flex-grow-1 rounded-sm border border-black/15" style={{ background: css(captures[face]![4]) }} title={`Tâm ${face}`} />)}</div>}
    <canvas ref={canvasRef} className="d-none" />
  </div>;
}
