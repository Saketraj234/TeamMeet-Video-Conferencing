// Video Conference Page Updated
import React, { useEffect, useRef, useState, useCallback, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Mic, MicOff, Video, VideoOff, PhoneOff, Share, MessageSquare, 
    Users, Hand, Circle, 
    X, Check, Lock, Unlock, Copy, Pencil, Trash2, 
    Type, Shield, Info, Send, Wifi, WifiOff
} from 'lucide-react'

import server from '../environment'
import { AuthContext } from '../contexts/AuthContext'
import withAuth from '../utils/withAuth'

// Icon for Whiteboard
const WhiteboardIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

const RemoteVideo = ({ peer, name, status, handRaised, isHost, onRemove, isRemoteHost }) => {
    const videoRef = useRef()
    const [videoError, setVideoError] = useState(false)

    useEffect(() => {
        const handleStream = (stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                // Ensure attributes are set before playing
                videoRef.current.playsInline = true;
                videoRef.current.autoplay = true;
                
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.error("Remote video play error:", e);
                        // Autoplay might be blocked, we could show a "Click to play" button if needed
                    });
                }
            }
        };

        if (peer) {
            peer.on("stream", handleStream);
            if (peer.streams && peer.streams[0]) {
                handleStream(peer.streams[0]);
            }
        }
        return () => {
            if (peer) peer.off("stream", handleStream);
        };
    }, [peer, status?.video])

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='relative group aspect-video bg-gray-900 rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl transition-all hover:border-blue-500/50'
        >
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                onError={() => setVideoError(true)}
                className={`w-full h-full object-cover transition-opacity duration-500 ${(!status?.video || videoError) ? 'opacity-0' : 'opacity-100'}`}
            />
            {(!status?.video || videoError) && (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]'>
                    <div className='w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30'>
                        <span className='text-3xl md:text-4xl font-black text-blue-500 uppercase'>{name?.charAt(0)}</span>
                    </div>
                    {videoError && <p className='text-[10px] text-gray-500 mt-2'>Video Error</p>}
                </div>
            )}
            
            <div className='absolute bottom-3 left-3 md:bottom-6 md:left-6 flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 max-w-[85%]'>
                <div className={`w-2 h-2 rounded-full ${status?.video ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`} />
                <span className='text-[10px] md:text-xs font-bold text-white uppercase tracking-wider truncate'>{name || "User"} {isRemoteHost && "(Host)"}</span>
                {!status?.mic && <MicOff className='w-3.5 h-3.5 md:w-4 md:h-4 text-red-500' />}
            </div>

            {handRaised && (
                <div className='absolute top-3 right-3 md:top-4 md:right-4 bg-yellow-500 p-1.5 md:p-2 rounded-full shadow-lg animate-bounce'>
                    <Hand className='text-black w-3.5 h-3.5 md:w-4 md:h-4' />
                </div>
            )}

            {isHost && !isRemoteHost && (
                <button 
                    onClick={onRemove}
                    className='absolute top-3 right-3 md:top-4 md:right-4 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg'
                >
                    <X className='w-4 h-4' />
                </button>
            )}
        </motion.div>
    )
}

