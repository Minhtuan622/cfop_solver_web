import { Link } from "wouter";
import {
  EmptyState,
  Field,
  LoadingTransition,
  PendingButton,
  SkeletonList,
} from "@/components/ui/StudioUI";
import {
  SystemLeaderboard,
  competitionEventLabel,
  formatLabels,
  type RoomFormat,
} from "@/features/competition";
import {
  TIMER_EVENTS,
  timerEventLabel,
  type TimerEventId,
} from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RoomSummary } from "../lib/roomTypes";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/FormControls";
import { Textarea } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  eventId: TimerEventId;
  onEventIdChange: (value: TimerEventId) => void;
  format: RoomFormat;
  onFormatChange: (value: RoomFormat) => void;
  maxPlayers: number;
  onMaxPlayersChange: (value: number) => void;
  multiBlindCubes: number;
  onMultiBlindCubesChange: (value: number) => void;
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  createPending: boolean;
  joinPending: boolean;
  myRooms: RoomSummary[];
  myRoomsPending: boolean;
  onCreate: () => void;
  onJoin: () => void;
  error: string;
};

/** Landing view of the rooms section: create a room, join by code, or reopen one of yours. */
export function RoomLobby({
  name,
  onNameChange,
  eventId,
  onEventIdChange,
  format,
  onFormatChange,
  maxPlayers,
  onMaxPlayersChange,
  multiBlindCubes,
  onMultiBlindCubesChange,
  joinCode,
  onJoinCodeChange,
  createPending,
  joinPending,
  myRooms,
  myRoomsPending,
  onCreate,
  onJoin,
  error,
}: Props) {
  const { language, t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 xl:col-span-7">
          <div className="rounded-card border border-line/80 bg-surface shadow-soft">
            <div className="p-5 sm:p-6">
              <h1 className="text-xl font-semibold tracking-tight">
                {t("rooms.lobby.title")}
              </h1>
              <p className="text-muted">{t("rooms.lobby.intro")}</p>
              <form
                onSubmit={form => {
                  form.preventDefault();
                  onCreate();
                }}
              >
                <Field
                  id="room-name"
                  label={t("rooms.lobby.nameLabel")}
                  required
                >
                  <Input
                    id="room-name"
                    required
                    minLength={2}
                    maxLength={80}

                    value={name}
                    onChange={input => onNameChange(input.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-12 gap-4 mt-0">
                  <Field
                    id="room-event"
                    label={t("rooms.lobby.eventLabel")}
                    className="md:col-span-4"
                  >
                    <Select
                      id="room-event"

                      value={eventId}
                      onChange={input =>
                        onEventIdChange(input.target.value as TimerEventId)
                      }
                    >
                      {TIMER_EVENTS.map(item => (
                        <option key={item.id} value={item.id}>
                          {timerEventLabel(item.id, language)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    id="room-format"
                    label={t("rooms.lobby.formatLabel")}
                    className="md:col-span-4"
                  >
                    <Select
                      id="room-format"

                      value={format}
                      onChange={input =>
                        onFormatChange(input.target.value as RoomFormat)
                      }
                    >
                      {Object.entries(formatLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    id="room-max-players"
                    label={t("rooms.lobby.maxPlayersLabel")}
                    className="md:col-span-4"
                  >
                    <Select
                      id="room-max-players"

                      value={maxPlayers}
                      onChange={input =>
                        onMaxPlayersChange(Number(input.target.value))
                      }
                    >
                      {[2, 4, 6, 8, 12, 16].map(value => (
                        <option key={value}>
                          {t("rooms.lobby.playerCount", { count: value })}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {eventId === "333mbf" ? (
                    <Field
                      id="room-blind-cubes"
                      label={t("rooms.lobby.mbldLabel")}
                      className="md:col-span-4"
                    >
                      <Input
                        id="room-blind-cubes"
                        type="number"
                        min={2}
                        max={99}

                        value={multiBlindCubes}
                        onChange={input =>
                          onMultiBlindCubesChange(
                            Math.max(
                              2,
                              Math.min(99, Number(input.target.value) || 2)
                            )
                          )
                        }
                      />
                    </Field>
                  ) : null}
                </div>
                <PendingButton
                  className={`${buttonClass("primary", "md")} mt-4`}
                  pending={createPending}
                >
                  {t("rooms.lobby.create")}
                </PendingButton>
              </form>
            </div>
          </div>
        </section>
        <aside className="col-span-12 xl:col-span-5">
          <div className="rounded-card border border-line/80 bg-surface shadow-soft">
            <div className="p-5 sm:p-6">
              <h2 className="text-base font-semibold tracking-tight">
                {t("rooms.lobby.joinByCode")}
              </h2>
              <form
                onSubmit={form => {
                  form.preventDefault();
                  onJoin();
                }}
              >
                <Field
                  id="room-join-code"
                  label={t("rooms.lobby.codeLabel")}
                  required
                >
                  <Input
                    className="uppercase tracking-wide"
                    id="room-join-code"

                    required
                    minLength={4}
                    maxLength={10}
                    value={joinCode}
                    onChange={input =>
                      onJoinCodeChange(input.target.value.toUpperCase())
                    }
                    placeholder="ABC123"
                  />
                </Field>
                <PendingButton
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-primary/35 bg-transparent text-primary hover:bg-primary-soft mt-4"
                  pending={joinPending}
                >
                  {t("rooms.lobby.join")}
                </PendingButton>
              </form>
              <h2 className="text-sm font-semibold tracking-tight mt-6">
                {t("rooms.lobby.myRooms")}
              </h2>
              {myRoomsPending ? (
                <SkeletonList rows={3} label={t("rooms.lobby.loadingRooms")} />
              ) : myRooms.length ? (
                <LoadingTransition>
                  <div className="divide-y divide-line bg-transparent border-0">
                    {myRooms.map(room => (
                      <Link
                        key={room.id}
                        href={`/rooms/${room.code}`}
                        className="block px-4 py-3 text-sm transition-colors hover:bg-surface-2 px-0"
                      >
                        <strong className="block">{room.name}</strong>
                        <small className="text-muted">
                          {room.code} ·{" "}
                          {competitionEventLabel(room.eventId, language)}
                        </small>
                      </Link>
                    ))}
                  </div>
                </LoadingTransition>
              ) : (
                <EmptyState
                  title={t("rooms.lobby.emptyTitle")}
                  description={t("rooms.lobby.emptyDetail")}
                />
              )}
            </div>
          </div>
        </aside>
      </div>
      <SystemLeaderboard />
      {error ? (
        <div className="rounded-panel border px-4 py-3 text-sm border-danger/20 bg-danger-soft text-ink mt-6">
          {error}
        </div>
      ) : null}
    </div>
  );
}
