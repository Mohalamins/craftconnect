import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo-icon.png'

export default function SubmitVerification() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [files, setFiles] = useState({
    id_document: null,
    cv: null,
    proof_of_work: null,
    extra_doc: null,
  })

  const [previews, setPreviews] = useState({})
  const [notes, setNotes] = useState('')
  const [existingSubmission, setExistingSubmission] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const docConfig = [
    {
      key: 'id_document',
      label: 'National ID or Passport',
      description: 'A clear photo or scan of your valid government-issued ID',
      required: true,
      icon: '🪪',
    },
    {
      key: 'cv',
      label: 'CV / Resume',
      description: 'Your most recent CV showing your work history and skills',
      required: true,
      icon: '📄',
    },
    {
      key: 'proof_of_work',
      label: 'Proof of Work Experience',
      description: 'Certificate, reference letter, or photos of past work',
      required: true,
      icon: '🏆',
    },
    {
      key: 'extra_doc',
      label: 'Additional Document',
      description: 'Any extra certificate, license, or supporting material',
      required: false,
      icon: '📎',
    },
  ]

  useEffect(() => {
    async function loadExistingSubmission() {
      if (!user) return

      const { data, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data) {
        setExistingSubmission(data)
        setNotes(data.notes || '')
      }
    }

    loadExistingSubmission()
  }, [user])

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((preview) => {
        if (preview && preview !== 'pdf' && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
    }
  }, [previews])

  function handleFileChange(key, e) {
    // ✅ FIX: Block file changes while pending or approved
    if (
      existingSubmission?.status === 'pending' ||
      existingSubmission?.status === 'approved'
    ) {
      return
    }

    const file = e.target.files[0]
    if (!file) return

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]

    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, WEBP, or PDF files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max size is 5MB.')
      return
    }

    if (
      previews[key] &&
      previews[key] !== 'pdf' &&
      previews[key].startsWith('blob:')
    ) {
      URL.revokeObjectURL(previews[key])
    }

    setFiles((prev) => ({ ...prev, [key]: file }))
    setPreviews((prev) => ({
      ...prev,
      [key]:
        file.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(file),
    }))
    setError('')
  }

  async function uploadFile(file, key) {
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${key}.${fileExt}`

    const { error } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, file, { upsert: true })

    if (error) throw error

    return filePath
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('You must be logged in to submit verification.')
      return
    }

    // ✅ FIX: Hard block on submit if pending or approved
    if (existingSubmission?.status === 'pending') {
      setError('Your documents are currently under review. Please wait.')
      return
    }

    if (existingSubmission?.status === 'approved') {
      setError('You are already verified. No resubmission needed.')
      return
    }

    const missingRequiredNow =
      !files.id_document && !existingSubmission?.id_document_url

    const missingCvNow =
      !files.cv && !existingSubmission?.cv_url

    const missingProofNow =
      !files.proof_of_work && !existingSubmission?.proof_of_work_url

    if (missingRequiredNow) {
      return setError('Please upload your National ID or Passport.')
    }

    if (missingCvNow) {
      return setError('Please upload your CV.')
    }

    if (missingProofNow) {
      return setError('Please upload proof of work experience.')
    }

    setLoading(true)

    try {
      const urls = {
        id_document: existingSubmission?.id_document_url || null,
        cv: existingSubmission?.cv_url || null,
        proof_of_work: existingSubmission?.proof_of_work_url || null,
        extra_doc: existingSubmission?.extra_doc_url || null,
      }

      for (const key of ['id_document', 'cv', 'proof_of_work', 'extra_doc']) {
        if (files[key]) {
          urls[key] = await uploadFile(files[key], key)
        }
      }

      const payload = {
        user_id: user.id,
        id_document_url: urls.id_document,
        cv_url: urls.cv,
        proof_of_work_url: urls.proof_of_work,
        extra_doc_url: urls.extra_doc,
        notes: notes.trim() || null,
        status: 'pending',
        admin_feedback: null,
        reviewed_at: null,
        submitted_at: new Date().toISOString(),
      }

      const { error: dbError } = await supabase
        .from('verification_documents')
        .upsert(payload, { onConflict: 'user_id' })

      if (dbError) throw dbError

      navigate('/artisan-dashboard')
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function renderFileStatus(key) {
    if (files[key]) {
      return <span className="text-green-500 text-lg flex-shrink-0">✅</span>
    }

    const existingMap = {
      id_document: existingSubmission?.id_document_url,
      cv: existingSubmission?.cv_url,
      proof_of_work: existingSubmission?.proof_of_work_url,
      extra_doc: existingSubmission?.extra_doc_url,
    }

    if (existingMap[key]) {
      return (
        <span className="text-brand-teal text-xs font-medium">
          Already uploaded
        </span>
      )
    }

    return null
  }

  // ✅ FIX: Determine if form should be locked
  const isLocked =
    existingSubmission?.status === 'pending' ||
    existingSubmission?.status === 'approved'

  // ✅ FIX: Dynamic button label
  function getButtonLabel() {
    if (loading) return 'Uploading...'
    if (existingSubmission?.status === 'approved') return 'Already Verified ✓'
    if (existingSubmission?.status === 'pending') return 'Under Review — Cannot Resubmit'
    if (existingSubmission?.status === 'rejected') return 'Resubmit Documents →'
    return 'Submit for Verification →'
  }

  return (
    <div className="min-h-screen bg-brand-light py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 text-center">
          <img
            src={logo}
            alt="CraftConnect"
            className="h-10 w-auto mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-brand-navy">
            Verification Documents
          </h2>
          <p className="text-brand-slate text-sm mt-1">
            Upload your documents so our admin team can verify your profile.
            This usually takes 24–48 hours.
          </p>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">
                ✓
              </div>
              <span className="text-xs text-brand-green font-medium">
                Profile
              </span>
            </div>
            <div className="w-8 h-0.5 bg-brand-green"></div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">
                2
              </div>
              <span className="text-xs text-brand-green font-medium">
                Documents
              </span>
            </div>
            <div className="w-8 h-0.5 bg-brand-border"></div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                  existingSubmission?.status === 'approved'
                    ? 'bg-brand-green text-white'
                    : 'bg-brand-border text-brand-slate'
                }`}
              >
                {existingSubmission?.status === 'approved' ? '✓' : '3'}
              </div>
              <span
                className={`text-xs font-medium ${
                  existingSubmission?.status === 'approved'
                    ? 'text-brand-green'
                    : 'text-brand-slate'
                }`}
              >
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* ✅ FIX: Status Banners */}
        {existingSubmission?.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex gap-3">
            <span className="text-xl flex-shrink-0">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-700">
                You are verified!
              </p>
              <p className="text-green-600 text-xs mt-1">
                Your documents have been approved. No further action needed.
              </p>
            </div>
          </div>
        )}

        {existingSubmission?.status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex gap-3">
            <span className="text-xl flex-shrink-0">⏳</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Documents Under Review
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Our admin team is reviewing your submission. You cannot make
                changes while under review. Usually takes 24–48 hours.
              </p>
            </div>
          </div>
        )}

        {existingSubmission?.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex gap-3">
            <span className="text-xl flex-shrink-0">❌</span>
            <div>
              <p className="text-sm font-semibold text-red-700">
                Submission Rejected
              </p>
              {existingSubmission.admin_feedback && (
                <p className="text-red-600 text-xs mt-1">
                  <strong>Admin feedback:</strong>{' '}
                  {existingSubmission.admin_feedback}
                </p>
              )}
              <p className="text-red-500 text-xs mt-1">
                Please fix the issues above and resubmit your documents.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Document Upload Cards */}
          {docConfig.map((doc) => (
            <div
              key={doc.key}
              className={`bg-white rounded-2xl shadow-sm p-5 ${
                isLocked ? 'opacity-70' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{doc.icon}</span>
                  <div>
                    <p className="font-semibold text-brand-navy text-sm">
                      {doc.label}
                      {doc.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                      {!doc.required && (
                        <span className="text-brand-slate font-normal ml-1 text-xs">
                          (optional)
                        </span>
                      )}
                    </p>
                    <p className="text-brand-slate text-xs mt-0.5">
                      {doc.description}
                    </p>
                  </div>
                </div>
                {renderFileStatus(doc.key)}
              </div>

              {/* Preview */}
              {previews[doc.key] && (
                <div className="mb-3 rounded-lg overflow-hidden border border-brand-border">
                  {previews[doc.key] === 'pdf' ? (
                    <div className="bg-brand-light p-3 flex items-center gap-2">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="text-sm font-medium text-brand-navy">
                          {files[doc.key]?.name}
                        </p>
                        <p className="text-xs text-brand-slate">PDF uploaded</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previews[doc.key]}
                      alt="Preview"
                      className="w-full max-h-40 object-contain bg-brand-light"
                    />
                  )}
                </div>
              )}

              {/* Upload Button — disabled when locked */}
              <label
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl py-3 text-center transition-all ${
                  isLocked
                    ? 'border-brand-border opacity-50 cursor-not-allowed'
                    : 'border-brand-border cursor-pointer hover:border-brand-green hover:bg-brand-light'
                }`}
              >
                <span className="text-brand-teal text-sm font-medium">
                  {files[doc.key] ? '🔄 Change file' : '⬆️ Upload file'}
                </span>
                <span className="text-brand-slate text-xs">
                  JPG, PNG, WEBP or PDF · Max 5MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileChange(doc.key, e)}
                  disabled={isLocked}
                  className="hidden"
                />
              </label>
            </div>
          ))}

          {/* Note to Admin */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-brand-navy mb-1">
              📝 Note to Admin
              <span className="text-brand-slate font-normal ml-1 text-xs">
                (optional)
              </span>
            </label>
            <p className="text-brand-slate text-xs mb-3">
              Any extra context about your experience or documents
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLocked}
              placeholder="e.g. I have 8 years of experience as a plumber in Istanbul. My ID is valid until 2028..."
              rows={3}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-brand-light border border-brand-border rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">🔒</span>
            <p className="text-brand-slate text-xs leading-relaxed">
              Your documents are stored securely and are only visible to our
              admin team for verification purposes. They will never be shared
              with clients.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/artisan-dashboard')}
              className="flex-1 border border-brand-border text-brand-slate rounded-xl py-3 font-medium text-sm hover:bg-brand-light transition-all"
            >
              Back to Dashboard
            </button>

            {/* ✅ FIX: Disabled when pending or approved */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="flex-1 bg-brand-green text-white rounded-xl py-3 font-semibold hover:bg-brand-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getButtonLabel()}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}