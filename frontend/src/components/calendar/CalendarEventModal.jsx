import React, { useState, useEffect } from 'react';
import calendarApi from '../../services/calendarApi';
import {
  EVENT_TYPE_META,
  EVENT_TYPES,
  STATUS_META,
  EVENT_STATUSES,
  PARTICIPANT_TYPE_LABEL,
  todayStr,
  isValidMeetingLink,
  formatLocalDate,
  formatLocalTime,
  getBrowserTimezone,
} from './calendarMeta';

const EMPTY_FORM = {
  eventType: 'GENERAL_MEETING',
  title: '',
  participantName: '',
  date: '',
  startTime: '',
  endTime: '',
  meetingLink: '',
  location: '',
  notes: '',
  status: 'SCHEDULED',
};

const inputClass =
  'w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass = 'block text-xs font-semibold text-slate-300 mb-1.5';
const buttonBase =
  'px-4 py-2.5 text-xs font-semibold rounded-xl transition disabled:opacity-50 shadow-sm';

export default function CalendarEventModal({ open, event, prefill, role = 'startup', onClose, onSaved }) {
  const [mode, setMode] = useState('create'); // 'create' | 'view' | 'edit'
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const participantLocked = Boolean(prefill?.participantId || (event && event.participantId));
  const isOrganizer = role === 'startup';

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setError('');
    if (event) {
      setMode('view');
      setForm({
        eventType: event.eventType,
        title: event.title || '',
        participantName: event.participantName || '',
        date: event.date || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        meetingLink: event.meetingLink || '',
        location: event.location || '',
        notes: event.notes || '',
        status: event.status || 'SCHEDULED',
      });
    } else if (prefill) {
      setMode('create');
      setForm({
        ...EMPTY_FORM,
        eventType: prefill.eventType || 'GENERAL_MEETING',
        title: prefill.title || '',
        participantName: prefill.participantName || '',
        date: prefill.date || todayStr(),
        startTime: prefill.startTime || '10:00',
        endTime: prefill.endTime || '11:00',
        location: prefill.location || '',
        meetingLink: prefill.meetingLink || '',
        status: prefill.status || 'SCHEDULED',
      });
    } else {
      setMode('create');
      setForm({ ...EMPTY_FORM, date: todayStr(), startTime: '10:00', endTime: '11:00' });
    }
  }, [open, event, prefill]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.title.trim()) return 'Event title is required.';
    if (!form.date) return 'Event date is required.';
    if (!form.startTime) return 'Start time is required.';
    if (!form.endTime) return 'End time is required.';
    if (form.endTime <= form.startTime) return 'End time must be later than start time.';
    if (!isValidMeetingLink(form.meetingLink)) {
      return 'Meeting link must be a valid URL (e.g. https://meet.google.com/abc).';
    }
    if (form.eventType !== 'GENERAL_MEETING' && !(participantLocked || form.participantName.trim())) {
      return 'A participant is required for this event type. Schedule it from an investor or freelancer card.';
    }
    return '';
  };

  const buildPayload = () => ({
    eventType: form.eventType,
    title: form.title.trim(),
    timezone: getBrowserTimezone(),
    participantId: prefill?.participantId || event?.participantId || null,
    participantType: prefill?.participantType || event?.participantType || (form.eventType === 'GENERAL_MEETING' ? 'general' : 'user'),
    participantName: participantLocked ? prefill?.participantName || event?.participantName || '' : form.participantName.trim(),
    relatedEntityId: prefill?.relatedEntityId || event?.relatedEntityId || null,
    relatedEntityType: prefill?.relatedEntityType || event?.relatedEntityType || '',
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    meetingLink: form.meetingLink.trim(),
    location: form.location.trim(),
    notes: form.notes.trim(),
    ...(event ? { status: form.status } : {}),
  });

  const handleSave = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (event) {
        const res = await calendarApi.updateEvent(event._id, buildPayload());
        onSaved?.(res.data.event, 'updated');
      } else if (prefill?.participantId || prefill?.relatedEntityId) {
        const res = await calendarApi.createFromParticipant(buildPayload());
        onSaved?.(res.data.event, 'created');
      } else {
        const res = await calendarApi.createEvent(buildPayload());
        onSaved?.(res.data.event, 'created');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save calendar event.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!event) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await calendarApi.updateStatus(event._id, newStatus);
      onSaved?.(res.data.event, 'status');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setActionLoading(true);
    setError('');
    try {
      await calendarApi.deleteEvent(event._id);
      onSaved?.(null, 'deleted');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete calendar event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRsvp = async (response) => {
    if (!event) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await calendarApi.rsvp(event._id, response);
      onSaved?.(res.data.event, 'rsvp');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update your meeting response.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!open) return null;

  const typeMeta = EVENT_TYPE_META[form.eventType] || EVENT_TYPE_META.GENERAL_MEETING;
  const statusMeta = STATUS_META[form.status] || STATUS_META.SCHEDULED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl w-full max-w-xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {mode === 'view' ? 'Event Details' : event ? 'Edit Calendar Event' : 'Schedule Event'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-4 text-xs rounded-2xl font-medium shadow-inner bg-rose-950/50 border border-rose-800/80 text-rose-300">
            {error}
          </div>
        )}

        {/* ---------- VIEW MODE (details + actions) ---------- */}
        {mode === 'view' && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm ${typeMeta.chip}`}>
                    {typeMeta.icon} {typeMeta.label}
                  </span>
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm ${statusMeta.chip}`}>
                    {statusMeta.label}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">{form.title}</h4>
                {form.participantName && (
                  <p className="text-xs text-slate-300">
                    {PARTICIPANT_TYPE_LABEL[prefill?.participantType || event?.participantType || 'general']} ·{' '}
                    <span className="font-semibold text-indigo-300">{form.participantName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</div>
                <div className="text-slate-200 font-medium">{formatLocalDate(event || {})}</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Time</div>
                <div className="text-slate-200 font-medium">
                  {formatLocalTime(event || {})}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{event?.timezone || 'UTC'} · shown in your local time</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Meeting Link</div>
                {form.meetingLink ? (
                  <a href={form.meetingLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline break-all">
                    {form.meetingLink}
                  </a>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Location</div>
                <div className="text-slate-200 font-medium">{form.location || '—'}</div>
              </div>
            </div>

            {form.notes && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Notes</div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{form.notes}</p>
              </div>
            )}

            {isOrganizer && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Participant Response</div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-sm ${
                    event?.participantResponse === 'accepted'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
                      : event?.participantResponse === 'declined'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-800/70'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700'
                  }`}
                >
                  {event?.participantResponse === 'accepted'
                    ? 'Accepted'
                    : event?.participantResponse === 'declined'
                    ? 'Declined'
                    : 'Awaiting Response'}{event?.respondedAt ? ` · ${new Date(event.respondedAt).toLocaleDateString()}` : ''}
                </span>
              </div>
            )}

            <div className="text-[10px] text-slate-500">
              Created {event?.createdAt ? new Date(event.createdAt).toLocaleDateString() : '—'}
            </div>

            {isOrganizer ? (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <button onClick={() => setMode('edit')} className={`${buttonBase} bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25`}>
                  Edit
                </button>
                {form.status !== 'COMPLETED' && form.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleStatusChange('COMPLETED')}
                    disabled={actionLoading}
                    className={`${buttonBase} bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-800/70`}
                  >
                    {actionLoading ? 'Updating...' : 'Mark Completed'}
                  </button>
                )}
                {form.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={actionLoading}
                    className={`${buttonBase} bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/70`}
                  >
                    Cancel Event
                  </button>
                )}
                {confirmDelete ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[10px] text-rose-300">Delete permanently?</span>
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className={`${buttonBase} bg-rose-600 hover:bg-rose-500 text-white`}
                    >
                      {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className={`${buttonBase} bg-slate-800 text-slate-300 hover:bg-slate-700`}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={actionLoading}
                    className={`${buttonBase} ml-auto bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/70`}
                  >
                    Delete
                  </button>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Your Response:
                </span>
                <span
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                    event?.participantResponse === 'accepted'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
                      : event?.participantResponse === 'declined'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-800/70'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700'
                  }`}
                >
                  {event?.participantResponse === 'accepted'
                    ? 'Accepted'
                    : event?.participantResponse === 'declined'
                    ? 'Declined'
                    : 'Not Responded'}
                </span>
                {event?.status !== 'CANCELLED' && event?.status !== 'COMPLETED' && (
                  <>
                    {event?.participantResponse !== 'accepted' && (
                      <button
                        onClick={() => handleRsvp('accepted')}
                        disabled={actionLoading}
                        className={`${buttonBase} bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-800/70`}
                      >
                        {actionLoading ? 'Saving...' : '✓ Accept Invitation'}
                      </button>
                    )}
                    {event?.participantResponse !== 'declined' && (
                      <button
                        onClick={() => handleRsvp('declined')}
                        disabled={actionLoading}
                        className={`${buttonBase} bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/70`}
                      >
                        Decline
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------- CREATE / EDIT FORM ---------- */}
        {mode !== 'view' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event Type <span className="text-rose-400">*</span></label>
                <select value={form.eventType} onChange={(e) => setField('eventType', e.target.value)} className={inputClass}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {EVENT_TYPE_META[t].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Event Title <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. Series A pitch with Angel Investor"
                  className={inputClass}
                />
              </div>
            </div>

            {form.eventType !== 'GENERAL_MEETING' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Participant <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={participantLocked ? prefill?.participantName || event?.participantName || '' : form.participantName}
                    onChange={(e) => setField('participantName', e.target.value)}
                    disabled={participantLocked}
                    placeholder="Participant is preselected from investor/freelancer cards"
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-500 pt-6 leading-relaxed">
                    {participantLocked ? (
                      <>
                        Participant: <span className="text-emerald-400 font-semibold">{PARTICIPANT_TYPE_LABEL[prefill?.participantType || event?.participantType || 'user']}</span>
                      </>
                    ) : (
                      'Tip: pick a participant by scheduling from an investor or freelancer card.'
                    )}
                  </div>
                </div>
              </div>
            )}

            {form.eventType === 'GENERAL_MEETING' && (
              <div>
                <label className={labelClass}>Participant Name (optional)</label>
                <input
                  type="text"
                  value={form.participantName}
                  onChange={(e) => setField('participantName', e.target.value)}
                  placeholder="Who is this meeting with?"
                  className={inputClass}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Date <span className="text-rose-400">*</span></label>
                <input
                  type="date"
                  value={form.date}
                  min={todayStr()}
                  onChange={(e) => setField('date', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Start Time <span className="text-rose-400">*</span></label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setField('startTime', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Time <span className="text-rose-400">*</span></label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setField('endTime', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Meeting Link</label>
                <input
                  type="text"
                  value={form.meetingLink}
                  onChange={(e) => setField('meetingLink', e.target.value)}
                  placeholder="https://meet.google.com/abc"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder="Virtual call / Office address"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Agenda, preparation details..."
                className={inputClass}
              />
            </div>

            {event && (
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={(e) => setField('status', e.target.value)} className={inputClass}>
                  {EVENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className={`${buttonBase} bg-slate-800 text-slate-300 hover:bg-slate-700`}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className={`${buttonBase} bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25`}
              >
                {saving ? 'Saving...' : event ? 'Save Changes' : 'Schedule Event'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}