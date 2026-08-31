import { useState } from "react";
import { Modal, Button, inputCls } from "./ui";
import { useAppState } from "../context/AppStateContext";

export default function ScheduleModal({ open, onClose, withName, type }) {
  // type: "pitch" | "test"
  const { addEvent } = useAppState();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const label = type === "pitch" ? "Schedule Pitch Meet" : "Schedule Skill Test";

  function handleSubmit() {
    if (!date || !time) return;
    addEvent({ type, withName, date, time, notes });
    setDate("");
    setTime("");
    setNotes("");
    onClose(true);
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={label} subtitle={`with ${withName}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder={type === "pitch" ? "e.g. Focus on traction and ask" : "e.g. Live coding round, 45 min"}
          />
        </div>
        <Button className="w-full" onClick={handleSubmit} disabled={!date || !time}>
          Confirm &amp; add to calendar
        </Button>
      </div>
    </Modal>
  );
}
