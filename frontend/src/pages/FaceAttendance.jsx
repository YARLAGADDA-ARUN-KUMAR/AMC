import { useEffect, useRef, useState, useCallback } from 'react';
import { attendanceApi, subjectsApi, faceApi, studentsApi } from '../api/client';

export default function FaceAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [activeSession, setActiveSession] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [recognized, setRecognized] = useState([]);
  const [annotatedFrame, setAnnotatedFrame] = useState(null);
  const [faceCount, setFaceCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeTab, setActiveTab] = useState('capture');

  // Add student state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  // Registration state
  const [studentsList, setStudentsList] = useState([]);
  const [regStudentId, setRegStudentId] = useState('');
  const [regPhotos, setRegPhotos] = useState([]);
  const [regCapturing, setRegCapturing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const regVideoRef = useRef(null);
  const regCanvasRef = useRef(null);
  const regStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const activeSessionRef = useRef(null);
  const selectedSubjectRef = useRef(selectedSubject);

  // Keep refs in sync with state
  useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);
  useEffect(() => { selectedSubjectRef.current = selectedSubject; }, [selectedSubject]);

  useEffect(() => {
    subjectsApi.list().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubject(res.data[0].id);
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      faceApi.getStudents(selectedSubject).then((res) => {
        setTotalStudents(res.data.length);
      });
    }
  }, [selectedSubject]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleCreateSession = async () => {
    if (!selectedSubject) return;
    setCreating(true);
    try {
      const res = await attendanceApi.createSession({
        subject_id: selectedSubject,
        date: selectedDate,
        period: selectedPeriod,
        session_type: 'regular',
      });
      setActiveSession(res.data);
      setRecognized([]);
      setAnnotatedFrame(null);
      showSuccess('Session created! Click Start Capture to begin face recognition.');
    } catch (err) {
      showError(
        err.response?.data?.message || 'Failed to create session.',
      );
    } finally {
      setCreating(false);
    }
  };

  const captureAndSend = () => {
    const session = activeSessionRef.current;
    const subject = selectedSubjectRef.current;
    if (!videoRef.current || !canvasRef.current || !session) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.7);

    faceApi
      .recognize(base64, subject, session.id)
      .then((res) => {
        const data = res.data;
        setFaceCount(data.face_count);
        if (data.frame) {
          setAnnotatedFrame(data.frame);
        }
        if (data.recognized && data.recognized.length > 0) {
          setRecognized((prev) => {
            const existingIds = new Set(prev.map((r) => r.student_id));
            const newOnes = data.recognized.filter(
              (r) => !existingIds.has(r.student_id),
            );
            return [...prev, ...newOnes];
          });
        }
      })
      .catch((err) => console.error('Face recognition error:', err));
  };

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCapturing(true);

      // Send frames every 1.5 seconds
      intervalRef.current = setInterval(() => {
        captureAndSend();
      }, 1500);
    } catch {
      showError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCapture = useCallback(() => {
    setCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleSaveAttendance = async () => {
    if (!activeSession) return;
    setSaving(true);
    try {
      const res = await faceApi.saveAttendance(activeSession.id);
      showSuccess(res.data.message);
      stopCapture();
    } catch {
      showError('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.9) return 'text-emerald-400';
    if (conf >= 0.8) return 'text-amber-400';
    return 'text-red-400';
  };

  // --- REGISTRATION FUNCTIONS ---
  const loadStudents = () => {
    if (selectedSubject) {
      faceApi.getStudents(selectedSubject).then((res) => {
        setStudentsList(res.data);
        if (res.data.length > 0 && !regStudentId) setRegStudentId(res.data[0].id);
      });
    }
  };

  useEffect(() => { if (activeTab === 'register') loadStudents(); }, [activeTab, selectedSubject]);

  const startRegCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      regStreamRef.current = stream;
      if (regVideoRef.current) {
        regVideoRef.current.srcObject = stream;
        regVideoRef.current.play();
      }
      setRegCapturing(true);
      setRegPhotos([]);
      setScanProgress(0);
    } catch {
      showError('Camera access denied.');
    }
  };

  const stopRegCamera = () => {
    if (regStreamRef.current) {
      regStreamRef.current.getTracks().forEach((t) => t.stop());
      regStreamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setRegCapturing(false);
    setScanning(false);
  };

  const startScan = () => {
    if (!regVideoRef.current || !regCanvasRef.current) return;
    setScanning(true);
    setRegPhotos([]);
    let count = 0;
    const maxFrames = 20; // 2 seconds total (100ms * 20)
    const captured = [];
    
    scanIntervalRef.current = setInterval(() => {
      if (!regVideoRef.current || !regCanvasRef.current) return;
      const video = regVideoRef.current;
      const canvas = regCanvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      
      captured.push(base64);
      count++;
      setScanProgress(Math.floor((count / maxFrames) * 100));

      if (count >= maxFrames) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        setScanning(false);
        setRegPhotos(captured);
      }
    }, 100);
  };

  const handleRegister = async () => {
    if (!regStudentId || regPhotos.length === 0) return;
    setRegistering(true);
    try {
      const res = await faceApi.registerFace(regStudentId, regPhotos);
      showSuccess(res.data.message);
      setRegPhotos([]);
      stopRegCamera();
      loadStudents();
    } catch (err) {
      showError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedSubject) return;
    const subjectObj = subjects.find(s => s.id === selectedSubject);
    if (!subjectObj) return;

    setAddingStudent(true);
    try {
      await studentsApi.create({
        name: newStudentName,
        email: newStudentEmail,
        roll_number: newStudentRoll,
        department_id: subjectObj.department_id,
        password: 'password123'
      });
      showSuccess('Student added successfully!');
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentRoll('');
      loadStudents();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!regStudentId) return;
    if (!window.confirm('Are you sure you want to completely delete this student?')) return;
    
    try {
      await studentsApi.delete(regStudentId);
      showSuccess('Student deleted successfully!');
      setRegStudentId('');
      loadStudents();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            Face Recognition Attendance
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-13">
            AI-powered attendance using webcam face detection
          </p>
        </div>
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium animate-fade-in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-1">
        <button
          onClick={() => setActiveTab('capture')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'capture'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📹 Capture Attendance
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'register'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🪪 Register Face
        </button>
      </div>

      {/* ========== CAPTURE TAB ========== */}
      {activeTab === 'capture' && (
        <>
          {/* Session Setup */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
              Session Configuration
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(Number(e.target.value))}
                  disabled={!!activeSession}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:opacity-60"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={!!activeSession}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  disabled={!!activeSession}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:opacity-60"
                >
                  {[1, 2, 3, 4, 5, 6].map((p) => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {!activeSession ? (
                  <button
                    onClick={handleCreateSession}
                    disabled={creating || !selectedSubject}
                    className="w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-200"
                  >
                    {creating ? 'Creating...' : 'Create Session'}
                  </button>
                ) : (
                  <div className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium text-center">
                    Session #{activeSession.id} Active
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera + Recognition */}
          {activeSession && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                  <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${capturing ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                      <span className="text-slate-300 text-sm font-medium">
                        {capturing ? 'Live Camera Feed' : 'Camera Offline'}
                      </span>
                    </div>
                    {capturing && (
                      <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                        {faceCount} face{faceCount !== 1 ? 's' : ''} detected
                      </span>
                    )}
                  </div>
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
                    <video ref={videoRef} className={`w-full h-full object-cover ${annotatedFrame && capturing ? 'hidden' : ''}`} muted playsInline />
                    {annotatedFrame && capturing && (
                      <img src={annotatedFrame} alt="Annotated feed" className="w-full h-full object-cover" />
                    )}
                    {!capturing && !annotatedFrame && (
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-slate-500 text-sm">Click Start Capture to begin</p>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="px-5 py-4 border-t border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {!capturing ? (
                        <button onClick={startCapture} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Start Capture
                        </button>
                      ) : (
                        <button onClick={stopCapture} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="1" />
                          </svg>
                          Stop Capture
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleSaveAttendance}
                      disabled={saving || recognized.length === 0}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {saving ? 'Saving...' : `Save Attendance (${recognized.length}/${totalStudents})`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recognized Students Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-800">Recognized</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{recognized.length} of {totalStudents} students</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <span className="text-emerald-600 text-sm font-bold">{recognized.length}</span>
                    </div>
                  </div>
                  <div className="px-5 pt-3">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: totalStudents > 0 ? `${(recognized.length / totalStudents) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[450px]">
                    {recognized.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-slate-400 text-sm">No students recognized yet</p>
                        <p className="text-slate-300 text-xs mt-1">Start capturing to detect faces</p>
                      </div>
                    ) : (
                      recognized.map((student) => (
                        <div key={student.student_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{student.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{student.roll_number}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-bold ${getConfidenceColor(student.confidence)}`}>
                              {(student.confidence * 100).toFixed(0)}%
                            </span>
                            <p className="text-[10px] text-slate-400">match</p>
                          </div>
                          <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!activeSession && (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Ready for Face Recognition</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                Configure the session above and click Create Session to start.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========== REGISTER TAB ========== */}
      {activeTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Camera + Capture */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="text-base font-semibold text-slate-800">Register Student Face</h2>
              <p className="text-sm text-slate-500">Select a student, open the camera, and click Start Scan to record a 2-second face video for high accuracy.</p>

              {/* Student Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Select Student</label>
                <div className="flex items-center gap-2">
                  <select
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(Number(e.target.value))}
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    {studentsList.length === 0 && <option value="">No students available</option>}
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roll_number}) {s.face_registered ? '✅' : ''}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={handleDeleteStudent}
                    disabled={!regStudentId}
                    className="px-3 py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 rounded-xl transition-colors border border-red-200 shadow-sm"
                    title="Delete Selected Student"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Camera */}
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
                  <video ref={regVideoRef} className="w-full h-full object-cover" muted playsInline />
                  {!regCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                      <p className="text-slate-500 text-sm">Click Open Camera below</p>
                    </div>
                  )}
                  <canvas ref={regCanvasRef} className="hidden" />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {!regCapturing ? (
                  <button onClick={startRegCamera} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all">
                    Open Camera
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={startScan} 
                      disabled={scanning || regPhotos.length > 0} 
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
                    >
                      {scanning ? `Scanning... ${scanProgress}%` : (regPhotos.length > 0 ? 'Video Captured ✅' : '🎥 Start Video Scan')}
                    </button>
                    <button onClick={stopRegCamera} disabled={scanning} className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 text-sm font-medium rounded-xl transition-all">
                      Close Camera
                    </button>
                  </>
                )}
              </div>

              {/* Progress Bar */}
              {scanning && (
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-emerald-500 transition-all duration-100" style={{ width: `${scanProgress}%` }} />
                </div>
              )}

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={registering || regPhotos.length === 0 || !regStudentId}
                className="w-full px-5 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200"
              >
                {registering ? 'Processing Video (Machine Learning)...' : 'Extract & Register Face'}
              </button>
            </div>
          </div>

          {/* Right: Add Student */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="text-base font-semibold text-slate-800">Add New Student</h2>
              <p className="text-sm text-slate-500">Create a new student to register their face. They will be assigned to the current subject's department.</p>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Roll Number (Optional)</label>
                <input
                  type="text"
                  value={newStudentRoll}
                  onChange={(e) => setNewStudentRoll(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  placeholder="e.g. CS2024001"
                />
              </div>

              <div className=" pt-2">
                <button
                  onClick={handleAddStudent}
                  disabled={addingStudent || !newStudentName || !newStudentEmail || !selectedSubject}
                  className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-200"
                >
                  {addingStudent ? 'Adding Student...' : 'Add Student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
