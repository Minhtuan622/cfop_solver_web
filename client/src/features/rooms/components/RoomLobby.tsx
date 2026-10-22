import { Link } from "wouter";
import {
  EmptyState,
  Field,
  LoadingTransition,
  SkeletonList,
} from "@/components/ui/BootstrapUI";
import {
  SystemLeaderboard,
  competitionEventLabel,
  formatLabels,
  type RoomFormat,
} from "@/features/competition";
import { TIMER_EVENTS, type TimerEventId } from "@/lib/timerEvents";
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
  myRooms,
  myRoomsPending,
  onCreate,
  onJoin,
  error,
}: Props) {
  return (
    <div className="container">
      <div className="row g-4">
        <section className="col-12 col-xl-7">
          <div className="card">
            <div className="card-body">
              <h1 className="h3">Phòng thi đấu</h1>
              <p className="text-body-secondary">
                Chọn event, tạo scramble chung hoặc chia sẻ link để người khác
                thi và theo dõi.
              </p>
              <form
                onSubmit={form => {
                  form.preventDefault();
                  onCreate();
                }}
              >
                <Field id="room-name" label="Tên phòng" required>
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
                  <Field id="room-event" label="Loại khối" className="col-md-4">
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
                          {item.labelVi}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="room-format" label="Thể thức" className="col-md-4">
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
                  <Field id="room-max-players" label="Tối đa" className="col-md-4">
                    <select
                      id="room-max-players"
                      className="form-select"
                      value={maxPlayers}
                      onChange={input => onMaxPlayersChange(Number(input.target.value))}
                    >
                      {[2, 4, 6, 8, 12, 16].map(value => (
                        <option key={value}>{value} người</option>
                      ))}
                    </select>
                  </Field>
                  {eventId === "333mbf" ? (
                    <Field id="room-blind-cubes" label="Số khối MBLD" className="col-md-4">
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
                <button
                  className="btn btn-primary mt-3"
                  disabled={createPending}
                >
                  Tạo phòng
                </button>
              </form>
            </div>
          </div>
        </section>
        <aside className="col-12 col-xl-5">
          <div className="card">
            <div className="card-body">
              <h2 className="h5">Vào bằng mã</h2>
              <form
                onSubmit={form => {
                  form.preventDefault();
                  onJoin();
                }}
              >
                <Field id="room-join-code" label="Mã phòng" required>
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
                <button className="btn btn-outline-primary mt-3">
                  Tham gia thi
                </button>
              </form>
              <h2 className="h6 mt-4">Phòng của bạn</h2>
              {myRoomsPending ? (
                <SkeletonList rows={3} label="Đang tải phòng của bạn" />
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
                          {room.code} · {competitionEventLabel(room.eventId)}
                        </small>
                      </Link>
                    ))}
                  </div>
                </LoadingTransition>
              ) : (
                <EmptyState
                  title="Chưa có phòng."
                  description="Tạo phòng mới ở ô bên cạnh hoặc tham gia bằng mã để bắt đầu lượt thi."
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
