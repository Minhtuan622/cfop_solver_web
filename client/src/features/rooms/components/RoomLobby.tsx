import { Link } from "wouter";
import {
  EmptyState,
  Field,
  LoadingTransition,
  PendingButton,
  SkeletonList,
} from "@/components/ui/BootstrapUI";
import {
  SystemLeaderboard,
  competitionEventLabel,
  formatLabels,
  type RoomFormat,
} from "@/features/competition";
import { TIMER_EVENTS, timerEventLabel, type TimerEventId } from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RoomSummary } from "../lib/roomTypes";

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
    <div className="container">
      <div className="row g-4">
        <section className="col-12 col-xl-7">
          <div className="card">
            <div className="card-body">
              <h1 className="h3">{t("rooms.lobby.title")}</h1>
              <p className="text-body-secondary">{t("rooms.lobby.intro")}</p>
              <form
                onSubmit={form => {
                  form.preventDefault();
                  onCreate();
                }}
              >
                <Field id="room-name" label={t("rooms.lobby.nameLabel")} required>
                  <input
                    id="room-name"
                    required
                    minLength={2}
                    maxLength={80}
                    className="form-control"
                    value={name}
                    onChange={input => onNameChange(input.target.value)}
                  />
                </Field>
                <div className="row g-3 mt-0">
                  <Field id="room-event" label={t("rooms.lobby.eventLabel")} className="col-md-4">
                    <select
                      id="room-event"
                      className="form-select"
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
                    </select>
                  </Field>
                  <Field id="room-format" label={t("rooms.lobby.formatLabel")} className="col-md-4">
                    <select
                      id="room-format"
                      className="form-select"
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
                    </select>
                  </Field>
                  <Field id="room-max-players" label={t("rooms.lobby.maxPlayersLabel")} className="col-md-4">
                    <select
                      id="room-max-players"
                      className="form-select"
                      value={maxPlayers}
                      onChange={input => onMaxPlayersChange(Number(input.target.value))}
                    >
                      {[2, 4, 6, 8, 12, 16].map(value => (
                        <option key={value}>{t("rooms.lobby.playerCount", { count: value })}</option>
                      ))}
                    </select>
                  </Field>
                  {eventId === "333mbf" ? (
                    <Field id="room-blind-cubes" label={t("rooms.lobby.mbldLabel")} className="col-md-4">
                      <input
                        id="room-blind-cubes"
                        type="number"
                        min={2}
                        max={99}
                        className="form-control"
                        value={multiBlindCubes}
                        onChange={input =>
                          onMultiBlindCubesChange(
                            Math.max(2, Math.min(99, Number(input.target.value) || 2))
                          )
                        }
                      />
                    </Field>
                  ) : null}
                </div>
                <PendingButton
                  className="btn btn-primary mt-3"
                  pending={createPending}
                >
                  {t("rooms.lobby.create")}
                </PendingButton>
              </form>
            </div>
          </div>
        </section>
        <aside className="col-12 col-xl-5">
          <div className="card">
            <div className="card-body">
              <h2 className="h5">{t("rooms.lobby.joinByCode")}</h2>
              <form
                onSubmit={form => {
                  form.preventDefault();
                  onJoin();
                }}
              >
                <Field id="room-join-code" label={t("rooms.lobby.codeLabel")} required>
                  <input
                    id="room-join-code"
                    className="form-control text-uppercase"
                    required
                    minLength={4}
                    maxLength={10}
                    value={joinCode}
                    onChange={input => onJoinCodeChange(input.target.value.toUpperCase())}
                    placeholder="ABC123"
                  />
                </Field>
                <PendingButton
                  className="btn btn-outline-primary mt-3"
                  pending={joinPending}
                >
                  {t("rooms.lobby.join")}
                </PendingButton>
              </form>
              <h2 className="h6 mt-4">{t("rooms.lobby.myRooms")}</h2>
              {myRoomsPending ? (
                <SkeletonList rows={3} label={t("rooms.lobby.loadingRooms")} />
              ) : myRooms.length ? (
                <LoadingTransition>
                  <div className="list-group list-group-flush">
                    {myRooms.map(room => (
                      <Link
                        key={room.id}
                        href={`/rooms/${room.code}`}
                        className="list-group-item list-group-item-action px-0"
                      >
                        <strong className="d-block">{room.name}</strong>
                        <small className="text-body-secondary">
                          {room.code} · {competitionEventLabel(room.eventId, language)}
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
      {error ? <div className="alert alert-danger mt-4">{error}</div> : null}
    </div>
  );
}
