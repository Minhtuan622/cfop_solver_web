/** Xưởng Cơ Khí Tốc Độ — local-only six-face camera scanner with center-color calibration. */
import { useEffect, useRef, useState } from "react";
/** Tailwind-native camera card; only the live-video sampling frame remains functional layout. */
import { Camera, Check, RotateCcw, ScanLine, X } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
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

function css([r, g, b]: RGB) {
  return `rgb(${r}, ${g}, ${b})`;
}

export function CameraScanner({
  onState,
}: {
  onState: (state: string) => void;
}) {
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [faceIndex, setFaceIndex] = useState(0);
  const [captures, setCaptures] = useState<Partial<Record<Face, RGB[]>>>({});
  const [message, setMessage] = useState(
    "Mở camera, đặt một mặt vào khung 3 × 3 rồi chụp."
  );
  const currentFace = ORDER[faceIndex];

  useEffect(() => {
    if (!active && Object.keys(captures).length === 0) {
      setMessage(
        language === "vi"
          ? "Mở camera, đặt một mặt vào khung 3 × 3 rồi chụp."
          : "Open the camera, place one face in the 3 × 3 frame, then capture it."
      );
    }
  }, [active, captures, language]);

  useEffect(
    () => () => streamRef.current?.getTracks().forEach(track => track.stop()),
    []
  );

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      setMessage(
        language === "vi"
          ? `Đang quét mặt ${currentFace}. Giữ sticker nằm trong ô lưới.`
          : `Scanning face ${currentFace}. Keep stickers inside the grid.`
      );
    } catch {
      setMessage(
        language === "vi"
          ? "Không mở được camera. Kiểm tra quyền camera hoặc nhập màu 6 mặt."
          : "Camera could not open. Check permission or enter the 6-face colors."
      );
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach(track => track.stop());
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
    canvas.width = 300;
    canvas.height = 300;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);
    const points = [50, 150, 250];
    const samples: RGB[] = [];
    for (const y of points)
      for (const x of points) {
        const image = context.getImageData(x - 12, y - 12, 24, 24).data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < image.length; i += 4) {
          r += image[i];
          g += image[i + 1];
          b += image[i + 2];
          count += 1;
        }
        samples.push([
          Math.round(r / count),
          Math.round(g / count),
          Math.round(b / count),
        ]);
      }
    const updated = { ...captures, [currentFace]: samples };
    setCaptures(updated);
    if (faceIndex < ORDER.length - 1) {
      setFaceIndex(value => value + 1);
      setMessage(
        language === "vi"
          ? `Đã lưu ${currentFace}. Xoay cube và quét mặt ${ORDER[faceIndex + 1]}.`
          : `Saved ${currentFace}. Turn the cube and scan face ${ORDER[faceIndex + 1]}.`
      );
      return;
    }
    const centers = Object.fromEntries(
      ORDER.map(face => [face, updated[face]![4]])
    ) as Record<Face, RGB>;
    const state = ORDER.flatMap(face =>
      updated[face]!.map(sample =>
        ORDER.reduce(
          (best, candidate) =>
            distance(sample, centers[candidate]) <
            distance(sample, centers[best])
              ? candidate
              : best,
          ORDER[0]
        )
      )
    ).join("");
    onState(state);
    setMessage(
      language === "vi"
        ? "Đã đọc đủ 6 mặt. Bấm Tạo hướng dẫn để kiểm tra."
        : "All 6 faces captured. Press Create guide to check it."
    );
    stop();
  }

  function reset() {
    setCaptures({});
    setFaceIndex(0);
    setMessage(
      language === "vi"
        ? "Đã xóa lần quét. Bắt đầu lại từ mặt U."
        : "Scan cleared. Start again with face U."
    );
  }

  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
              {t("camera.title")}
            </p>
            <p className="font-semibold mb-0">{t("camera.help")}</p>
          </div>
          <Camera className="text-lg text-success shrink-0" />
        </div>
        {active && (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-ink mt-4">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 border border-line border-2 border-success pointer-events-none">
              <div className="grid grid-cols-3 gap-0 h-full">
                {Array.from({ length: 9 }).map((_, index) => (
                  <span
                    key={index}
                    className="border border-line border-success"
                  />
                ))}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-ink text-surface absolute top-0 left-0 m-2">
              FACE {currentFace}
            </span>
          </div>
        )}
        <div
          className="flex flex-wrap gap-2 mt-4"
          aria-label={
            language === "vi" ? "Tiến độ quét các mặt" : "Face scan progress"
          }
        >
          {ORDER.map(face => (
            <span
              key={face}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide transition border ${
                captures[face]
                  ? "border-transparent bg-success text-white"
                  : face === currentFace
                    ? "border-primary text-primary"
                    : "border-line text-muted"
              }`}
            >
              {captures[face] ? <Check className="text-base" /> : face}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted mt-4 mb-0">{message}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {!active ? (
            <IconButton
              label={t("camera.open")}
              icon={<Camera className="text-base" />}
              onClick={start}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover px-3 py-1.5 text-xs"
            />
          ) : (
            <>
              <IconButton
                label={`${t("camera.capture")} ${currentFace}`}
                icon={<ScanLine className="text-base" />}
                onClick={capture}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover px-3 py-1.5 text-xs"
              />
              <IconButton
                label={t("camera.stop")}
                icon={<X className="text-base" />}
                onClick={stop}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
              />
            </>
          )}
          <IconButton
            label={t("camera.reset")}
            icon={<RotateCcw className="text-base" />}
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
          />
        </div>
        {Object.values(captures).length > 0 && (
          <div className="flex gap-1 mt-4">
            {ORDER.filter(face => captures[face]).map(face => (
              <span
                key={face}
                className="rounded-xl flex-1"
                style={{
                  minHeight: "0.5rem",
                  backgroundColor: css(captures[face]![4]),
                }}
                title={`Tâm ${face}`}
              />
            ))}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </section>
  );
}