function VideoMeet() {
    const navigate = useNavigate()
    const location = useLocation()
    const url = window.location.href.split("/").pop()
    const { userData } = useContext(AuthContext)
    const WAITING_STATUS_KEY = `teammeet_waiting_${url}`
    const CREATOR_STATUS_KEY = `teammeet_creator_${url}`

    const getPersistedWaitingStatus = () => {
        try {
            const stored = localStorage.getItem(WAITING_STATUS_KEY)
            return stored === 'waiting' || stored === 'rejected' ? stored : 'none'
        } catch {
            return 'none'
        }
    }

    const getPersistedCreator = () => {
        try { return localStorage.getItem(CREATOR_STATUS_KEY) === '1' } catch { return false }
    }
    const setPersistedCreator = (v) => {
        try { v ? localStorage.setItem(CREATOR_STATUS_KEY, '1') : localStorage.removeItem(CREATOR_STATUS_KEY) } catch {}
    }
    if (location.state?.fromCreate === true) setPersistedCreator(true)

    const persistedWaiting = getPersistedWaitingStatus()
    const persistedCreator = getPersistedCreator()

    const [micOn, setMicOn] = useState(true)
    const micOnRef = useRef(true)
    const [videoOn, setVideoOn] = useState(true)
    const videoOnRef = useRef(true)
    const [showChat, setShowChat] = useState(false)
    const showChatRef = useRef(false)
    const [raiseHand, setRaiseHand] = useState(false)
    const [handsRaised, setHandsRaised] = useState({})
    const [isRecording, setIsRecording] = useState(false)
    const [isHost, setIsHost] = useState(false)
    const createdMeetingHere = (location.state?.fromCreate === true) || persistedCreator
    const fromJoinHere = location.state?.fromJoin === true
    const isHostRef = useRef(false)

    const effectiveInitialWaiting = (
        persistedWaiting === 'none' && fromJoinHere && !createdMeetingHere
            ? 'waiting'
            : persistedWaiting
    )
    const initialIsJoining = (
        persistedWaiting === 'none' && fromJoinHere && !createdMeetingHere
    )

    const shouldShowLobby = !createdMeetingHere && !fromJoinHere
    const [showLobby, setShowLobby] = useState(shouldShowLobby)
    const [permissions, setPermissions] = useState({ mic: true, video: true, chat: true, screenShare: true })
    const permissionsRef = useRef({ mic: true, video: true, chat: true, screenShare: true })
    const [notifications, setNotifications] = useState([])
    const lastNotifRef = useRef({})
    const [waitingStatus, setWaitingStatus] = useState(effectiveInitialWaiting)
    const [admissionRequests, setAdmissionRequests] = useState([])
    const [isLocked, setIsLocked] = useState(false)
    const [screenShareOn, setScreenShareOn] = useState(false)
    const [socketConnected, setSocketConnected] = useState(false)
    const [backendHealthy, setBackendHealthy] = useState(null)
    const [healthLatency, setHealthLatency] = useState(null)
    const backendHealthyRef = useRef(null)
    const reconnectingNotifRef = useRef(null)
    const [isJoining, setIsJoining] = useState(initialIsJoining)
    const isJoiningRef = useRef(initialIsJoining)
    const [showWhiteboard, setShowWhiteboard] = useState(false)
    const [showHostControls, setShowHostControls] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [showParticipantsModal, setShowParticipantsModal] = useState(false)
    const [messages, setMessages] = useState([])
    const [messageInput, setMessageInput] = useState("")
    const [whiteboardMode, setWhiteboardMode] = useState('pencil')
    const color = '#3b82f6'
    const lineWidth = 5
    const [isDrawing, setIsDrawing] = useState(false)
    const [textInputPos, setTextInputPos] = useState(null)
    const [textInputValue, setTextInputValue] = useState("")

    const socketRef = useRef()
    const localStreamRef = useRef()
    const localVideoRef = useRef()
    const peersRef = useRef([])
    const [peers, setPeers] = useState([])
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])
    const canvasRef = useRef(null)
    const canvasContainerRef = useRef(null)
    const isInitializingRef = useRef(false)

    // Sync refs with state
    useEffect(() => { micOnRef.current = micOn }, [micOn])
    useEffect(() => { videoOnRef.current = videoOn }, [videoOn])
    useEffect(() => { permissionsRef.current = permissions }, [permissions])
    useEffect(() => { showChatRef.current = showChat }, [showChat])
    useEffect(() => { isHostRef.current = isHost }, [isHost])
    useEffect(() => { isJoiningRef.current = isJoining }, [isJoining])
    useEffect(() => { backendHealthyRef.current = backendHealthy }, [backendHealthy])

    useEffect(() => {
    if (fromJoinHere && !createdMeetingHere && getPersistedWaitingStatus() === 'none') {
        try { localStorage.setItem(WAITING_STATUS_KEY, 'waiting') } catch {}
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [fromJoinHere, createdMeetingHere, WAITING_STATUS_KEY])
    // Canvas resizing to prevent blurriness
    useEffect(() => {
        if (!showWhiteboard || !canvasRef.current || !canvasContainerRef.current) return;

        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = canvasContainerRef.current;
            if (!canvas || !container) return;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [showWhiteboard]);

    const addNotification = useCallback((text, options = {}) => {
        const { dedupKey, ttl = 5000 } = options
        const now = Date.now()
        if (dedupKey) {
            const last = lastNotifRef.current[dedupKey] || 0
            if (now - last < 10000) return
            lastNotifRef.current[dedupKey] = now
        }
        const id = now + Math.random()
        setNotifications(prev => [...prev, { id, text }])
        if (ttl > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }, ttl)
        }
        return id
    }, [])

    useEffect(() => {
        let cancelled = false
        let intervalId
        const SLOW_THRESHOLD = 6000
        const HARD_TIMEOUT = 10000

        const checkHealth = async () => {
            const start = Date.now()
            let ok = false
            let reached = false
            let latency = null
            const controller = new AbortController()
            const hardTimer = setTimeout(() => controller.abort(), HARD_TIMEOUT)

            const doFetch = async (path, mode = "cors") => {
                try {
                    const res = await fetch(`${server}${path}`, {
                        method: "GET",
                        mode,
                        signal: controller.signal,
                        cache: "no-store",
                        credentials: mode === "no-cors" ? "omit" : "same-origin"
                    })
                    return { ok: res.ok || mode === "no-cors", status: res.status }
                } catch (err) {
                    if (err?.name === "AbortError") throw err
                    return null
                }
            }

            try {
                let result = await doFetch("/health", "cors")
                if (!result) result = await doFetch("/", "cors")
                if (!result) result = await doFetch("/health", "no-cors")

                clearTimeout(hardTimer)
                reached = !!result
                ok = reached && result.ok
                latency = Date.now() - start
            } catch (err) {
                clearTimeout(hardTimer)
                reached = false
                ok = false
                if (err?.name === "AbortError") {
                    latency = SLOW_THRESHOLD + 1
                }
            }

            if (cancelled) return
            const wasHealthy = backendHealthyRef.current
            setBackendHealthy(reached ? ok : false)
            setHealthLatency(latency)

            if (wasHealthy === false && ok === true) {
                addNotification("Backend is back online.", { dedupKey: "back-online", ttl: 4000 })
            } else if (wasHealthy === true && ok === false) {
                addNotification("Backend connection lost.", { dedupKey: "unhealthy", ttl: 6000 })
            }
        }

        checkHealth()
        intervalId = setInterval(checkHealth, 25000)
        return () => {
            cancelled = true
            if (intervalId) clearInterval(intervalId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addNotification])

    const createPeer = useCallback((userToSignal, callerID, stream) => {
        const peer = new Peer({ initiator: true, trickle: true, stream })
        peer.on("signal", (signal) => {
            socketRef.current.emit("sending-signal", { userToSignal, callerID, signal })
        })
        return peer
    }, [])

    const addPeer = useCallback((incomingSignal, callerID, stream) => {
        const peer = new Peer({ initiator: false, trickle: true, stream })
        peer.on("signal", (signal) => {
            socketRef.current.emit("returning-signal", { signal, callerID })
        })
        peer.signal(incomingSignal)
        return peer
    }, [])

    useEffect(() => {
        if (showLobby) return
        try {
            const key = `teammeet_pending_${url}`
            const raw = localStorage.getItem(key)
            if (!raw) return
            const list = JSON.parse(raw)
            if (!Array.isArray(list) || list.length === 0) {
                localStorage.removeItem(key)
                return
            }
            setAdmissionRequests(prev => {
                const existing = new Set(prev.map(r => r.id))
                const merged = [...prev]
                list.forEach(item => {
                    if (item && item.id && !existing.has(item.id)) {
                        existing.add(item.id)
                        merged.push(item)
                    }
                })
                return merged
            })
        } catch {}
    }, [url, showLobby])

    useEffect(() => {
        if (isInitializingRef.current) return
        isInitializingRef.current = true

        const init = async () => {
            const token = localStorage.getItem("token")
            if (!token) {
                addNotification("Please login to join a meeting.")
                navigate("/auth")
                return
            }

            socketRef.current = io(server, {
                transports: ["polling", "websocket"],
                reconnection: true,
                reconnectionAttempts: 15,
                reconnectionDelay: 800,
                reconnectionDelayMax: 6000,
                timeout: 15000,
                auth: { token },
                autoConnect: false
            })

            const emitJoinCall = () => {
                const isCreator = createdMeetingHere || (location.state?.fromCreate === true) || persistedCreator
                socketRef.current.emit("join-call", url, userData.name, { isCreator: !!isCreator })
            }

            socketRef.current.on("connect", () => {
                setSocketConnected(true)
                if (reconnectingNotifRef.current) {
                    const nid = reconnectingNotifRef.current
                    reconnectingNotifRef.current = null
                    setNotifications(prev => prev.filter(n => n.id !== nid))
                }
                console.log("Socket connected:", socketRef.current.id)
                const restoredWaiting = getPersistedWaitingStatus()
                const persistedCreatorNow = getPersistedCreator()
                const shouldAutoJoin =
                    isJoiningRef.current ||
                    (location.state?.fromCreate === true) ||
                    createdMeetingHere ||
                    persistedCreatorNow ||
                    restoredWaiting === 'waiting' ||
                    !shouldShowLobby

                if (shouldAutoJoin) {
                    emitJoinCall()
                    isJoiningRef.current = false
                }

                const trySyncPending = (delay = 0) => {
                    setTimeout(() => {
                        if (socketRef.current?.connected) {
                            socketRef.current.emit("sync-pending-admissions", url)
                        }
                    }, delay)
                }
                trySyncPending(100)
                trySyncPending(1500)
            })

            socketRef.current.on("connect_error", (err) => {
                console.warn("Socket connect_error:", err?.message || err)
                setSocketConnected(false)
            })

            socketRef.current.on("reconnect_attempt", (attempt) => {
                console.log("Reconnect attempt:", attempt)
                if (!reconnectingNotifRef.current) {
                    const id = addNotification(`Reconnecting... (attempt ${attempt})`, { dedupKey: "reconnecting", ttl: 0 })
                    reconnectingNotifRef.current = id
                } else {
                    setNotifications(prev => prev.map(n =>
                        n.id === reconnectingNotifRef.current
                            ? { ...n, text: `Reconnecting... (attempt ${attempt})` }
                            : n
                    ))
                }
            })

            socketRef.current.on("connect_error", (err) => {
                console.error("Socket connection error:", err)
                const msg = err?.message || String(err)
                if (msg.includes("Authentication") || msg.includes("token") || msg.includes("Session")) {
                    localStorage.removeItem("token")
                    localStorage.removeItem("userData")
                    if (reconnectingNotifRef.current) {
                        const nid = reconnectingNotifRef.current
                        reconnectingNotifRef.current = null
                        setNotifications(prev => prev.filter(n => n.id !== nid))
                    }
                    addNotification(msg + " Redirecting to login...", { dedupKey: "auth-error" })
                    setTimeout(() => navigate("/auth"), 1500)
                }
            })

            socketRef.current.on("reconnect_failed", () => {
                console.error("All reconnection attempts failed")
                if (reconnectingNotifRef.current) {
                    const nid = reconnectingNotifRef.current
                    reconnectingNotifRef.current = null
                    setNotifications(prev => prev.filter(n => n.id !== nid))
                }
                addNotification("Server unreachable. Please check your connection and refresh.", { dedupKey: "reconnect-failed", ttl: 15000 })
            })

            socketRef.current.on("disconnect", (reason) => {
                setSocketConnected(false)
                if (reason === "io server disconnect" || reason === "io client disconnect") {
                    if (reconnectingNotifRef.current) {
                        const nid = reconnectingNotifRef.current
                        reconnectingNotifRef.current = null
                        setNotifications(prev => prev.filter(n => n.id !== nid))
                    }
                    addNotification("Disconnected from meeting.", { dedupKey: "disconnect" })
                }
            })

            // Now handle media
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            } catch (e) {
                console.warn("Could not get both video and audio, trying video only", e);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                    setMicOn(false)
                } catch (e2) {
                    console.warn("Could not get video, trying audio only", e2);
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                        setVideoOn(false)
                    } catch (e3) {
                        console.error("Could not get any media", e3);
                        addNotification("Camera/Mic access denied. You can still join and chat.")
                        stream = new MediaStream()
                    }
                }
            }
            
            localStreamRef.current = stream
            console.log("LOCAL STREAM:", stream, "Video tracks:", stream.getVideoTracks())
            // Ensure video track is enabled
            const videoTrack = stream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = true
                console.log("Local video track enabled:", videoTrack)
            }
            if (localVideoRef.current) {
                console.log("Local video ref already available!")
                localVideoRef.current.srcObject = stream
                localVideoRef.current.play().catch(e => console.error("Local video play error:", e))
            } else {
                console.log("Local video ref NOT available yet!")
            }

            // Set up video stream listener for local video (in case ref isn't ready yet)
            const updateLocalVideo = () => {
                if (localVideoRef.current && localStreamRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current
                    if (videoOn) {
                        localVideoRef.current.play().catch(e => console.error("Local video play error:", e))
                    }
                }
            }
            updateLocalVideo()

            // Socket listeners
            socketRef.current.on("waiting-for-admission", () => {
                try { localStorage.setItem(WAITING_STATUS_KEY, 'waiting') } catch {}
                setWaitingStatus('waiting')
                setIsJoining(false)
            })

            socketRef.current.on("admission-rejected", () => {
                try { localStorage.setItem(WAITING_STATUS_KEY, 'rejected') } catch {}
                setWaitingStatus('rejected')
                setIsJoining(false)
            })

            socketRef.current.on("admission-accepted", () => {
                try { localStorage.removeItem(WAITING_STATUS_KEY) } catch {}
                setWaitingStatus('none')
                setIsJoining(false)
                setShowLobby(false)
            })

            socketRef.current.on("admission-request", (data) => {
                setAdmissionRequests(prev => {
                    if (prev.find(r => r.id === data.id)) return prev;
                    const fresh = [...prev, data];
                    try {
                        const key = `teammeet_pending_${url}`;
                        localStorage.setItem(key, JSON.stringify(fresh));
                    } catch {}
                    return fresh;
                })
                addNotification(`Admission request from ${data.name}`)
            })

            socketRef.current.on("admission-cancelled", (id) => {
                setAdmissionRequests(prev => {
                    const next = prev.filter(request => request.id !== id)
                    try {
                        const key = `teammeet_pending_${url}`;
                        if (next.length === 0) localStorage.removeItem(key);
                        else localStorage.setItem(key, JSON.stringify(next));
                    } catch {}
                    return next;
                })
            })

            socketRef.current.on("all-users", (usersList) => {
                try { localStorage.removeItem(WAITING_STATUS_KEY) } catch {}
                setIsJoining(false)
                setShowLobby(false)
                const newPeers = []
                usersList.forEach(userDataFromServer => {
                    const peer = createPeer(userDataFromServer.id, socketRef.current.id, localStreamRef.current)
                    peersRef.current.push({ peerID: userDataFromServer.id, peer })
                    newPeers.push({ 
                        peerID: userDataFromServer.id, 
                        peer, 
                        name: userDataFromServer.name, 
                        status: userDataFromServer.status,
                        isRemoteHost: userDataFromServer.isHost
                    })
                })
                setPeers(newPeers)
            })

            socketRef.current.on("user-joined", (id, allConnections, usersList) => {
                const newUser = usersList.find(u => u.id === id);
                if (newUser && !peersRef.current.find(p => p.peerID === id)) {
                    const peer = addPeer(null, id, localStreamRef.current) // Peer will signal back
                    peersRef.current.push({ peerID: id, peer })
                    setPeers(prev => {
                        const existingIndex = prev.findIndex(p => p.peerID === id);
                        if (existingIndex !== -1) {
                            const updatedPeers = [...prev];
                            updatedPeers[existingIndex] = {
                                ...updatedPeers[existingIndex],
                                peer: peer,
                                name: newUser.name,
                                status: newUser.status,
                                isRemoteHost: newUser.isHost
                            };
                            return updatedPeers;
                        } else {
                            return [...prev, { 
                                peerID: id, 
                                peer, 
                                name: newUser.name, 
                                status: newUser.status,
                                isRemoteHost: newUser.isHost
                            }];
                        }
                    })
                    addNotification(`${newUser.name} joined the meeting`)
                }
            })

            socketRef.current.on("receiving-signal", (payload) => {
                // Check if peer already exists
                if (peersRef.current.find(p => p.peerID === payload.callerID)) return;
                const peer = addPeer(payload.signal, payload.callerID, localStreamRef.current)
                peersRef.current.push({ peerID: payload.callerID, peer })
                // Update the peers array to replace the placeholder with the actual peer
                setPeers(prev => {
                    const existingIndex = prev.findIndex(p => p.peerID === payload.callerID);
                    if (existingIndex !== -1) {
                        const updatedPeers = [...prev];
                        updatedPeers[existingIndex] = {
                            ...updatedPeers[existingIndex],
                            peer: peer
                        };
                        return updatedPeers;
                    } else {
                        // If not in array yet, add it
                        return [...prev, { peerID: payload.callerID, peer }];
                    }
                })
            })

            socketRef.current.on("receiving-returned-signal", (payload) => {
                const item = peersRef.current.find(p => p.peerID === payload.id)
                if (item) item.peer.signal(payload.signal)
            })

            socketRef.current.on("user-left", (id) => {
                const peerObj = peersRef.current.find(p => p.peerID === id)
                if (peerObj) peerObj.peer.destroy()
                const peers = peersRef.current.filter(p => p.peerID !== id)
                peersRef.current = peers
                setPeers(prev => prev.filter(p => p.peerID !== id))
            })

            socketRef.current.on("host-updated", (newHostId, usersList) => {
                // Update local isHost state
                setIsHost(socketRef.current.id === newHostId)
                isHostRef.current = socketRef.current.id === newHostId
                // Update all peers' isRemoteHost
                setPeers(prev => prev.map(p => {
                    const userFromList = usersList.find(u => u.id === p.peerID)
                    if (userFromList) {
                        return { ...p, isRemoteHost: userFromList.isHost }
                    }
                    return { ...p, isRemoteHost: p.peerID === newHostId }
                }))
            })

            socketRef.current.on("update-participants", (list) => {
                const me = list.find(u => u.id === socketRef.current.id)
                if (me) {
                    setIsHost(me.isHost)
                    isHostRef.current = me.isHost
                }
                // Sync peers array with server's user list
                setPeers(prev => {
                    const updatedPeers = []
                    list.forEach(user => {
                        if (user.id === socketRef.current.id) return // Skip self
                        const existingPeer = prev.find(p => p.peerID === user.id)
                        if (existingPeer) {
                            // Keep existing peer object, just update name/status/isRemoteHost
                            updatedPeers.push({
                                ...existingPeer,
                                name: user.name,
                                status: user.status,
                                isRemoteHost: user.isHost
                            })
                        } else {
                            // New user: add to array, but we'll wait for user-joined event to get the peer object
                            updatedPeers.push({
                                peerID: user.id,
                                peer: null,
                                name: user.name || "User",
                                status: user.status || { mic: true, video: true },
                                isRemoteHost: user.isHost
                            })
                        }
                    })
                    return updatedPeers
                })
            })

            socketRef.current.on("status-updated", (id, status) => {
                setPeers(prev => prev.map(p => p.peerID === id ? { ...p, status } : p))
            })

            socketRef.current.on("receive-message", (msg) => {
                setMessages(prev => [...prev, msg])
                if (!showChatRef.current) addNotification(`New message from ${msg.name}`)
            })

            socketRef.current.on("hand-toggled", (id, status) => {
                setHandsRaised(prev => ({ ...prev, [id]: status }))
            })

            socketRef.current.on("meeting-locked", (status) => {
                setIsLocked(status)
                addNotification(`Meeting is now ${status ? 'locked' : 'unlocked'}`)
            })

            socketRef.current.on("feature-toggled", (feature, status) => {
                setPermissions(prev => ({ ...prev, [feature]: status }))
                addNotification(`${feature} has been ${status ? 'enabled' : 'disabled'} by host.`)

                if (!isHostRef.current) {
                    if (feature === 'mic' && !status) {
                        if (localStreamRef.current?.getAudioTracks().length > 0) {
                            localStreamRef.current.getAudioTracks()[0].enabled = false
                            setMicOn(false)
                            socketRef.current.emit("update-status", url, { mic: false, video: videoOnRef.current })
                        }
                    }
                    if (feature === 'video' && !status) {
                        if (localStreamRef.current?.getVideoTracks().length > 0) {
                            localStreamRef.current.getVideoTracks()[0].enabled = false
                            setVideoOn(false)
                            socketRef.current.emit("update-status", url, { mic: micOnRef.current, video: false })
                        }
                    }
                }
            })

            socketRef.current.on("mute-all", () => {
                if (localStreamRef.current?.getAudioTracks().length > 0) {
                    localStreamRef.current.getAudioTracks()[0].enabled = false
                    setMicOn(false)
                    socketRef.current.emit("update-status", url, { mic: false, video: videoOnRef.current })
                    addNotification("Host has muted everyone's audio.")
                }
            })

            socketRef.current.on("whiteboard-toggled", (status) => {
                setShowWhiteboard(status)
            })

            socketRef.current.on("whiteboard-data", (data) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (data.type === 'start') {
                    ctx.beginPath();
                    ctx.strokeStyle = data.color;
                    ctx.lineWidth = data.lineWidth;
                    ctx.moveTo(data.x * canvas.width, data.y * canvas.height);
                } else if (data.type === 'draw') {
                    ctx.lineTo(data.x * canvas.width, data.y * canvas.height);
                    ctx.stroke();
                } else if (data.type === 'text') {
                    ctx.font = `${data.lineWidth * 5}px Arial`;
                    ctx.fillStyle = data.color;
                    ctx.fillText(data.text, data.x * canvas.width, data.y * canvas.height);
                }
            })

            socketRef.current.on("whiteboard-cleared", () => {
                const canvas = canvasRef.current;
                if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            })

            socketRef.current.on("removed-from-meeting", () => {
                alert("You have been removed from the meeting by the host.")
                navigate("/home")
            })

            socketRef.current.connect()
        }

        init()

        return () => {
            peersRef.current.forEach(p => { if (p.peer && !p.peer.destroyed) p.peer.destroy() })
            peersRef.current = []
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop())
                localStreamRef.current = null
            }
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
            isInitializingRef.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, navigate, userData?.name, createPeer, addPeer])

    // Update local video whenever ref, stream, or videoOn changes
    useEffect(() => {
        const updateLocalVideo = () => {
            if (localVideoRef.current && localStreamRef.current) {
                console.log("Attaching local stream to video element!");
                localVideoRef.current.srcObject = localStreamRef.current;
                localVideoRef.current.playsInline = true;
                localVideoRef.current.muted = true;
                localVideoRef.current.autoPlay = true;
                
                const playPromise = localVideoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => console.log("Local video playing!"))
                        .catch(e => console.error("Local video play error:", e));
                }
            }
        };
        
        updateLocalVideo();
        
        // Try multiple times in case ref isn't ready yet
        const timeout1 = setTimeout(updateLocalVideo, 100);
        const timeout2 = setTimeout(updateLocalVideo, 300);
        const timeout3 = setTimeout(updateLocalVideo, 500);
        
        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
            clearTimeout(timeout3);
        };
    }, [videoOn, screenShareOn]);

    const toggleMic = () => {
        if (!isHost && !permissions.mic) {
            addNotification("Microphone is disabled by host.")
            return
        }
        if (localStreamRef.current?.getAudioTracks().length > 0) {
            const track = localStreamRef.current.getAudioTracks()[0]
            setMicOn(prev => {
                const newStatus = !prev
                track.enabled = newStatus
                if (socketRef.current) socketRef.current.emit("update-status", url, { mic: newStatus, video: videoOnRef.current })
                return newStatus
            })
        }
    }

    const toggleVideo = () => {
        if (!isHost && !permissions.video) {
            addNotification("Camera is disabled by host.")
            return
        }
        if (localStreamRef.current?.getVideoTracks().length > 0) {
            const track = localStreamRef.current.getVideoTracks()[0]
            setVideoOn(prev => {
                const newStatus = !prev
                track.enabled = newStatus
                if (socketRef.current) socketRef.current.emit("update-status", url, { mic: micOnRef.current, video: newStatus })
                return newStatus
            })
        }
    }

    const toggleRaiseHand = () => {
        const newStatus = !raiseHand
        setRaiseHand(newStatus)
        socketRef.current.emit("toggle-hand", url, newStatus)
    }

    const handleScreenShare = async () => {
        if (!permissions.screenShare && !isHost) {
            addNotification("Screen sharing is disabled by host.")
            return
        }
        if (screenShareOn) {
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            const videoTrack = camStream.getVideoTracks()[0]
            peersRef.current.forEach(p => p.peer.replaceTrack(localStreamRef.current.getVideoTracks()[0], videoTrack, localStreamRef.current))
            localStreamRef.current = camStream
            if (localVideoRef.current) localVideoRef.current.srcObject = camStream
            setScreenShareOn(false)
            socketRef.current.emit("update-status", url, { mic: micOn, video: videoOn })
            return
        }
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
            const videoTrack = screenStream.getVideoTracks()[0]
            peersRef.current.forEach(p => p.peer.replaceTrack(localStreamRef.current.getVideoTracks()[0], videoTrack, localStreamRef.current))
            if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
            setScreenShareOn(true)
            socketRef.current.emit("update-status", url, { mic: micOn, video: true })
            videoTrack.onended = () => handleScreenShare()
        } catch (err) {
            console.error("Screen share error:", err)
        }
    }

    const startRecording = async () => {
        try {
            addNotification("Select what to record:");
            
            // Ask user what to record
            const recordChoice = window.confirm("Click OK to record your screen, or Cancel to record your camera.");
            
            let stream;
            if (recordChoice) {
                // Record screen
                stream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: { cursor: "always" }, 
                    audio: true 
                });
            } else {
                // Record local camera + mic
                stream = localStreamRef.current;
                if (!stream) {
                    throw new Error("No local stream available.");
                }
            }

            // Try multiple mime types for better browser compatibility
            const mimeTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm',
                'video/mp4'
            ];

            let selectedMimeType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    break;
                }
            }

            if (!selectedMimeType) {
                throw new Error("No supported MIME type found for recording.");
            }

            mediaRecorderRef.current = new MediaRecorder(stream, { 
                mimeType: selectedMimeType 
            });
            recordedChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (e) => { 
                if (e.data && e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };
            
            mediaRecorderRef.current.onstop = () => {
                try {
                    const blob = new Blob(recordedChunksRef.current, { type: selectedMimeType });
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = downloadUrl;
                    a.download = `TeamMeet-Recording-${new Date().toISOString().split('T')[0]}-${Date.now()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(a);
                    addNotification("Recording saved successfully!");
                } catch (err) {
                    console.error("Error saving recording:", err);
                    addNotification("Failed to save recording.");
                }
            };
            
            mediaRecorderRef.current.onerror = (event) => {
                console.error("MediaRecorder error:", event);
                addNotification(`Recording error: ${event.message || 'Unknown error'}`);
            };
            
            // If recording screen, stop when user stops sharing
            if (recordChoice && stream.getVideoTracks()[0]) {
                stream.getVideoTracks()[0].onended = () => {
                    stopRecording();
                };
            }
            
            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
            addNotification("Recording started!");
        } catch (err) {
            console.error("Recording error:", err);
            let errorMsg = "Recording cancelled or failed.";
            if (err.name === 'NotAllowedError') {
                errorMsg = "Permission denied.";
            } else if (err.name === 'NotFoundError') {
                errorMsg = "No source selected.";
            }
            addNotification(errorMsg);
        }
    };

    const stopRecording = () => { 
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { 
            try {
                mediaRecorderRef.current.stop(); 
                // Stop all tracks in the recording stream
                if (mediaRecorderRef.current.stream) {
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                console.error("Error stopping recording:", err);
            }
            setIsRecording(false); 
        } 
    };

    const handleAdmissionResponse = (id, accepted) => {
        setAdmissionRequests(prev => {
            const next = prev.filter(req => req.id !== id);
            try {
                const key = `teammeet_pending_${url}`;
                if (next.length === 0) localStorage.removeItem(key);
                else localStorage.setItem(key, JSON.stringify(next));
            } catch {}
            return next;
        });
        if (socketRef.current) socketRef.current.emit("admission-response", id, url, accepted);
    };

    const removeParticipant = (id) => {
        if (isHost && socketRef.current) {
            socketRef.current.emit("remove-participant", url, id);
        }
    };

    const clearWhiteboard = () => {
        if (isHost && socketRef.current) {
            socketRef.current.emit("whiteboard-clear", url);
        }
    };

    const toggleWhiteboard = () => {
        if (!isHost) return;
        const newStatus = !showWhiteboard;
        setShowWhiteboard(newStatus);
        socketRef.current.emit("whiteboard-toggle", url, newStatus);
    };

    const toggleMeetingLock = () => {
        if (!isHost) return;
        const newStatus = !isLocked;
        setIsLocked(newStatus);
        socketRef.current.emit("toggle-meeting-lock", url, newStatus);
    };

    const togglePermission = (feature) => {
        if (!isHost) return;
        const newStatus = !permissions[feature];
        setPermissions(prev => ({ ...prev, [feature]: newStatus }));
        socketRef.current.emit("toggle-feature", url, feature, newStatus);
    };

    const muteAll = () => {
        if (!isHost) return;
        socketRef.current.emit("mute-all", url);
        addNotification("Everyone has been muted.");
    };

    const sendMessage = () => {
        if (messageInput.trim() === "" || !socketRef.current) return;
        socketRef.current.emit("send-message", messageInput, userData.name);
        setMessages(prev => [...prev, { name: userData.name, message: messageInput, id: socketRef.current.id }]);
        setMessageInput("");
    };

    const startDrawing = (e) => {
        if (!isHost) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);

        if (whiteboardMode === 'text') {
            setTextInputPos({ x, y });
            setTextInputValue("");
        } else {
            setIsDrawing(true);
            const ctx = canvas.getContext('2d');
            ctx.beginPath(); 
            ctx.strokeStyle = color; 
            ctx.lineWidth = lineWidth; 
            ctx.moveTo(x, y);
            socketRef.current?.emit("whiteboard-draw", url, { type: 'start', x: x / canvas.width, y: y / canvas.height, color, lineWidth });
        }
    };

    const draw = (e) => {
        if (!isDrawing || whiteboardMode === 'text') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y); 
        ctx.stroke();
        socketRef.current?.emit("whiteboard-draw", url, { type: 'draw', x: x / canvas.width, y: y / canvas.height, color, lineWidth });
    };

    const stopDrawing = () => { 
        setIsDrawing(false); 
    };

    const handleTextSubmit = () => {
        if (!textInputValue.trim() || !textInputPos || !isHost) {
            setTextInputPos(null);
            setTextInputValue("");
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.font = `${lineWidth * 5}px Arial`;
        ctx.fillStyle = color;
        ctx.fillText(textInputValue, textInputPos.x, textInputPos.y);
        socketRef.current?.emit("whiteboard-draw", url, { 
            type: 'text', 
            x: textInputPos.x / canvas.width, 
            y: textInputPos.y / canvas.height, 
            text: textInputValue, 
            color, 
            lineWidth 
        });
        setTextInputPos(null);
        setTextInputValue("");
    };

    const handleJoinMeeting = () => {
        isJoiningRef.current = true
        setIsJoining(true)
        try { localStorage.setItem(WAITING_STATUS_KEY, 'waiting') } catch {}
        setWaitingStatus('waiting')
        if (socketConnected && socketRef.current) {
            socketRef.current.emit("join-call", url, userData.name, { isCreator: createdMeetingHere || location.state?.fromCreate })
        }
    }

    const clearWaitingAndGoHome = () => {
        try { localStorage.removeItem(WAITING_STATUS_KEY) } catch {}
        setWaitingStatus('none')
        navigate("/home")
    }

    const handleCancelWaiting = () => {
        if (socketRef.current && socketConnected) {
            socketRef.current.emit("cancel-admission", url)
        }
        clearWaitingAndGoHome()
    }

    if (showLobby) {
        return (
            <div className='min-h-[100dvh] w-full bg-[#0a0a0a] flex items-center justify-center p-3 xs:p-4 md:p-6 font-sans relative overflow-hidden safe-x safe-y'>
                <div className='absolute top-0 left-0 w-full h-full pointer-events-none opacity-20'>
                    <div className='absolute -top-16 xs:-top-24 -left-16 xs:-left-24 w-48 xs:w-64 md:w-96 h-48 xs:h-64 md:h-96 bg-blue-600 rounded-full blur-[80px] md:blur-[120px]' />
                    <div className='absolute -bottom-16 xs:-bottom-24 -right-16 xs:-right-24 w-48 xs:w-64 md:w-96 h-48 xs:h-64 md:h-96 bg-indigo-600 rounded-full blur-[80px] md:blur-[120px]' />
                </div>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className='w-full max-w-lg bg-[#111]/80 border border-white/10 rounded-[2rem] xs:rounded-[2.5rem] md:rounded-[3rem] p-5 xs:p-6 sm:p-8 md:p-10 shadow-2xl relative z-10 backdrop-blur-3xl'
                >
                    <div className='flex flex-col items-center text-center space-y-6 md:space-y-8'>
                        {waitingStatus === 'waiting' ? (
                            <div className='w-full flex flex-col items-center gap-4 md:gap-6 bg-blue-600/10 p-6 md:p-8 rounded-[1.5rem] xs:rounded-[2rem] border border-blue-500/20'>
                                <div className='w-10 h-10 md:w-14 md:h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
                                <div className='space-y-1'>
                                    <p className='text-blue-400 font-bold text-sm md:text-lg'>Request Sent</p>
                                    <p className='text-gray-500 font-medium text-xs md:text-sm'>Waiting for the room creator to accept...</p>
                                </div>
                                <button onClick={handleCancelWaiting} className='text-[10px] xs:text-xs md:text-sm text-gray-400 hover:text-white underline transition-colors'>Cancel Request</button>
                            </div>
                        ) : waitingStatus === 'rejected' ? (
                            <div className='w-full flex flex-col items-center gap-4 md:gap-6 bg-red-600/10 p-6 md:p-8 rounded-[1.5rem] xs:rounded-[2rem] border border-red-500/20'>
                                <div className='p-3 md:p-4 bg-red-600/20 rounded-full'><X className='w-8 md:w-10 h-8 md:h-10 text-red-500' /></div>
                                <div className='space-y-1'>
                                    <p className='text-red-500 font-bold text-sm md:text-lg'>Request Denied</p>
                                    <p className='text-gray-500 font-medium text-xs md:text-sm'>Host has denied your request.</p>
                                </div>
                                <button onClick={clearWaitingAndGoHome} className='text-[10px] xs:text-xs md:text-sm text-gray-400 hover:text-white underline transition-colors'>Return to Home</button>
                            </div>
                        ) : (
                            <>
                                <p className='text-gray-500 font-medium text-sm md:text-base'>Hello <span className='text-blue-400 font-bold'>{userData?.name}</span>, press below to request joining.</p>
                                <div className='flex flex-col sm:flex-row gap-3 xs:gap-4 md:gap-5 items-center justify-center w-full'>
                                    <button onClick={clearWaitingAndGoHome} className='w-full sm:w-auto px-6 xs:px-8 md:px-12 py-3 xs:py-4 md:py-5 rounded-xl xs:rounded-2xl md:rounded-[1.5rem] bg-white/5 text-white font-bold text-[10px] xs:text-xs md:text-sm uppercase tracking-widest transition-all border border-white/10 active:scale-95 hover:bg-white/10 whitespace-nowrap'>Not Now</button>
                                    <button 
                                        onClick={handleJoinMeeting} 
                                        disabled={isJoining}
                                        className={`w-full sm:w-auto px-8 xs:px-10 md:px-16 py-3 xs:py-4 md:py-5 rounded-xl xs:rounded-2xl md:rounded-[1.5rem] font-bold text-[10px] xs:text-xs md:text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 whitespace-nowrap ${isJoining ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-blue-600/30'}`}
                                    >
                                        {isJoining ? 'Joining...' : 'Join Now'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className='h-screen-safe w-full bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden relative safe-x'>
            {/* Whiteboard Overlay */}
            <AnimatePresence>
                {showWhiteboard && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className='fixed inset-0 md:inset-4 z-[200] bg-[#1a1a1a] rounded-none md:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col'>
                        <div className='p-3 md:p-6 border-b border-white/5 flex justify-between items-center bg-white/5 flex-wrap gap-2 md:gap-4'>
                            <div className='flex items-center gap-2 md:gap-4'><div className='p-2 md:p-3 bg-blue-600/20 rounded-xl'><WhiteboardIcon className='w-4 h-4 md:w-6 md:h-6 text-blue-500' /></div><div className='hidden xs:block'><h3 className='text-xs md:text-xl font-bold'>Whiteboard</h3></div></div>
                            <div className='flex items-center gap-1.5 md:gap-4 ml-auto'>
                                <div className='flex items-center gap-1 md:gap-2 bg-black/20 p-1 md:p-2 rounded-lg border border-white/5'>
                                    <button onClick={() => setShowChat(!showChat)} className={`p-1.5 rounded-lg transition-all ${showChat ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}><MessageSquare className='w-3.5 h-3.5' /></button>
                                </div>
                                <div className='flex items-center gap-1 md:gap-2 bg-black/20 p-1 md:p-2 rounded-lg border border-white/5'>
                                    <button onClick={() => setWhiteboardMode('pencil')} className={`p-1.5 rounded-lg transition-all ${whiteboardMode === 'pencil' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}><Pencil className='w-3.5 h-3.5' /></button>
                                    <button onClick={() => setWhiteboardMode('text')} className={`p-1.5 rounded-lg transition-all ${whiteboardMode === 'text' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}><Type className='w-3.5 h-3.5' /></button>
                                </div>
                                {isHost && <button onClick={clearWhiteboard} className='p-1.5 md:p-3 bg-red-600/10 text-red-500 rounded-lg'><Trash2 className='w-3.5 h-3.5' /></button>}
                                <button onClick={toggleWhiteboard} className='p-1.5 md:p-3 hover:bg-white/5 rounded-lg'><X className='w-4 h-4 text-gray-400' /></button>
                            </div>
                        </div>
                        <div ref={canvasContainerRef} className='flex-1 relative bg-white/5 overflow-hidden'>
                            <canvas 
                                ref={canvasRef} 
                                onMouseDown={startDrawing} 
                                onMouseMove={draw} 
                                onMouseUp={stopDrawing} 
                                onMouseLeave={stopDrawing} 
                                onTouchStart={(e) => { 
                                    const touch = e.touches[0]; 
                                    startDrawing({ clientX: touch.clientX, clientY: touch.clientY }); 
                                }} 
                                onTouchMove={(e) => { 
                                    const touch = e.touches[0]; 
                                    draw({ clientX: touch.clientX, clientY: touch.clientY }); 
                                }} 
                                onTouchEnd={stopDrawing}
                                className='w-full h-full'
                            />
                            {textInputPos && (
                                <div 
                                    className='absolute flex gap-2'
                                    style={{ left: textInputPos.x, top: textInputPos.y - 30 }}
                                >
                                    <input
                                        type='text'
                                        autoFocus
                                        value={textInputValue}
                                        onChange={(e) => setTextInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleTextSubmit();
                                            if (e.key === 'Escape') {
                                                setTextInputPos(null);
                                                setTextInputValue("");
                                            }
                                        }}
                                        className='px-3 py-2 bg-black/60 border border-blue-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500'
                                        placeholder='Type text...'
                                    />
                                    <button 
                                        onClick={handleTextSubmit}
                                        className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold'
                                    >
                                        Add
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setTextInputPos(null);
                                            setTextInputValue("");
                                        }}
                                        className='px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-sm font-bold'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className='p-2 md:p-4 flex justify-between items-center bg-[#1a1a1a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[150] shrink-0'>
                <div className='flex items-center gap-2 md:gap-3 min-w-0 flex-wrap'>
                    <button onClick={() => setShowParticipantsModal(true)} className='flex items-center gap-2 bg-black/40 px-2 md:px-3 py-1.5 rounded-full border border-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 transition-all'>
                        <Users className='w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500' />
                        <span className='text-xs font-bold text-gray-300'>{peers.length + 1}</span>
                    </button>
                    <div className={`group relative flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 rounded-full border transition-all ${
                        socketConnected
                            ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
                            : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15 animate-pulse'
                    }`}>
                        {socketConnected ? (
                            <Wifi className='w-3 h-3 md:w-3.5 md:h-3.5 text-green-400' strokeWidth={2.5} />
                        ) : (
                            <WifiOff className='w-3 h-3 md:w-3.5 md:h-3.5 text-red-400' strokeWidth={2.5} />
                        )}
                        <span className={`hidden xs:inline text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                            socketConnected ? 'text-green-400' : 'text-red-400'
                        }`}>
                            {socketConnected ? 'Connected' : 'Connecting'}
                        </span>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            <div className="bg-[#111] border border-white/10 text-[10px] md:text-xs rounded-xl px-3 py-2 shadow-2xl whitespace-nowrap backdrop-blur-xl">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <span className="text-gray-500">Socket:</span>
                                    <span className={socketConnected ? 'text-green-400' : 'text-red-400'}>
                                        {socketConnected ? 'Live (admission requests work)' : 'Disconnected (requests will not arrive)'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`group relative flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 rounded-full border transition-all ${
                        backendHealthy === null
                            ? 'bg-amber-500/10 border-amber-500/20'
                            : backendHealthy
                                ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
                                : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15 animate-pulse'
                    }`}>
                        <span className={`relative flex w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
                            backendHealthy === null
                                ? 'bg-amber-400'
                                : backendHealthy
                                    ? 'bg-green-400'
                                    : 'bg-red-500'
                        }`}>
                            {backendHealthy === true && (
                                <span className='absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60'></span>
                            )}
                        </span>
                        <span className={`hidden xs:inline text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                            backendHealthy === null ? 'text-amber-400'
                                : backendHealthy ? 'text-green-400'
                                : 'text-red-400'
                        }`}>
                            {backendHealthy === null ? 'Checking' : backendHealthy ? 'Server OK' : 'Server Offline'}
                        </span>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            <div className="bg-[#111] border border-white/10 text-[10px] md:text-xs rounded-xl px-3 py-2 shadow-2xl whitespace-nowrap backdrop-blur-xl">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <span className="text-gray-500">Backend API:</span>
                                    <span className={backendHealthy ? 'text-green-400' : backendHealthy === false ? 'text-red-400' : 'text-amber-400'}>
                                        {backendHealthy === null ? 'Checking...' : backendHealthy ? 'Healthy' : 'Unreachable'}
                                    </span>
                                </div>
                                {healthLatency != null && backendHealthy && (
                                    <div className="flex items-center gap-2 text-gray-300 mt-1">
                                        <span className="text-gray-500">Latency:</span>
                                        <span className={`font-mono font-bold ${
                                            healthLatency < 200 ? 'text-green-400' : healthLatency < 600 ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                            {healthLatency} ms
                                        </span>
                                    </div>
                                )}
                                {backendHealthy === false && (
                                    <div className="flex items-center gap-2 text-gray-300 mt-1">
                                        <span className="text-gray-500">Tip:</span>
                                        <span className="text-gray-400">Deployed backend not reachable (CORS/URL). Admission still works if socket is Connected.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex items-center gap-1.5 md:gap-2'>
                    {isHost && (
                        <button 
                            onClick={() => setShowHostControls(true)} 
                            className='p-1.5 md:p-2 bg-blue-600/10 text-blue-500 rounded-lg border border-blue-500/20 hover:bg-blue-600/20 transition-all'
                        >
                            <Shield className='w-3.5 h-3.5 md:w-4 md:h-4' />
                        </button>
                    )}
                    {(isHost || createdMeetingHere) && <button onClick={() => setShowInviteModal(true)} aria-label='Share meeting link' className='flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-[10px] md:text-xs font-bold transition-all shadow-lg'><Share className='w-3 h-3 md:w-3.5 md:h-3.5' /><span>Share Link</span></button>}
                </div>
            </div>

            {/* Video Grid */}
            <div className='flex-1 overflow-hidden relative flex flex-col'>
                <div className='flex-1 overflow-y-auto p-2 md:p-6 flex flex-col items-center justify-center no-scrollbar'>
                    <div className={`grid gap-3 md:gap-6 w-full h-fit max-h-full content-center justify-center ${
                        peers.length === 0 ? 'grid-cols-1 max-w-2xl' : 
                        peers.length === 1 ? 'grid-cols-1 md:grid-cols-2 max-w-5xl' : 
                        peers.length === 2 ? 'grid-cols-1 md:grid-cols-3' :
                        'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    }`}>
                        <motion.div layout className='relative group aspect-video bg-gray-900 rounded-2xl md:rounded-[2rem] overflow-hidden border-2 border-blue-500/50 shadow-xl'>
                            <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-opacity duration-500 ${(!videoOn && !screenShareOn) ? 'opacity-0' : 'opacity-100'}`} />
                            {(!videoOn && !screenShareOn) && (
                                <div className='absolute inset-0 flex items-center justify-center bg-[#1a1a1a]'>
                                    <div className='w-20 h-20 md:w-32 md:h-32 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30'>
                                        <span className='text-3xl md:text-5xl font-black text-blue-500 uppercase'>{userData?.name?.charAt(0)}</span>
                                    </div>
                                </div>
                            )}
                            <div className='absolute bottom-3 left-3 md:bottom-6 md:left-6 flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 max-w-[85%]'>
                                <div className='w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]' />
                                <span className='text-[10px] md:text-xs font-bold text-white uppercase tracking-wider truncate'>{userData?.name || "User"} {isHost ? "(Host)" : "(You)"}</span>
                                {!micOn && <MicOff className='w-3.5 h-3.5 md:w-4 md:h-4 text-red-500' />}
                            </div>
                            {handsRaised[socketRef.current?.id] && (
                                <div className='absolute top-3 right-3 md:top-4 md:right-4 bg-yellow-500 p-1.5 md:p-2 rounded-full shadow-lg animate-bounce'>
                                    <Hand className='text-black w-3.5 h-3.5' />
                                </div>
                            )}
                        </motion.div>
                        {peers.map((p) => (
                            <RemoteVideo key={p.peerID} peer={p.peer} name={p.name} status={p.status} handRaised={handsRaised[p.peerID]} isHost={isHost} isRemoteHost={p.isRemoteHost} onRemove={() => removeParticipant(p.peerID)} />
                        ))}
                    </div>
                </div>

                {/* Chat Sidebar */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div 
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className='absolute right-0 top-0 bottom-0 w-full max-w-[350px] bg-[#111] border-l border-white/10 z-[180] flex flex-col shadow-2xl'
                        >
                            <div className='p-6 border-b border-white/5 flex justify-between items-center bg-white/5'>
                                <div className='flex items-center gap-3'>
                                    <MessageSquare className='w-5 h-5 text-blue-500' />
                                    <h3 className='text-lg font-bold'>Chat</h3>
                                </div>
                                <button onClick={() => setShowChat(false)} className='p-2 hover:bg-white/5 rounded-full transition-colors'>
                                    <X className='w-5 h-5 text-gray-400' />
                                </button>
                            </div>
                            
                            <div className='flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar'>
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.id === socketRef.current?.id ? 'items-end' : 'items-start'}`}>
                                        <div className='flex items-center gap-2 mb-1'>
                                            <span className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>{msg.name}</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.id === socketRef.current?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5'}`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div className='h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30'>
                                        <MessageSquare className='w-12 h-12' />
                                        <p className='text-xs font-medium'>No messages yet.<br/>Start the conversation!</p>
                                    </div>
                                )}
                            </div>

                            <div className='p-4 border-t border-white/5 bg-white/5'>
                                <div className='flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-2 focus-within:border-blue-500/50 transition-all'>
                                    <input 
                                        type="text" 
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        className='flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 outline-none'
                                    />
                                    <button 
                                        onClick={sendMessage}
                                        className='p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-90 shadow-lg'
                                    >
                                        <Send className='w-4 h-4' />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notifications */}
                <div className='fixed top-16 md:top-20 right-3 md:right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-[220px] md:max-w-[260px]'>
                    <AnimatePresence>
                        {notifications.map(n => {
                            const text = n.text || ""
                            const isReconnecting = text.startsWith("Reconnecting")
                            const isError = text.includes("error") || text.includes("unreachable") || text.includes("denied") || text.includes("Disconnected") || text.includes("Failed") || text.includes("Redirecting")
                            const isSuccess = text.includes("saved") || text.includes("copied") || text.includes("started") || text.includes("joined") || text.includes("muted") || text.includes("unlocked") || (text.includes("locked") && !text.includes("error"))
                            const bgClass = isReconnecting
                                ? "bg-amber-500/95 border-amber-400/30"
                                : isError
                                    ? "bg-red-500/95 border-red-400/30"
                                    : isSuccess
                                        ? "bg-emerald-500/95 border-emerald-400/30"
                                        : "bg-blue-600/95 border-blue-500/30"
                            const dotClass = isReconnecting ? "bg-white animate-pulse" : "bg-white"
                            const isPersistent = n.id === reconnectingNotifRef.current
                            return (
                                <motion.div
                                    key={n.id}
                                    layout
                                    initial={{ x: 60, opacity: 0, y: -10 }}
                                    animate={{ x: 0, opacity: 1, y: 0 }}
                                    exit={{ x: 60, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className={`backdrop-blur-xl text-white px-3.5 py-2 rounded-xl text-[10px] md:text-[11px] font-bold shadow-xl border flex items-center gap-2 pointer-events-auto ${bgClass}`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                                    <span className='flex-1 leading-snug break-words'>{text}</span>
                                    {isPersistent ? (
                                        <button
                                            onClick={() => {
                                                if (reconnectingNotifRef.current === n.id) {
                                                    reconnectingNotifRef.current = null
                                                }
                                                setNotifications(prev => prev.filter(x => x.id !== n.id))
                                            }}
                                            className='shrink-0 w-5 h-5 -my-0.5 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors'
                                        >
                                            <X className='w-3 h-3' />
                                        </button>
                                    ) : null}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Toolbar */}
            <div className='p-2 md:p-8 flex items-center justify-center relative z-[150] w-full shrink-0 bg-[#0a0a0a]/50 backdrop-blur-lg border-t border-white/5'>
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className='flex items-center gap-2 md:gap-4 bg-[#1a1a1a]/95 backdrop-blur-2xl px-4 md:px-8 py-3 md:py-4 rounded-3xl md:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-x-auto max-w-[98vw] md:max-w-full no-scrollbar'>
                    <div className='flex flex-col items-center gap-1.5 min-w-[55px]'><button onClick={toggleMic} className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 ${micOn ? 'bg-white/5 text-gray-300' : 'bg-red-600 text-white'} ${(!isHost && !permissions.mic) ? 'opacity-50' : ''}`}>{micOn ? <Mic className='w-5 h-5 md:w-6 md:h-6' /> : <MicOff className='w-5 h-5 md:w-6 md:h-6' />}</button><span className='text-[8px] md:text-[10px] font-bold uppercase text-gray-500'>{micOn ? "Mute" : "Unmute"}</span></div>
                    <div className='flex flex-col items-center gap-1.5 min-w-[55px]'><button onClick={toggleVideo} className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 ${videoOn ? 'bg-white/5 text-gray-300' : 'bg-red-600 text-white'} ${(!isHost && !permissions.video) ? 'opacity-50' : ''}`}>{videoOn ? <Video className='w-5 h-5 md:w-6 md:h-6' /> : <VideoOff className='w-5 h-5 md:w-6 md:h-6' />}</button><span className='text-[8px] md:text-[10px] font-bold uppercase text-gray-500'>{videoOn ? "Stop" : "Start"}</span></div>
                    <div className='h-8 w-[1px] bg-white/10 mx-1' />
                    <div className='flex flex-col items-center gap-1.5 min-w-[55px]'><button onClick={handleScreenShare} className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 ${screenShareOn ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300'}`}><Share className='w-5 h-5 md:w-6 md:h-6' /></button><span className='text-[8px] md:text-[10px] font-bold uppercase text-gray-500'>Share</span></div>
                    <div className='flex flex-col items-center gap-1.5 min-w-[55px]'><button onClick={toggleRaiseHand} className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 ${raiseHand ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-300'}`}><Hand className='w-5 h-5 md:w-6 md:h-6' /></button><span className='text-[8px] md:text-[10px] font-bold uppercase text-gray-500'>Hand</span></div>
                    <div className='flex flex-col items-center gap-1.5 min-w-[55px]'><button onClick={isRecording ? stopRecording : startRecording} className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-gray-300'}`}><Circle className='w-5 h-5 md:w-6 md:h-6' /></button><span className='text-[8px] md:text-[10px] font-bold uppercase text-gray-500'>Record</span></div>
                    <div className='flex flex-col items-center gap-1.5 min-w-[55px]'><button onClick={() => setShowChat(!showChat)} className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 ${showChat ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300'}`}><MessageSquare className='w-5 h-5 md:w-6 md:h-6' /></button><span className='text-[8px] md:text-[10px] font-bold uppercase text-gray-500'>Chat</span></div>
                    {isHost && <div className='flex flex-col items-center gap-1.5 min-w-[55px]'><button onClick={toggleWhiteboard} className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 ${showWhiteboard ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300'}`}><WhiteboardIcon className='w-5 h-5 md:w-6 md:h-6' /></button><span className='text-[8px] md:text-[10px] font-bold uppercase text-gray-500'>Board</span></div>}
                    <div className='h-8 w-[1px] bg-white/10 mx-1' />
                    <div className='flex flex-col items-center gap-1.5 min-w-[55px]'><button onClick={() => navigate("/home")} className='p-3 md:p-4 bg-red-600 text-white rounded-2xl transition-all active:scale-90 hover:bg-red-700 shadow-lg shadow-red-600/20'><PhoneOff className='w-5 h-5 md:w-6 md:h-6' /></button><span className='text-[8px] md:text-[10px] font-bold uppercase text-gray-500'>Leave</span></div>
                </motion.div>
            </div>
            
            {/* Waiting Overlay for fromJoin users */}
            <AnimatePresence>
                {waitingStatus !== 'none' && (
                    <motion.div
                        key="waiting-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 z-[250] flex items-center justify-center p-3 xs:p-4 md:p-6 bg-black/60 backdrop-blur-md font-sans safe-x safe-y'
                    >
                        <div className='absolute top-0 left-0 w-full h-full pointer-events-none opacity-20'>
                            <div className='absolute -top-16 xs:-top-24 -left-16 xs:-left-24 w-48 xs:w-64 md:w-96 h-48 xs:h-64 md:h-96 bg-blue-600 rounded-full blur-[80px] md:blur-[120px]' />
                            <div className='absolute -bottom-16 xs:-bottom-24 -right-16 xs:-right-24 w-48 xs:w-64 md:w-96 h-48 xs:h-64 md:h-96 bg-indigo-600 rounded-full blur-[80px] md:blur-[120px]' />
                        </div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='w-full max-w-lg bg-[#111]/90 border border-white/10 rounded-[2rem] xs:rounded-[2.5rem] md:rounded-[3rem] p-5 xs:p-6 sm:p-8 md:p-10 shadow-2xl relative z-10 backdrop-blur-3xl'
                        >
                            <div className='flex flex-col items-center text-center space-y-6 md:space-y-8'>
                                {waitingStatus === 'waiting' ? (
                                    <div className='w-full flex flex-col items-center gap-4 md:gap-6 bg-blue-600/10 p-6 md:p-8 rounded-[1.5rem] xs:rounded-[2rem] border border-blue-500/20'>
                                        <div className='w-10 h-10 md:w-14 md:h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
                                        <div className='space-y-2'>
                                            <p className='text-blue-400 font-bold text-sm md:text-lg'>Request Sent</p>
                                            <p className='text-gray-400 font-medium text-xs md:text-sm'>Waiting for the room creator to accept...</p>
                                        </div>
                                        <button onClick={handleCancelWaiting} className='text-[10px] xs:text-xs md:text-sm text-gray-400 hover:text-white underline transition-colors'>Cancel Request</button>
                                    </div>
                                ) : waitingStatus === 'rejected' ? (
                                    <div className='w-full flex flex-col items-center gap-4 md:gap-6 bg-red-600/10 p-6 md:p-8 rounded-[1.5rem] xs:rounded-[2rem] border border-red-500/20'>
                                        <div className='p-3 md:p-4 bg-red-600/20 rounded-full'><X className='w-8 md:w-10 h-8 md:h-10 text-red-500' /></div>
                                        <div className='space-y-2'>
                                            <p className='text-red-500 font-bold text-sm md:text-lg'>Request Denied</p>
                                            <p className='text-gray-400 font-medium text-xs md:text-sm'>Host has denied your request.</p>
                                        </div>
                                        <button onClick={clearWaitingAndGoHome} className='text-[10px] xs:text-xs md:text-sm text-gray-400 hover:text-white underline transition-colors'>Return to Home</button>
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admission Popup (Right Side Overlays) */}
            {admissionRequests.length > 0 && (
                <div className='fixed top-20 right-3 xs:right-4 md:right-6 z-[300] w-[85%] xs:w-[75%] sm:w-80 md:w-96 max-w-sm space-y-2 safe-top'>
                    <AnimatePresence>
                        {admissionRequests.map(req => (
                            <motion.div 
                                key={req.id} 
                                initial={{ x: 120, opacity: 0, scale: 0.9 }} 
                                animate={{ x: 0, opacity: 1, scale: 1 }} 
                                exit={{ x: 120, opacity: 0, scale: 0.9 }} 
                                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                                className='bg-[#111]/90 backdrop-blur-3xl border border-white/10 pl-3 pr-2 py-2.5 md:pl-4 md:pr-2.5 md:py-3 rounded-2xl md:rounded-3xl shadow-2xl shadow-black/50 flex items-center gap-2 md:gap-3'
                            >
                                <div className='flex items-center gap-2.5 md:gap-3 flex-1 min-w-0'>
                                    <div className='w-9 h-9 md:w-10 md:h-10 shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs md:text-sm font-black uppercase text-white shadow-lg shadow-blue-600/20 ring-2 ring-white/5'>
                                        {req.name?.charAt(0)}
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <h4 className='font-bold text-[11px] md:text-sm text-white truncate leading-tight'>{req.name}</h4>
                                        <p className='text-[9px] md:text-[11px] text-gray-400 font-medium truncate leading-tight'>wants to join</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleAdmissionResponse(req.id, false)} 
                                    className='shrink-0 p-2 md:p-2.5 bg-red-600/10 text-red-400 rounded-xl md:rounded-2xl hover:bg-red-600/20 active:scale-90 transition-all border border-red-500/10'
                                    title='Reject'
                                >
                                    <X className='w-3.5 h-3.5 md:w-4 md:h-4' strokeWidth={2.5} />
                                </button>
                                <button 
                                    onClick={() => handleAdmissionResponse(req.id, true)} 
                                    className='shrink-0 p-1.5 md:p-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl md:rounded-2xl hover:from-green-600 hover:to-emerald-700 active:scale-90 transition-all shadow-lg shadow-green-600/30'
                                    title='Accept'
                                >
                                    <Check className='w-3 h-3 md:w-3.5 md:h-3.5' strokeWidth={3} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Host Controls Modal */}
            <AnimatePresence>
                {showHostControls && (
                    <div className='fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#111] border border-white/10 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl'
                        >
                            <div className='p-6 border-b border-white/5 flex justify-between items-center bg-white/5'>
                                <div className='flex items-center gap-3'>
                                    <Shield className='w-5 h-5 text-blue-500' />
                                    <h3 className='text-lg font-bold'>Host Controls</h3>
                                </div>
                                <button onClick={() => setShowHostControls(false)} className='p-2 hover:bg-white/5 rounded-full transition-colors'>
                                    <X className='w-5 h-5 text-gray-400' />
                                </button>
                            </div>
                            <div className='p-6 space-y-6'>
                                <div className='space-y-4'>
                                    <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5'>
                                        <div className='flex items-center gap-3'>
                                            <div className={`p-2 rounded-lg ${isLocked ? 'bg-red-600/20 text-red-500' : 'bg-green-600/20 text-green-500'}`}>
                                                {isLocked ? <Lock className='w-5 h-5' /> : <Unlock className='w-5 h-5' />}
                                            </div>
                                            <div>
                                                <p className='font-bold text-sm'>Lock Meeting</p>
                                                <p className='text-xs text-gray-500'>New participants cannot join</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={toggleMeetingLock}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${isLocked ? 'bg-red-600' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isLocked ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <button 
                                        onClick={muteAll}
                                        className='w-full flex items-center justify-center gap-2 p-4 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-600/20 transition-all font-bold text-sm'
                                    >
                                        <MicOff className='w-4 h-4' /> Mute All Participants
                                    </button>
                                </div>

                                <div className='space-y-3'>
                                    <p className='text-[10px] font-black uppercase text-gray-500 tracking-widest'>Participant Permissions</p>
                                    <div className='grid grid-cols-2 gap-3'>
                                        {[
                                            { id: 'mic', label: 'Share Mic', icon: Mic },
                                            { id: 'video', label: 'Share Video', icon: Video },
                                            { id: 'chat', label: 'Send Messages', icon: MessageSquare },
                                            { id: 'screenShare', label: 'Share Screen', icon: Share }
                                        ].map(item => (
                                            <button 
                                                key={item.id}
                                                onClick={() => togglePermission(item.id)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${permissions[item.id] ? 'bg-blue-600/10 border-blue-600/30 text-blue-500' : 'bg-white/5 border-white/5 text-gray-500'}`}
                                            >
                                                <item.icon className='w-5 h-5' />
                                                <span className='text-[10px] font-bold'>{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className='fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#111] border border-white/10 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl'
                        >
                            <div className='p-6 border-b border-white/5 flex justify-between items-center bg-white/5'>
                                <div className='flex items-center gap-3'>
                                    <Share className='w-5 h-5 text-blue-500' />
                                    <h3 className='text-lg font-bold'>Share Link</h3>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className='p-2 hover:bg-white/5 rounded-full transition-colors'>
                                    <X className='w-5 h-5 text-gray-400' />
                                </button>
                            </div>
                            <div className='p-8 space-y-8'>
                                <div className='flex flex-col items-center text-center space-y-4'>
                                    <div className='p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20'>
                                        <Info className='w-8 h-8 text-blue-500' />
                                    </div>
                                    <div className='space-y-1'>
                                        <h4 className='text-xl font-black'>Share Meeting Link</h4>
                                        <p className='text-sm text-gray-500'>Anyone with this link can request to join</p>
                                    </div>
                                </div>

                                <div className='space-y-4'>
                                    <div className='p-5 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-3 group hover:border-blue-500/30 transition-all'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-[10px] font-black uppercase text-gray-500 tracking-widest'>Meeting ID</span>
                                            <div className='flex items-center gap-1.5'>
                                                <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse' />
                                                <span className='text-[10px] font-bold text-green-500 uppercase'>Active</span>
                                            </div>
                                        </div>
                                        <div className='flex items-center justify-between gap-4'>
                                            <code className='text-2xl font-black tracking-widest text-blue-400 truncate'>{url}</code>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(url); addNotification("Meeting ID copied!") }}
                                                className='p-3 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg'
                                            >
                                                <Copy className='w-5 h-5' />
                                            </button>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => { navigator.clipboard.writeText(window.location.href); addNotification("Full link copied!") }}
                                        className='w-full flex items-center justify-center gap-2 p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all font-bold shadow-xl shadow-blue-600/20 active:scale-95'
                                    >
                                        <Share className='w-5 h-5' /> Copy Joining Link
                                    </button>
                                </div>

                                <div className='p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3'>
                                    <Shield className='w-4 h-4 text-gray-500 shrink-0 mt-0.5' />
                                    <p className='text-[10px] text-gray-500 leading-relaxed'>
                                        Participants will wait in the lobby until you admit them. You can lock the meeting to prevent new join requests.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Participants Modal */}
            <AnimatePresence>
                {showParticipantsModal && (
                    <div className='fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#111] border border-white/10 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl'
                        >
                            <div className='p-6 border-b border-white/5 flex justify-between items-center bg-white/5'>
                                <div className='flex items-center gap-3'>
                                    <Users className='w-5 h-5 text-blue-500' />
                                    <h3 className='text-lg font-bold'>Participants ({peers.length + 1})</h3>
                                </div>
                                <button onClick={() => setShowParticipantsModal(false)} className='p-2 hover:bg-white/5 rounded-full transition-colors'>
                                    <X className='w-5 h-5 text-gray-400' />
                                </button>
                            </div>
                            <div className='p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar'>
                                {/* Local User */}
                                <div className='p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm font-black uppercase'>
                                            {userData?.name?.charAt(0)}
                                        </div>
                                        <div className='flex flex-col gap-0.5'>
                                            <span className='text-sm font-bold text-white'>{userData?.name || "User"}</span>
                                            <span className='text-[10px] text-gray-500 uppercase'>{isHost ? "Host" : "You"}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Peer Users */}
                                {peers.map((p) => (
                                    <div key={p.peerID} className='p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-sm font-black uppercase text-blue-500'>
                                                {p.name?.charAt(0)}
                                            </div>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='text-sm font-bold text-white'>{p.name || "User"}</span>
                                                <span className='text-[10px] text-gray-500 uppercase'>{p.isRemoteHost ? "Host" : "Participant"}</span>
                                            </div>
                                        </div>
                                        {isHost && !p.isRemoteHost && (
                                            <button 
                                                onClick={() => removeParticipant(p.peerID)}
                                                className='p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all'
                                                title='Remove participant'
                                            >
                                                <X className='w-4 h-4' />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default withAuth(VideoMeet)