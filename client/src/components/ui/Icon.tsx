import type { ComponentType } from "react";
import {
  AlertCircle as AlertCircleGlyph,
  AlertTriangle as AlertTriangleGlyph,
  BadgeCheck as BadgeCheckGlyph,
  KeyRound as KeyRoundGlyph,
  Link2Off as Link2OffGlyph,
  LogIn as LogInGlyph,
  Target as TargetGlyph,
  Unlink as UnlinkGlyph,
  ArrowLeft as ArrowLeftGlyph,
  ArrowRight as ArrowRightGlyph,
  Bluetooth as BluetoothGlyph,
  BarChart3 as BarChart3Glyph,
  BookOpenCheck as BookOpenCheckGlyph,
  Box as BoxGlyph,
  CalendarDays as CalendarDaysGlyph,
  Camera as CameraGlyph,
  Check as CheckGlyph,
  CircleCheckBig as CheckCircleFillGlyph,
  ChevronDown as ChevronDownGlyph,
  ChevronLeft as ChevronLeftGlyph,
  ChevronRight as ChevronRightGlyph,
  ChevronUp as ChevronUpGlyph,
  CircleGauge as CircleGaugeGlyph,
  CircleUserRound as PersonCircleGlyph,
  ClipboardCheck as ClipboardCheckGlyph,
  ClipboardCopy as ClipboardCopyGlyph,
  Clock3 as Clock3Glyph,
  Dices as DicesGlyph,
  Download as DownloadGlyph,
  ExternalLink as ExternalLinkGlyph,
  Eye as EyeGlyph,
  EyeOff as EyeOffGlyph,
  FileDown as FileDownGlyph,
  FileJson as FileJsonGlyph,
  FileUp as FileUpGlyph,
  Grid3x3 as GridGlyph,
  History as HistoryGlyph,
  House as HomeGlyph,
  ImageDown as ImageDownGlyph,
  Info as InfoGlyph,
  Languages as TranslateGlyph,
  Link2 as Link2Glyph,
  List as ListUlGlyph,
  LogOut as BoxArrowRightGlyph,
  MapPin as GeoAltGlyph,
  MoonStar as MoonStarsGlyph,
  Package as BoxSeamGlyph,
  Pause as PauseGlyph,
  Pencil as PencilGlyph,
  Play as PlayGlyph,
  Puzzle as PuzzleGlyph,
  Redo2 as Redo2Glyph,
  Rotate3D as Rotate3DGlyph,
  RotateCcw as RotateCcwGlyph,
  ScanLine as ScanLineGlyph,
  Search as SearchGlyph,
  ShieldCheck as ShieldCheckGlyph,
  Shuffle as ShuffleGlyph,
  SkipBack as SkipStartGlyph,
  SkipForward as SkipEndGlyph,
  Sparkles as SparklesGlyph,
  Square as SquareGlyph,
  SquarePen as PencilSquareGlyph,
  Sun as SunFillGlyph,
  SunMoon as CircleHalfGlyph,
  Tag as TagGlyph,
  Timer as TimerGlyph,
  TimerReset as TimerResetGlyph,
  Trash2 as Trash2Glyph,
  Trophy as TrophyGlyph,
  Undo2 as Undo2Glyph,
  X as XGlyph,
  ArrowUpRight as ArrowUpRightGlyph,
  Bug as BugGlyph,
  Copy as CopyGlyph,
  Code2 as Code2Glyph,
  Globe as GlobeGlyph,
  GitPullRequest as GitPullRequestGlyph,
  GraduationCap as GraduationCapGlyph,
  QrCode as QrCodeGlyph,
  Settings as SettingsGlyph,
  Share2 as Share2Glyph,
  Star as StarGlyph,
  Swords as SwordsGlyph,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Glyph = ComponentType<LucideProps>;

function icon(Glyph: Glyph) {
  return function Icon({ className, size = "1em", strokeWidth = 2.15, ...props }: LucideProps) {
    return (
      <Glyph
        aria-hidden="true"
        {...props}
        className={cn("inline-block shrink-0 align-[-0.125em]", className)}
        size={size}
        strokeWidth={strokeWidth}
      />
    );
  };
}

export const AlertCircle = icon(AlertCircleGlyph);
export const AlertTriangle = icon(AlertTriangleGlyph);
export const ArrowLeft = icon(ArrowLeftGlyph);
export const ArrowRight = icon(ArrowRightGlyph);
export const BarChart3 = icon(BarChart3Glyph);
export const Bluetooth = icon(BluetoothGlyph);
export const BookOpenCheck = icon(BookOpenCheckGlyph);
export const BoxArrowRight = icon(BoxArrowRightGlyph);
export const BoxIcon = icon(BoxGlyph);
export const BoxSeam = icon(BoxSeamGlyph);
export const Calendar3 = icon(CalendarDaysGlyph);
export const Camera = icon(CameraGlyph);
export const Check = icon(CheckGlyph);
export const CheckCircleFill = icon(CheckCircleFillGlyph);
export const ChevronDown = icon(ChevronDownGlyph);
export const ChevronLeftIcon = icon(ChevronLeftGlyph);
export const ChevronRight = icon(ChevronRightGlyph);
export const ChevronUp = icon(ChevronUpGlyph);
export const CircleGauge = icon(CircleGaugeGlyph);
export const CircleHalf = icon(CircleHalfGlyph);
export const ClipboardCheck = icon(ClipboardCheckGlyph);
export const ClipboardCopy = icon(ClipboardCopyGlyph);
export const Clock3 = icon(Clock3Glyph);
export const Dices = icon(DicesGlyph);
export const Download = icon(DownloadGlyph);
export const ExternalLink = icon(ExternalLinkGlyph);
export const Eye = icon(EyeGlyph);
export const EyeOff = icon(EyeOffGlyph);
export const FileDown = icon(FileDownGlyph);
export const FileJson = icon(FileJsonGlyph);
export const FileUp = icon(FileUpGlyph);
export const GeoAlt = icon(GeoAltGlyph);
export const Grid = icon(GridGlyph);
export const History = icon(HistoryGlyph);
export const Home = icon(HomeGlyph);
export const ImageDown = icon(ImageDownGlyph);
export const Info = icon(InfoGlyph);
export const Link2 = icon(Link2Glyph);
export const ListUl = icon(ListUlGlyph);
export const MoonStars = icon(MoonStarsGlyph);
export const Pause = icon(PauseGlyph);
export const Pencil = icon(PencilGlyph);
export const PencilSquare = icon(PencilSquareGlyph);
export const PersonCircle = icon(PersonCircleGlyph);
export const Play = icon(PlayGlyph);
export const Puzzle = icon(PuzzleGlyph);
export const Redo2 = icon(Redo2Glyph);
export const Rotate3D = icon(Rotate3DGlyph);
export const RotateCcw = icon(RotateCcwGlyph);
export const ScanLine = icon(ScanLineGlyph);
export const Search = icon(SearchGlyph);
export const ShieldCheck = icon(ShieldCheckGlyph);
export const Shuffle = icon(ShuffleGlyph);
export const SkipStart = icon(SkipStartGlyph);
export const SkipEnd = icon(SkipEndGlyph);
export const Sparkles = icon(SparklesGlyph);
export const Square = icon(SquareGlyph);
export const SunFill = icon(SunFillGlyph);
export const Tag = icon(TagGlyph);
export const Timer = icon(TimerGlyph);
export const TimerReset = icon(TimerResetGlyph);
export const Translate = icon(TranslateGlyph);
export const Trash2 = icon(Trash2Glyph);
export const Trophy = icon(TrophyGlyph);
export const Undo2 = icon(Undo2Glyph);
export const X = icon(XGlyph);
export const ArrowUpRight = icon(ArrowUpRightGlyph);
export const Bug = icon(BugGlyph);
export const Copy = icon(CopyGlyph);
export const Code2 = icon(Code2Glyph);
export const Globe = icon(GlobeGlyph);
export const GitPullRequest = icon(GitPullRequestGlyph);
export const GraduationCap = icon(GraduationCapGlyph);
export const QrCode = icon(QrCodeGlyph);
export const Settings = icon(SettingsGlyph);
export const Share2 = icon(Share2Glyph);
export const Star = icon(StarGlyph);
export const Swords = icon(SwordsGlyph);
export const BadgeCheck = icon(BadgeCheckGlyph);
export const KeyRound = icon(KeyRoundGlyph);
export const Link2Off = icon(Link2OffGlyph);
export const LogIn = icon(LogInGlyph);
export const Target = icon(TargetGlyph);
export const Unlink = icon(UnlinkGlyph);
