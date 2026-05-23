import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Mic, MicOff, Video, VideoOff, PhoneOff, Share, MessageSquare, 
    Users, Hand, Circle, 
    X, Check, Lock, Unlock, Copy, Pencil, Trash2, 
    Type, Shield, Settings, Info, UserPlus, Send
} from 'lucide-react'

import server from '../environment'

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
                <span className='text-[10px] md:text-xs font-bold text-white uppercase tracking-wider truncate'>{name} {isRemoteHost && "(Host)"}</span>
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

export default function VideoMeet() {
    const navigate = useNavigate()
    const location = useLocation()
    const url = window.location.href.split("/").pop()
    const userData = JSON.parse(localStorage.getItem("userData")) || { name: "User" }

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
    const isHostRef = useRef(false)
    const [showLobby, setShowLobby] = useState(!location.state?.fromCreate)
    const [permissions, setPermissions] = useState({ mic: true, video: true, chat: true, screenShare: true })
    const permissionsRef = useRef({ mic: true, video: true, chat: true, screenShare: true })
    const [notifications, setNotifications] = useState([])
    const [waitingStatus, setWaitingStatus] = useState('none') // 'none', 'waiting', 'rejected'
    const [admissionRequests, setAdmissionRequests] = useState([])
    const [isLocked, setIsLocked] = useState(false)
    const [screenShareOn, setScreenShareOn] = useState(false)
    const [socketConnected, setSocketConnected] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const isJoiningRef = useRef(false)
    const [showWhiteboard, setShowWhiteboard] = useState(false)
    const [showHostControls, setShowHostControls] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [messages, setMessages] = useState([])
    const [messageInput, setMessageInput] = useState("")
    const [whiteboardMode, setWhiteboardMode] = useState('pencil')
    const color = '#3b82f6'
    const lineWidth = 5
    const [isDrawing, setIsDrawing] = useState(false)

    const socketRef = useRef()
    const localStreamRef = useRef()
    const localVideoRef = useRef()
    const peersRef = useRef([])
    const [peers, setPeers] = useState([])
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])
    const canvasRef = useRef(null)
    const isInitializingRef = useRef(false)

    // Sync refs with state
    useEffect(() => { micOnRef.current = micOn }, [micOn])
    useEffect(() => { videoOnRef.current = videoOn }, [videoOn])
    useEffect(() => { permissionsRef.current = permissions }, [permissions])
    useEffect(() => { showChatRef.current = showChat }, [showChat])
    useEffect(() => { isHostRef.current = isHost }, [isHost])
    useEffect(() => { isJoiningRef.current = isJoining }, [isJoining])

    const addNotification = useCallback((text) => {
        const id = Date.now()
        setNotifications(prev => [...prev, { id, text }])
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }, 5000)
    }, [])

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
        if (isInitializingRef.current) return
        isInitializingRef.current = true

        const init = async () => {
            // Initialize socket with better options for faster connection
            socketRef.current = io(server, {
                transports: ["websocket"],
                reconnectionAttempts: 5,
                timeout: 10000
            })

            socketRef.current.on("connect", () => {
                setSocketConnected(true)
                console.log("Socket connected:", socketRef.current.id)
                // If user already clicked "Join Now" before connection, join now
                if (isJoiningRef.current) {
                    socketRef.current.emit("join-call", url, userData.name)
                }
            })

            socketRef.current.on("connect_error", (err) => {
                console.error("Socket connection error:", err)
                addNotification("Connection error. Retrying...")
            })

            socketRef.current.on("disconnect", () => {
                setSocketConnected(false)
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
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
                localVideoRef.current.play().catch(e => console.error("Local video play error:", e))
            }

            // Socket listeners
            socketRef.current.on("waiting-for-admission", () => {
                setWaitingStatus('waiting')
                setIsJoining(false)
            })

            socketRef.current.on("admission-rejected", () => {
                setWaitingStatus('rejected')
                setIsJoining(false)
            })

            socketRef.current.on("admission-accepted", () => {
                setWaitingStatus('none')
                setIsJoining(false)
                setShowLobby(false)
            })

            socketRef.current.on("admission-request", (data) => {
                if (isHostRef.current) {
                    setAdmissionRequests(prev => [...prev, data])
                    addNotification(`Admission request from ${data.name}`)
                }
            })

            socketRef.current.on("all-users", (users) => {
                setIsJoining(false)
                setShowLobby(false)
                const newPeers = []
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, localStreamRef.current)
                    peersRef.current.push({ peerID: userID, peer })
                    newPeers.push({ peerID: userID, peer })
                })
                setPeers(newPeers)
            })

            socketRef.current.on("user-joined", (payload) => {
                const peer = addPeer(payload.signal, payload.callerID, localStreamRef.current)
                peersRef.current.push({ peerID: payload.callerID, peer })
                setPeers(prev => [...prev, { peerID: payload.callerID, peer, name: payload.name, status: payload.status }])
                addNotification(`${payload.name} joined the meeting`)
            })

            socketRef.current.on("receiving-returned-signal", (payload) => {
                const item = peersRef.current.find(p => p.peerID === payload.id)
                if (item) item.peer.signal(payload.signal)
            })

            socketRef.current.on("user-disconnected", (id) => {
                const peerObj = peersRef.current.find(p => p.peerID === id)
                if (peerObj) peerObj.peer.destroy()
                const peers = peersRef.current.filter(p => p.peerID !== id)
                peersRef.current = peers
                setPeers(prev => prev.filter(p => p.peerID !== id))
            })

            socketRef.current.on("update-participants", (list) => {
                    const me = list.find(u => u.id === socketRef.current.id)
                    if (me) setIsHost(me.isHost)
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

    useEffect(() => {
        if (videoOn && localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch(e => console.error("Local video play error:", e));
        }
    }, [videoOn]);

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
            addNotification("Select screen/window and check 'Share System Audio' to record.");
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
            recordedChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `TeamMeet-${new Date().getTime()}.webm`;
                document.body.appendChild(a);
                a.click();
                stream.getTracks().forEach(t => t.stop());
                addNotification("Recording saved.");
            };
            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
        } catch (err) {
            console.error("Recording error:", err);
        }
    };

    const stopRecording = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); } };

    const handleAdmissionResponse = (id, accepted) => {
        setAdmissionRequests(prev => prev.filter(req => req.id !== id));
        socketRef.current.emit("admission-response", id, url, accepted);
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
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;
        if (!isHost) return;
        setIsDrawing(true);
        const ctx = canvas.getContext('2d');
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.moveTo(x * canvas.width, y * canvas.height);
        socketRef.current.emit("whiteboard-draw", url, { type: 'start', x, y, color, lineWidth });
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;
        const ctx = canvas.getContext('2d');
        ctx.lineTo(x * canvas.width, y * canvas.height); ctx.stroke();
        socketRef.current.emit("whiteboard-draw", url, { type: 'draw', x, y, color, lineWidth });
    };

    const stopDrawing = () => { setIsDrawing(false); socketRef.current.emit("whiteboard-draw", url, { type: 'end' }); };

    const handleJoinMeeting = () => {
        setIsJoining(true)
        if (socketConnected && socketRef.current) {
            socketRef.current.emit("join-call", url, userData.name)
        }
    }

    if (showLobby) {
        return (
            <div className='min-h-[100dvh] bg-[#0a0a0a] flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden'>
                <div className='absolute top-0 left-0 w-full h-full pointer-events-none opacity-20'>
                    <div className='absolute -top-24 -left-24 w-64 md:w-96 h-64 md:h-96 bg-blue-600 rounded-full blur-[100px] md:blur-[120px]' />
                    <div className='absolute -bottom-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-indigo-600 rounded-full blur-[100px] md:blur-[120px]' />
                </div>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className='w-full max-w-lg bg-[#111]/80 border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl relative z-10 backdrop-blur-3xl'
                >
                    <div className='flex flex-col items-center text-center space-y-8 md:space-y-10'>
                        <div className='p-5 md:p-6 bg-blue-600/10 rounded-[2rem] md:rounded-[2.5rem] border border-blue-500/20 shadow-inner'>
                            <Video className='w-12 h-12 md:w-16 md:h-16 text-blue-500' />
                        </div>
                        <div className='space-y-3 md:space-y-4'>
                            <h1 className='text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent'>Ready to join?</h1>
                            <p className='text-gray-500 font-medium text-sm md:text-base'>Hello <span className='text-blue-400 font-bold'>{userData?.name}</span>, the meeting is ready.</p>
                        </div>
                        <div className='w-full space-y-6 md:space-y-8'>
                            <div className='p-5 md:p-6 bg-black/40 border border-white/5 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center gap-3 group hover:border-blue-500/30 transition-all cursor-pointer' onClick={() => { navigator.clipboard.writeText(url); addNotification("Link copied!") }}>
                                <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                                <code className='text-lg md:text-xl font-black tracking-[0.15em] text-blue-400 truncate'>{url}</code>
                                <Copy className='w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors' />
                            </div>
                            <div className='flex flex-col sm:flex-row gap-4 md:gap-5 items-center justify-center pt-4 md:pt-6'>
                                {waitingStatus === 'waiting' ? (
                                    <div className='flex flex-col items-center gap-4 bg-blue-600/10 p-6 md:p-8 rounded-[2rem] w-full border border-blue-500/20'>
                                        <div className='w-10 h-10 md:w-12 md:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
                                        <p className='text-blue-400 font-bold text-sm md:text-base'>Waiting for host's approval...</p>
                                    </div>
                                ) : waitingStatus === 'rejected' ? (
                                    <div className='flex flex-col items-center gap-4 bg-red-600/10 p-6 md:p-8 rounded-[2rem] w-full border border-red-500/20'>
                                        <div className='p-3 bg-red-600/20 rounded-full'><X className='w-8 h-8 md:w-10 md:h-10 text-red-500' /></div>
                                        <p className='text-red-500 font-bold'>Host has denied your request.</p>
                                        <button onClick={() => navigate("/home")} className='text-xs md:text-sm text-gray-400 hover:text-white underline transition-colors'>Return to Home</button>
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={() => navigate("/home")} className='w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] bg-white/5 text-white font-bold text-xs md:text-sm uppercase tracking-widest transition-all border border-white/10 active:scale-95 hover:bg-white/10'>Not Now</button>
                                        <button 
                                            onClick={handleJoinMeeting} 
                                            disabled={isJoining}
                                            className={`w-full sm:w-auto px-10 md:px-16 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] font-bold text-xs md:text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isJoining ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'}`}
                                        >
                                            {isJoining ? 'Joining...' : 'Join Now'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className='h-[100dvh] bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden relative'>
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
                        <div className='flex-1 relative bg-white/5 overflow-hidden'><canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={(e) => { const touch = e.touches[0]; startDrawing({ clientX: touch.clientX, clientY: touch.clientY, stopPropagation: () => e.stopPropagation() }); }} onTouchMove={(e) => { const touch = e.touches[0]; draw({ clientX: touch.clientX, clientY: touch.clientY }); }} className='w-full h-full' /></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className='p-2 md:p-4 flex justify-between items-center bg-[#1a1a1a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[150] shrink-0'>
                <div className='flex items-center gap-2 md:gap-4 min-w-0'>
                    <div className='flex items-center gap-2 bg-black/40 px-2 md:px-3 py-1.5 rounded-full border border-white/5'>
                        <Users className='w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500' />
                        <span className='text-xs font-bold text-gray-300'>{peers.length + 1}</span>
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
                    <button onClick={() => setShowInviteModal(true)} className='flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-[10px] md:text-xs font-bold transition-all shadow-lg'><UserPlus className='w-3 h-3 md:w-3.5 md:h-3.5' /><span className='hidden xs:inline'>Invite Others</span></button>
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
                                <span className='text-[10px] md:text-xs font-bold text-white uppercase tracking-wider truncate'>{userData?.name} (You)</span>
                                {!micOn && <MicOff className='w-3.5 h-3.5 md:w-4 md:h-4 text-red-500' />}
                            </div>
                            {handsRaised[socketRef.current?.id] && (
                                <div className='absolute top-3 right-3 md:top-4 md:right-4 bg-yellow-500 p-1.5 md:p-2 rounded-full shadow-lg animate-bounce'>
                                    <Hand className='text-black w-3.5 h-3.5' />
                                </div>
                            )}
                        </motion.div>
                        {peers.map((p) => (
                            <RemoteVideo key={p.peerID} peer={p.peer} name={p.name} status={p.status} handRaised={handsRaised[p.peerID]} isHost={isHost} onRemove={() => removeParticipant(p.peerID)} />
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
                <div className='fixed top-20 right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-[200px]'>
                    <AnimatePresence>{notifications.map(n => <motion.div key={n.id} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} className='bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xl border border-white/10 flex items-center gap-2 pointer-events-auto'><div className='w-1 h-1 bg-white rounded-full' />{n.text}</motion.div>)}</AnimatePresence>
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
            
            {/* Admission Popup (Overlays) */}
            {isHost && admissionRequests.length > 0 && (
                <div className='fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm'>
                    <AnimatePresence>
                        {admissionRequests.map(req => (
                            <motion.div 
                                key={req.id} 
                                initial={{ y: 50, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                exit={{ y: 50, opacity: 0 }} 
                                className='bg-[#1a1a1a] border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 mb-2'
                            >
                                <div className='flex items-center gap-2'>
                                    <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold uppercase'>
                                        {req.name?.charAt(0)}
                                    </div>
                                    <h4 className='font-bold text-xs text-white truncate max-w-[100px]'>{req.name}</h4>
                                </div>
                                <div className='flex gap-1.5'>
                                    <button onClick={() => handleAdmissionResponse(req.id, false)} className='p-2 bg-red-600/10 text-red-500 rounded-lg'>
                                        <X className='w-3.5 h-3.5' />
                                    </button>
                                    <button onClick={() => handleAdmissionResponse(req.id, true)} className='p-2 bg-green-600/10 text-green-500 rounded-lg'>
                                        <Check className='w-3.5 h-3.5' />
                                    </button>
                                </div>
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
                                    <UserPlus className='w-5 h-5 text-blue-500' />
                                    <h3 className='text-lg font-bold'>Invite Others</h3>
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
        </div>
    )
}