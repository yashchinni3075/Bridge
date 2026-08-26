import { useState } from 'react'
import { Mail, Phone, MapPin, Briefcase, CheckCircle2, Upload, Shield, Clock, FileText, Camera } from 'lucide-react'
import { investorProfile } from '../../data/investorDashboardData.js'

const profileDetails = {
  ...investorProfile,
  phone: '+91 98765 43210',
  location: 'Pune, Maharashtra',
  focus: 'FinTech, Healthcare, SaaS',
  verified: false,
}

const requiredDocs = [
  { id: 'pan', label: 'PAN Card', icon: FileText, description: 'Identity verification' },
  { id: 'aadhaar', label: 'Aadhaar Card', icon: FileText, description: 'Address & KYC' },
  { id: 'selfie', label: 'Selfie / Live Photo', icon: Camera, description: 'Liveness check' },
]

const optionalDocs = [
  { id: 'angel', label: 'Angel Investor Certificate', icon: Shield, description: 'For trust badge (optional)' },
  { id: 'sebi', label: 'SEBI Registration', icon: Shield, description: 'If registered (optional)' },
]

function InvestorProfile() {
  const [uploads, setUploads] = useState({})
  const [verificationStatus, setVerificationStatus] = useState('unverified')
  const [isEditing, setIsEditing] = useState(false)
  const [phone, setPhone] = useState(profileDetails.phone)
  const [location, setLocation] = useState(profileDetails.location)
  const [focus, setFocus] = useState(profileDetails.focus)

  const handleUpload = (docId, file) => {
    setUploads((prev) => ({ ...prev, [docId]: file }))
  }

  const allRequiredUploaded = requiredDocs.every((doc) => uploads[doc.id])

  const handleSubmit = () => {
    if (!allRequiredUploaded) return
    setVerificationStatus('pending')
  }

  return (
    <div className="space-y-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-gray-400">Your investor profile and preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
        <div className="flex items-center gap-4 mb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3157ff] text-xl font-bold text-white">
            {profileDetails.initials}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{profileDetails.name}</h2>
              {profileDetails.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  <Clock className="h-3 w-3" /> Unverified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">{profileDetails.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Email</p>
              <p className="text-sm font-medium text-white">{profileDetails.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
            <Phone className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Phone</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-white border-b border-white/20 focus:border-[#3157ff] focus:outline-none py-1"
                />
              ) : (
                <p className="text-sm font-medium text-white">{phone}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
            <MapPin className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Location</p>
              {isEditing ? (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-white border-b border-white/20 focus:border-[#3157ff] focus:outline-none py-1"
                />
              ) : (
                <p className="text-sm font-medium text-white">{location}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
            <Briefcase className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Focus Areas</p>
              {isEditing ? (
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. FinTech, Healthcare, SaaS"
                  className="w-full bg-transparent text-sm font-medium text-white border-b border-white/20 focus:border-[#3157ff] focus:outline-none py-1"
                />
              ) : (
                <p className="text-sm font-medium text-white">{focus}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 rounded-xl bg-[#3157ff] py-3 text-sm font-semibold text-white transition hover:bg-[#2447e8]"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setPhone(profileDetails.phone)
                setLocation(profileDetails.location)
                setFocus(profileDetails.focus)
              }}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-6 w-full rounded-xl bg-white/5 border border-white/10 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Verification Section */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3157ff]/15">
            <Shield className="h-5 w-5 text-[#5b8aff]" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white">Verification</h2>
            <p className="text-xs text-gray-400">Upload documents to get verified</p>
          </div>
        </div>

        {/* Status Banner */}
        {verificationStatus === 'pending' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
            <Clock className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-400">Verification Pending</p>
              <p className="text-xs text-amber-400/70">Your documents are under review. This may take 24-48 hours.</p>
            </div>
          </div>
        )}

        {/* Required Documents */}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Required Documents</p>
        <div className="space-y-3 mb-6">
          {requiredDocs.map((doc) => {
            const Icon = doc.icon
            const uploaded = uploads[doc.id]
            return (
              <label
                key={doc.id}
                className={`flex items-center gap-4 rounded-xl border p-4 transition cursor-pointer ${
                  uploaded
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  uploaded ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-gray-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{doc.label}</p>
                  <p className="text-xs text-gray-500">{doc.description}</p>
                </div>
                {uploaded ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> {uploaded.name}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                    <Upload className="h-4 w-4" /> Upload
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleUpload(doc.id, e.target.files[0])}
                />
              </label>
            )
          })}
        </div>

        {/* Optional Documents */}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Optional Documents</p>
        <div className="space-y-3 mb-6">
          {optionalDocs.map((doc) => {
            const Icon = doc.icon
            const uploaded = uploads[doc.id]
            return (
              <label
                key={doc.id}
                className={`flex items-center gap-4 rounded-xl border p-4 transition cursor-pointer ${
                  uploaded
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  uploaded ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-gray-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{doc.label}</p>
                  <p className="text-xs text-gray-500">{doc.description}</p>
                </div>
                {uploaded ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> {uploaded.name}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                    <Upload className="h-4 w-4" /> Upload
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleUpload(doc.id, e.target.files[0])}
                />
              </label>
            )
          })}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!allRequiredUploaded || verificationStatus === 'pending'}
          className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
            allRequiredUploaded && verificationStatus !== 'pending'
              ? 'bg-[#3157ff] text-white hover:bg-[#2447e8]'
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          {verificationStatus === 'pending' ? 'Verification in Progress...' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  )
}

export default InvestorProfile
