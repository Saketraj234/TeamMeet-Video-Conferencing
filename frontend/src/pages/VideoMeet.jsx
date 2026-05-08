import React, { useEffect, useRef, useState, useContext } from 'react'
import { io } from 'socket.io-client'
import Peer from 'simple-peer'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
    Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, 
    Users, Share, Hand, Send, X, Copy, Check, Circle, Shield, Lock, Sparkles,
    Square as WhiteboardIcon, Trash2, Type, Unlock, Pencil
} from 'lucide-react'
import server from '../environment'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../contexts/AuthContext'
import withAuth from '../utils/withAuth'

const RemoteVideo = ({ peer, id, name, isRemoteHost, handRaised, isHost, onRemove }) => {
    const videoRef = useRef()

    useEffect(() => {
        peer.on("stream", (stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        })
    }, [peer])

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className='relative group aspect-video bg-gray-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl transition-all hover:border-blue-500/50'
        >
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500' />
            
            <div className='absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10'>
                <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                <span className='text-[10px] font-bold text-gray-300 uppercase tracking-wider'>
                    {name} {isRemoteHost && "(Host)"}
                </span>
                {handRaised && (
                    <div className='flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/20 rounded-full border border-yellow-500/30'>
                        <Hand className='w-2.5 h-2.5 text-yellow-500' />
                        <span className='text-[8px] font-black text-yellow-500 uppercase'>Raised</span>
                    </div>
                )}
            </div>

            {isHost && (
                <button 
                    onClick={onRemove}
                    className='absolute top-4 right-4 p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg'
                    title="Remove participant"
                >
                    <X className='w-4 h-4' />
                </button>
            )}
        </motion.div>
    )
}

function VideoMeetComponent() {
    const { url } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const socketRef = useRef()
    const localVideoRef = useRef()
    const [peers, setPeers] = useState([])
    const peersRef = useRef([])
    const [participants, setParticipants] = useState([]) // Array of {id, name, isHost}
    const participantsRef = useRef([])
    const { userData } = useContext(AuthContext)
    const [micOn, setMicOn] = useState(true)
    const [videoOn, setVideoOn] = useState(true)
    const [showChat, setShowChat] = useState(false)
    const showChatRef = useRef(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState("")
    const [copied, setCopied] = useState(false)
    const [raiseHand, setRaiseHand] = useState(false)
    const [handsRaised] = useState({})
    const [isRecording, setIsRecording] = useState(false)
    const [isHost, setIsHost] = useState(false)
    const isHostRef = useRef(false)
    const [showLobby, setShowLobby] = useState(!location.state?.fromCreate)
    const [permissions, setPermissions] = useState({
        mic: true,
        video: true,
        chat: true,
        screenShare: true
    })
    const [showHostPanel, setShowHostPanel] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [currentFilter, setCurrentFilter] = useState('none')
    const [notifications, setNotifications] = useState([])
    const recordedChunksRef = useRef([])
    const mediaRecorderRef = useRef(null)
    const localStreamRef = useRef(null)
    const [, setStream] = useState(null)
    const [screenShareOn, setScreenShareOn] = useState(false)
    const [showWhiteboard, setShowWhiteboard] = useState(false)
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [color, setColor] = useState("#3b82f6")
    const [lineWidth, setLineWidth] = useState(3)
    const [whiteboardMode, setWhiteboardMode] = useState('pencil') // 'pencil' or 'text'
    const [isLocked, setIsLocked] = useState(false)
    const [admissionRequests, setAdmissionRequests] = useState([])
    const [waitingStatus, setWaitingStatus] = useState(null) // 'waiting', 'accepted', 'rejected'
    const [typingPos, setTypingPos] = useState(null)
    const [typingText, setTypingText] = useState("")

    // Sync showChatRef with showChat state
    useEffect(() => {
        showChatRef.current = showChat
    }, [showChat])

    /* const stopScreenShare = React.useCallback(() => {
        if (localStreamRef.current && screenShareOn) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) videoTrack.stop();
            
            // Switch back to camera
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(camStream => {
                    const camVideoTrack = camStream.getVideoTracks()[0];
                    peersRef.current[0]?.peer?.replaceTrack(
                        videoTrack,
                        camVideoTrack,
                        localStreamRef.current
                    );
                    
                    localStreamRef.current.removeTrack(videoTrack);
                    localStreamRef.current.addTrack(camVideoTrack);
                    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
                    setScreenShareOn(false);
                });
        }
    }, [screenShareOn]); */

    const createPeer = React.useCallback((userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        })

        peer.on("signal", (signal) => {
            socketRef.current.emit("sending-signal", { userToSignal, callerID, signal })
        })

        return peer
    }, [])

    const addPeer = React.useCallback((incomingSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", (signal) => {
            socketRef.current.emit("returning-signal", { signal, callerID })
        })

        peer.signal(incomingSignal)

        return peer
    }, [])

    const isInitializingRef = useRef(false)

    useEffect(() => {
        const init = async () => {
            if (isInitializingRef.current || localStreamRef.current) return;
            isInitializingRef.current = true;
            
            try {
                const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                localStreamRef.current = userStream
                setStream(userStream)
                if (localVideoRef.current) localVideoRef.current.srcObject = userStream

                socketRef.current = io(server)

                if (showLobby === false) {
                    socketRef.current.emit("join-call", url, userData.name)
                }

                socketRef.current.on("user-joined", (joinerId, clients, usersList, hostId) => {
                    setParticipants(usersList)
                    participantsRef.current = usersList
                    
                    const currentlyIsHost = hostId === socketRef.current.id
                    setIsHost(currentlyIsHost)
                    isHostRef.current = currentlyIsHost
                    
                    if (currentlyIsHost && joinerId === socketRef.current.id) {
                        setShowInviteModal(true)
                        addNotification("Welcome! You are the host of this meeting.")
                    }

                    if (joinerId === socketRef.current.id) return;

                    // Avoid duplicate peer creation
                    if (peersRef.current.find(p => p.peerID === joinerId)) return;

                    const joiner = usersList.find(u => u.id === joinerId)
                    addNotification(`${joiner?.name || 'A participant'} joined`)
                    
                    const peer = createPeer(joinerId, socketRef.current.id, userStream)
                    
                    const newPeerObj = {
                        peerID: joinerId,
                        peer,
                    }
                    peersRef.current.push(newPeerObj)
                    
                    setPeers(prev => {
                        if (prev.find(p => p.peerID === joinerId)) return prev;
                        return [...prev, newPeerObj];
                    })
                })

                socketRef.current.on("host-updated", (hostId, usersList) => {
                    setParticipants(usersList)
                    participantsRef.current = usersList
                    const currentlyIsHost = hostId === socketRef.current.id
                    setIsHost(currentlyIsHost)
                    isHostRef.current = currentlyIsHost
                    
                    const host = usersList.find(u => u.id === hostId)
                    addNotification(`Host updated: ${host?.name || 'Unknown'} is now the host`)
                })

                socketRef.current.on("receiving-signal", (data) => {
                    const peer = addPeer(data.signal, data.callerID, userStream)
                    const newPeerObj = {
                        peerID: data.callerID,
                        peer,
                    }
                    peersRef.current.push(newPeerObj)
                    setPeers(prev => [...prev, newPeerObj])
                })

                socketRef.current.on("receiving-returned-signal", (data) => {
                    const item = peersRef.current.find((p) => p.peerID === data.id)
                    if (item) {
                        item.peer.signal(data.signal)
                    }
                })

                socketRef.current.on("user-left", (id) => {
                    const peerObj = peersRef.current.find((p) => p.peerID === id)
                    if (peerObj) {
                        peerObj.peer.destroy()
                    }
                    const newPeers = peersRef.current.filter((p) => p.peerID !== id)
                    peersRef.current = newPeers
                    setPeers(newPeers)
                    addNotification("A participant left the meeting")
                })

                socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
                    setMessages((prev) => [...prev, { data, sender, socketIdSender }])
                    if (!showChatRef.current) {
                        addNotification(`New message from ${sender}`)
                    }
                })

                socketRef.current.on("feature-toggled", (feature, status) => {
                    setPermissions(prev => ({ ...prev, [feature]: status }))
                    addNotification(`${feature} has been ${status ? 'enabled' : 'disabled'} by host.`)
                })

                socketRef.current.on("mute-all", () => {
                    if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
                        localStreamRef.current.getAudioTracks()[0].enabled = false
                        setMicOn(false)
                        addNotification("Host has muted everyone's audio.")
                    }
                })

                socketRef.current.on("remove-user", (id) => {
                    if (socketRef.current.id === id) {
                        alert("You have been removed from the meeting by the host.")
                        navigate("/home")
                    }
                })

                socketRef.current.on("whiteboard-toggle", (status) => {
                    setShowWhiteboard(status)
                })

                socketRef.current.on("whiteboard-draw", (data) => {
                    if (canvasRef.current) {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        
                        ctx.strokeStyle = data.color;
                        ctx.lineWidth = data.lineWidth;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';

                        if (data.type === 'start') {
                            ctx.beginPath();
                            ctx.moveTo(data.x * canvas.width, data.y * canvas.height);
                        } else if (data.type === 'draw') {
                            ctx.lineTo(data.x * canvas.width, data.y * canvas.height);
                            ctx.stroke();
                        } else if (data.type === 'text') {
                            ctx.font = `${data.lineWidth * 5}px Arial`;
                            ctx.fillStyle = data.color;
                            ctx.fillText(data.text, data.x * canvas.width, data.y * canvas.height);
                        } else if (data.type === 'end') {
                            ctx.closePath();
                        }
                    }
                })

                socketRef.current.on("whiteboard-clear", () => {
                    if (canvasRef.current) {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                })

                socketRef.current.on("meeting-full", () => {
                    alert("This meeting is full. Max 100 participants allowed.")
                    navigate("/home")
                })

                socketRef.current.on("meeting-locked", () => {
                    alert("This meeting is locked by the host. You cannot join.")
                    navigate("/home")
                })

                socketRef.current.on("meeting-lock-status", (status) => {
                    console.log("Lock status received:", status);
                    setIsLocked(status)
                    addNotification(`Meeting has been ${status ? 'locked' : 'unlocked'} by host.`)
                })

                socketRef.current.on("waiting-for-admission", () => {
                    setWaitingStatus('waiting')
                })

                socketRef.current.on("admission-request", (id, name) => {
                    setAdmissionRequests(prev => {
                        if (prev.find(r => r.id === id)) return prev;
                        return [...prev, { id, name }];
                    })
                    addNotification(`Admission request from ${name}`)
                })

                socketRef.current.on("admission-accepted", () => {
                    setWaitingStatus('accepted')
                    setShowLobby(false)
                })

                socketRef.current.on("admission-rejected", () => {
                    setWaitingStatus('rejected')
                })
            } catch (err) {
                console.error("Initialization error:", err)
            }
        }
        init()

        return () => {
            peersRef.current.forEach(p => {
                if (p.peer && !p.peer.destroyed) p.peer.destroy()
            })
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
    }, [url, navigate, userData?.name, createPeer, addPeer, showLobby])

    const toggleMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks()[0].enabled = !micOn
            setMicOn(!micOn)
        }
    }

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks()[0].enabled = !videoOn
            setVideoOn(!videoOn)
        }
    }

    const handleSendMessage = () => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit("chat-message", message, userData.name)
            setMessage("")
        }
    }

    const copyUrl = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const toggleRaiseHand = () => {
        setRaiseHand(!raiseHand)
        socketRef.current.emit("raise-hand", url, !raiseHand)
    }

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        mediaRecorderRef.current = new MediaRecorder(stream)
        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunksRef.current.push(e.data)
        }
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `meeting-record-${Date.now()}.webm`
            a.click()
            recordedChunksRef.current = []
        }
        mediaRecorderRef.current.start()
        setIsRecording(true)
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const addNotification = (text) => {
        const id = Date.now()
        setNotifications(prev => [...prev, { id, text }])
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }, 5000)
    }

    const muteAllParticipants = () => {
        if (isHost) {
            socketRef.current.emit("mute-all", url)
            addNotification("You have muted everyone's audio.")
        }
    }

    const removeParticipant = (id) => {
        if (isHost) {
            socketRef.current.emit("remove-user", url, id)
        }
    }

    const toggleFeaturePermission = (feature) => {
        if (isHost) {
            const newStatus = !permissions[feature]
            setPermissions(prev => ({ ...prev, [feature]: newStatus }))
            socketRef.current.emit("toggle-feature", url, feature, newStatus)
            addNotification(`${feature.charAt(0).toUpperCase() + feature.slice(1)} has been ${newStatus ? 'enabled' : 'disabled'} for everyone.`)
        }
    }

    const startDrawing = (e) => {
        if (!isHost) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;

        if (whiteboardMode === 'text') {
            setTypingPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, rawX: x, rawY: y });
            setTypingText("");
            return;
        }

        setIsDrawing(true);
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(x * canvas.width, y * canvas.height);

        socketRef.current.emit("whiteboard-draw", url, {
            type: 'start',
            x, y, color, lineWidth
        });
    };

    const handleTypingSubmit = (e) => {
        if (e.key === 'Enter' && typingText.trim() !== "" && typingPos) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.font = `${lineWidth * 5}px Arial`;
            ctx.fillStyle = color;
            ctx.fillText(typingText, typingPos.rawX * canvas.width, typingPos.rawY * canvas.height);
            
            socketRef.current.emit("whiteboard-draw", url, {
                type: 'text',
                x: typingPos.rawX,
                y: typingPos.rawY,
                color,
                lineWidth,
                text: typingText.trim()
            });
            
            setTypingPos(null);
            setTypingText("");
        } else if (e.key === 'Escape') {
            setTypingPos(null);
            setTypingText("");
        }
    };

    const draw = (e) => {
        if (!isDrawing || !isHost) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;

        const ctx = canvas.getContext('2d');
        ctx.lineTo(x * canvas.width, y * canvas.height);
        ctx.stroke();

        socketRef.current.emit("whiteboard-draw", url, {
            type: 'draw',
            x, y, color, lineWidth
        });
    };

    const stopDrawing = () => {
        if (!isHost) return;
        setIsDrawing(false);
        socketRef.current.emit("whiteboard-draw", url, { type: 'end' });
    };

    const clearWhiteboard = () => {
        if (!isHost) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socketRef.current.emit("whiteboard-clear", url);
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

    const handleAdmissionResponse = (id, accepted) => {
        setAdmissionRequests(prev => prev.filter(req => req.id !== id));
        socketRef.current.emit("admission-response", id, url, accepted);
    };

    if (showLobby) {
        return (
            <div className='min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans relative overflow-hidden'>
                {/* Background Decorations */}
                <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20'>
                    <div className='absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px]' />
                    <div className='absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]' />
                </div>

                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className='w-full max-w-xl bg-[#111] border border-white/5 rounded-[3rem] p-12 shadow-2xl relative z-10 backdrop-blur-3xl'
                >
                    <div className='flex flex-col items-center text-center space-y-10'>
                        <motion.div 
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className='p-6 bg-blue-600/10 rounded-[2.5rem] border border-blue-500/20'
                        >
                            <Video className='w-16 h-16 text-blue-500' />
                        </motion.div>

                        <div className='space-y-4'>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h1 className='text-5xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent'>
                                    Ready to join?
                                </h1>
                                <p className='text-gray-500 font-medium'>Hello <span className='text-blue-400'>{userData?.name}</span>, your meeting is active.</p>
                            </motion.div>
                        </div>

                        <div className='w-full space-y-8'>
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className='space-y-4'
                            >
                                <p className='text-[10px] font-black uppercase tracking-[0.3em] text-gray-600'>Meeting Identity</p>
                                <div className='p-6 bg-black/40 border border-white/5 rounded-[1.5rem] flex items-center justify-center gap-3 group hover:border-blue-500/30 transition-all'>
                                    <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                                    <code className='text-xl font-black tracking-[0.2em] text-blue-400 group-hover:text-blue-300 transition-colors'>{url}</code>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className='flex flex-col sm:flex-row gap-5 items-center justify-center pt-6'
                            >
                                {waitingStatus === 'waiting' ? (
                                    <div className='flex flex-col items-center gap-4 bg-blue-600/10 p-6 rounded-3xl border border-blue-600/20 w-full'>
                                        <div className='w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
                                        <p className='text-blue-400 font-bold'>Waiting for host to let you in...</p>
                                    </div>
                                ) : waitingStatus === 'rejected' ? (
                                    <div className='flex flex-col items-center gap-4 bg-red-600/10 p-6 rounded-3xl border border-red-600/20 w-full'>
                                        <X className='w-12 h-12 text-red-500' />
                                        <p className='text-red-500 font-bold'>Host has denied your admission request.</p>
                                        <button onClick={() => navigate("/home")} className='text-sm text-gray-400 underline'>Go Back Home</button>
                                    </div>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => navigate("/home")}
                                            className='w-full sm:w-auto px-12 py-5 rounded-[1.5rem] bg-white/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 text-white font-black text-sm uppercase tracking-widest transition-all border border-white/10 active:scale-95'
                                        >
                                            Not Now
                                        </button>
                                        <button 
                                            onClick={() => {
                                                console.log("Join clicked, socket state:", socketRef.current?.connected);
                                                if (socketRef.current) {
                                                    socketRef.current.emit("join-call", url, userData.name)
                                                } else {
                                                    alert("Connection issue. Please refresh.")
                                                }
                                            }}
                                            className='w-full sm:w-auto px-16 py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:shadow-[0_25px_50px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:scale-95'
                                        >
                                            Join Meeting
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        </div>

                        <div className='pt-10 flex items-center justify-center gap-8 opacity-20'>
                            <div className='flex items-center gap-2'>
                                <Shield className='w-4 h-4' />
                                <span className='text-[8px] font-black uppercase tracking-[0.2em]'>Private Room</span>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Lock className='w-4 h-4' />
                                <span className='text-[8px] font-black uppercase tracking-[0.2em]'>Encrypted</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden'>
            {/* Whiteboard Overlay */}
            <AnimatePresence>
                {showWhiteboard && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className='fixed inset-4 z-[200] bg-[#1a1a1a] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col'
                    >
                        <div className='p-6 border-b border-white/5 flex justify-between items-center bg-white/5'>
                            <div className='flex items-center gap-4'>
                                <div className='p-3 bg-blue-600/20 rounded-2xl'>
                                    <WhiteboardIcon className='w-6 h-6 text-blue-500' />
                                </div>
                                <div>
                                    <h3 className='text-xl font-bold'>Collaborative Whiteboard</h3>
                                    <p className='text-[10px] text-gray-500 uppercase tracking-widest mt-0.5'>
                                        {isHost ? "You are presenting" : "Viewing Host's whiteboard"}
                                    </p>
                                </div>
                            </div>
                            
                            <div className='flex items-center gap-4'>
                                {isHost && (
                                    <>
                                        <div className='flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5'>
                                            <button 
                                                onClick={() => setWhiteboardMode('pencil')}
                                                className={`p-2 rounded-lg transition-all ${whiteboardMode === 'pencil' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                                                title="Pencil Mode"
                                            >
                                                <Pencil className='w-4 h-4' />
                                            </button>
                                            <button 
                                                onClick={() => setWhiteboardMode('text')}
                                                className={`p-2 rounded-lg transition-all ${whiteboardMode === 'text' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                                                title="Text Mode"
                                            >
                                                <Type className='w-4 h-4' />
                                            </button>
                                        </div>
                                        <div className='flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5'>
                                            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                                                <button 
                                                    key={c}
                                                    onClick={() => setColor(c)}
                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <div className='flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5'>
                                            <input 
                                                type="range" 
                                                min="1" 
                                                max="20" 
                                                value={lineWidth}
                                                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                                                className='w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600'
                                            />
                                        </div>
                                        <button 
                                            onClick={clearWhiteboard}
                                            className='p-3 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-xl transition-all border border-red-600/20'
                                            title="Clear All"
                                        >
                                            <Trash2 className='w-5 h-5' />
                                        </button>
                                    </>
                                )}
                                <div className='h-8 w-[1px] bg-white/10 mx-2' />
                                {isHost && (
                                    <button 
                                        onClick={toggleWhiteboard} 
                                        className='p-3 hover:bg-white/5 rounded-xl transition-all'
                                    >
                                        <X className='w-6 h-6 text-gray-400' />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className='flex-1 flex relative bg-white/5 overflow-hidden'>
                            {/* Left Side: Canvas */}
                            <div className='flex-1 relative cursor-crosshair'>
                                <canvas 
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    width={window.innerWidth * 0.75}
                                    height={window.innerHeight - 150}
                                    className='w-full h-full'
                                />
                                {isHost && typingPos && (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={typingText}
                                        onChange={(e) => setTypingText(e.target.value)}
                                        onKeyDown={handleTypingSubmit}
                                        onBlur={() => {
                                            // Only clear if the text is empty, otherwise let Enter handle it
                                            if (typingText.trim() === "") {
                                                setTypingPos(null);
                                                setTypingText("");
                                            }
                                        }}
                                        style={{
                                            position: 'absolute',
                                            left: typingPos.x,
                                            top: typingPos.y - (lineWidth * 2.5),
                                            color: color,
                                            fontSize: `${lineWidth * 5}px`,
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            fontFamily: 'Arial',
                                            minWidth: '200px',
                                            caretColor: color,
                                            zIndex: 1000,
                                            padding: 0,
                                            margin: 0,
                                            lineHeight: 1
                                        }}
                                    />
                                )}
                            </div>

                            {/* Right Side: Participants List */}
                            <div className='w-72 border-l border-white/10 bg-black/20 flex flex-col'>
                                <div className='p-4 border-b border-white/5 bg-white/5'>
                                    <h4 className='text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2'>
                                        <Users className='w-3.5 h-3.5' />
                                        In Meeting ({peers.length + 1})
                                    </h4>
                                </div>
                                <div className='flex-1 overflow-y-auto p-4 space-y-3'>
                                    {/* Me */}
                                    <div className='flex items-center gap-3 p-2 rounded-xl bg-blue-600/10 border border-blue-600/20'>
                                        <div className='w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold'>Me</div>
                                        <div className='flex flex-col min-w-0'>
                                            <span className='text-xs font-bold text-blue-400 truncate'>{userData?.name}</span>
                                            <span className='text-[8px] uppercase tracking-tighter text-blue-500/50 font-black'>{isHost ? "Host" : "Participant"}</span>
                                        </div>
                                    </div>
                                    {/* Others */}
                                    {participants.filter(u => u.id !== socketRef.current?.id).map((p) => (
                                        <div key={p.id} className='flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5'>
                                            <div className='w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold uppercase'>{p.name?.charAt(0)}</div>
                                            <div className='flex flex-col min-w-0'>
                                                <span className='text-xs font-bold text-gray-300 truncate'>{p.name}</span>
                                                <span className='text-[8px] uppercase tracking-tighter text-gray-500 font-black'>{p.isHost ? "Host" : "Participant"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className='p-4 border-t border-white/5 bg-black/40'>
                                    <div className='flex items-center justify-center gap-2 opacity-30'>
                                        <Shield className='w-3 h-3' />
                                        <span className='text-[8px] font-black uppercase tracking-[0.2em]'>Protected Session</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admission Requests Popup */}
            <div className='fixed top-24 right-6 z-[300] flex flex-col gap-3 w-full max-w-sm px-4'>
                <AnimatePresence>
                    {isHost && admissionRequests.map(req => (
                        <motion.div 
                            key={req.id}
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className='bg-[#1a1a1a] border border-white/10 p-5 rounded-3xl shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl'
                        >
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold uppercase'>
                                    {req.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className='text-xs font-black text-gray-400 uppercase tracking-widest'>Admission Request</p>
                                    <h4 className='font-bold text-sm text-white truncate max-w-[120px]'>{req.name}</h4>
                                </div>
                            </div>
                            <div className='flex gap-2'>
                                <button 
                                    onClick={() => handleAdmissionResponse(req.id, false)}
                                    className='p-2.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all'
                                >
                                    <X className='w-4 h-4' />
                                </button>
                                <button 
                                    onClick={() => handleAdmissionResponse(req.id, true)}
                                    className='p-2.5 bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white rounded-xl transition-all'
                                >
                                    <Check className='w-4 h-4' />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Notifications */}
            <div className='fixed top-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none'>
                <AnimatePresence>
                    {notifications.map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className='bg-white/10 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 min-w-[300px]'
                        >
                            <div className='w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]' />
                            <p className='text-xs font-bold text-gray-200'>{n.text}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Header */}
            <div className='p-4 flex justify-between items-center bg-[#1a1a1a]/80 backdrop-blur-md border-b border-white/5'>
                <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5'>
                        <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse' />
                        <span className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Live Session</span>
                    </div>
                    <div className='h-4 w-[1px] bg-white/10' />
                    <div className='flex items-center gap-2'>
                        <Users className='w-4 h-4 text-blue-500' />
                        <span className='text-sm font-bold text-gray-300'>{peers.length + 1} Participants</span>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    {isHost && (
                        <button 
                            onClick={toggleMeetingLock}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isLocked ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-green-600/10 text-green-500 border border-green-600/20 hover:bg-green-600/20'}`}
                            title={isLocked ? "Unlock Meeting" : "Lock Meeting"}
                        >
                            {isLocked ? <Lock className='w-3.5 h-3.5' /> : <Unlock className='w-3.5 h-3.5' />}
                            <span className='hidden lg:inline'>{isLocked ? 'Meeting Locked' : 'Lock Meeting'}</span>
                        </button>
                    )}

                    {isHost && (
                        <button 
                            onClick={() => setShowHostPanel(true)}
                            className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 border border-blue-500/20'
                        >
                            <Shield className='w-3.5 h-3.5' />
                            <span className='hidden md:inline'>Admin Controls</span>
                        </button>
                    )}
                    
                    {isHost && (
                        <button 
                            onClick={() => setShowInviteModal(true)}
                            className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 border border-blue-500/20'
                        >
                            <Share className='w-3.5 h-3.5' />
                            <span className='hidden md:inline'>Invite Others</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Video Grid */}
            <div className='flex-1 relative p-6 overflow-y-auto custom-scrollbar'>
                <div className={`grid gap-6 h-full w-full ${
                    peers.length === 0 ? 'grid-cols-1 max-w-4xl mx-auto' : 
                    peers.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                    {/* Local Video */}
                    <motion.div 
                        layout
                        className='relative group aspect-video bg-gray-900 rounded-[2rem] overflow-hidden border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.15)] transition-all'
                    >
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className={`w-full h-full object-cover ${currentFilter}`} 
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />
                        <div className='absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10'>
                            <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse' />
                            {!micOn && <MicOff className='w-3 h-3 text-red-500' />}
                            <span className='text-[10px] font-bold uppercase tracking-wider text-blue-400'>
                                {isHost ? "Host (You)" : "You"}
                            </span>
                            {raiseHand && (
                                <div className='flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/20 rounded-full border border-yellow-500/30'>
                                    <Hand className='w-2.5 h-2.5 text-yellow-500' />
                                    <span className='text-[8px] font-black text-yellow-500 uppercase'>Raised</span>
                                </div>
                            )}
                        </div>
                        
                        <div className='absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className='p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:bg-blue-600 transition-all'
                            >
                                <Sparkles className='w-4 h-4' />
                            </button>
                        </div>
                    </motion.div>

                    {/* Remote Videos */}
                    {peers.map((peerObj) => {
                        const participant = participants.find(u => u.id === peerObj.peerID)
                        return (
                            <RemoteVideo 
                                key={peerObj.peerID} 
                                peer={peerObj.peer} 
                                id={peerObj.peerID} 
                                name={participant?.name || 'Participant'}
                                isRemoteHost={participant?.isHost}
                                handRaised={handsRaised[peerObj.peerID]} 
                                isHost={isHost}
                                onRemove={() => removeParticipant(peerObj.peerID)}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Toolbar */}
            <div className='p-8 flex items-center justify-center relative'>
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className='flex items-center gap-4 bg-[#1a1a1a]/80 backdrop-blur-2xl px-8 py-4 rounded-[2.5rem] border border-white/5 shadow-2xl'
                >
                    <div className='flex flex-col items-center gap-1'>
                        <button 
                            onClick={toggleMic}
                            className={`p-4 rounded-[1.5rem] transition-all transform active:scale-95 ${micOn ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-red-600 text-white shadow-lg shadow-red-600/30'}`}
                        >
                            {micOn ? <Mic className='w-6 h-6' /> : <MicOff className='w-6 h-6' />}
                        </button>
                        <span className='text-[10px] font-bold text-gray-500 uppercase tracking-widest'>{micOn ? "Mute" : "Unmute"}</span>
                    </div>
                    
                    <div className='flex flex-col items-center gap-1'>
                        <button 
                            onClick={toggleVideo}
                            className={`p-4 rounded-[1.5rem] transition-all transform active:scale-95 ${videoOn ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-red-600 text-white shadow-lg shadow-red-600/30'}`}
                        >
                            {videoOn ? <Video className='w-6 h-6' /> : <VideoOff className='w-6 h-6' />}
                        </button>
                        <span className='text-[10px] font-bold text-gray-500 uppercase tracking-widest'>{videoOn ? "Stop" : "Start"}</span>
                    </div>

                    <div className='h-8 w-[1px] bg-white/10 mx-2' />

                    <button 
                        onClick={toggleRaiseHand}
                        className={`p-4 rounded-[1.5rem] transition-all transform active:scale-95 ${raiseHand ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        <Hand className='w-6 h-6' />
                    </button>

                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-4 rounded-[1.5rem] transition-all transform active:scale-95 ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        <Circle className={`w-6 h-6 ${isRecording ? 'fill-current' : ''}`} />
                    </button>

                    <button 
                        onClick={() => setShowChat(!showChat)}
                        className={`p-4 rounded-[1.5rem] transition-all transform active:scale-95 ${showChat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        <MessageSquare className='w-6 h-6' />
                    </button>

                    {isHost && (
                        <button 
                            onClick={toggleWhiteboard}
                            className={`p-4 rounded-[1.5rem] transition-all transform active:scale-95 ${showWhiteboard ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                            title="Whiteboard"
                        >
                            <WhiteboardIcon className='w-6 h-6' />
                        </button>
                    )}

                    <div className='h-8 w-[1px] bg-white/10 mx-2' />

                    <button 
                        onClick={() => navigate("/home")}
                        className='p-4 bg-red-600 hover:bg-red-700 text-white rounded-[1.5rem] transition-all transform active:scale-95 shadow-lg shadow-red-600/30'
                    >
                        <PhoneOff className='w-6 h-6' />
                    </button>
                </motion.div>
            </div>

            {/* Chat Sidebar */}
            <AnimatePresence>
                {showChat && (
                    <motion.div 
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        className='fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#111] border-l border-white/5 z-[150] flex flex-col shadow-2xl'
                    >
                        <div className='p-6 border-b border-white/5 flex items-center justify-between bg-white/5'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-blue-600/20 rounded-xl'>
                                    <MessageSquare className='w-5 h-5 text-blue-500' />
                                </div>
                                <h3 className='text-lg font-bold'>Messages</h3>
                            </div>
                            <button onClick={() => setShowChat(false)} className='p-2 hover:bg-white/5 rounded-xl transition-all'>
                                <X className='w-5 h-5 text-gray-500' />
                            </button>
                        </div>
                        
                        <div className='flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar'>
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx} 
                                    className={`flex flex-col ${msg.sender === userData.name ? 'items-end' : 'items-start'}`}
                                >
                                    <span className='text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2'>{msg.sender}</span>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                                        msg.sender === userData.name 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'
                                    }`}>
                                        {msg.data}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className='p-6 bg-white/5 border-t border-white/5'>
                            <div className='relative flex items-center gap-2'>
                                <input 
                                    type="text" 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder='Type a message...'
                                    className='w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-600 transition-all pr-14'
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    className='absolute right-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-all transform active:scale-95 shadow-lg'
                                >
                                    <Send className='w-4 h-4' />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admin Controls Panel */}
            <AnimatePresence>
                {showHostPanel && (
                    <div className='fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]'
                        >
                            <div className='p-8 border-b border-white/5 bg-white/5 flex justify-between items-center'>
                                <div className='flex items-center gap-4'>
                                    <div className='p-3 bg-blue-600/20 rounded-2xl'>
                                        <Shield className='w-6 h-6 text-blue-500' />
                                    </div>
                                    <h3 className='text-xl font-bold'>Admin Control Panel</h3>
                                </div>
                                <button onClick={() => setShowHostPanel(false)} className='p-2 hover:bg-white/5 rounded-xl transition-all'>
                                    <X className='w-5 h-5 text-gray-500' />
                                </button>
                            </div>

                            <div className='flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar'>
                                <div className='space-y-4'>
                                    <h4 className='text-xs font-black uppercase tracking-widest text-gray-500'>Meeting Permissions</h4>
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        {[
                                            { id: 'mic', label: 'Allow Microphone', icon: Mic },
                                            { id: 'video', label: 'Allow Camera', icon: Video },
                                            { id: 'chat', label: 'Allow Chat', icon: MessageSquare },
                                            { id: 'screenShare', label: 'Allow Sharing', icon: Share }
                                        ].map(feature => (
                                            <button 
                                                key={feature.id}
                                                onClick={() => toggleFeaturePermission(feature.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                    permissions[feature.id] 
                                                    ? 'bg-blue-600/10 border-blue-600/30 text-blue-400' 
                                                    : 'bg-white/5 border-white/5 text-gray-500'
                                                }`}
                                            >
                                                <div className='flex items-center gap-3'>
                                                    <feature.icon className='w-4 h-4' />
                                                    <span className='text-xs font-bold'>{feature.label}</span>
                                                </div>
                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${permissions[feature.id] ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                                    <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${permissions[feature.id] ? 'right-1' : 'left-1'}`} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className='space-y-4'>
                                    <h4 className='text-xs font-black uppercase tracking-widest text-gray-500'>Quick Actions</h4>
                                    <button 
                                        onClick={muteAllParticipants}
                                        className='w-full flex items-center justify-center gap-3 p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl border border-red-600/20 transition-all font-bold text-sm'
                                    >
                                        <MicOff className='w-4 h-4' />
                                        Mute Everyone
                                    </button>
                                </div>

                                <div className='space-y-4'>
                                    <h4 className='text-xs font-black uppercase tracking-widest text-gray-500'>Participants</h4>
                                    <div className='space-y-3'>
                                        {participants.map(p => (
                                            <div key={p.id} className='flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5'>
                                                <div className='flex items-center gap-3'>
                                                    <div className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center font-bold text-xs uppercase'>{p.name.charAt(0)}</div>
                                                    <span className='text-sm font-bold'>{p.name} {p.id === socketRef.current.id && "(You)"}</span>
                                                </div>
                                                {p.id !== socketRef.current.id && (
                                                    <button 
                                                        onClick={() => removeParticipant(p.id)}
                                                        className='p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all'
                                                    >
                                                        <PhoneOff className='w-4 h-4' />
                                                    </button>
                                                )}
                                            </div>
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
                    <div className='fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl text-center'
                        >
                            <div className='w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-600/20'>
                                <Share className='w-10 h-10 text-blue-500' />
                            </div>
                            <h3 className='text-2xl font-bold mb-2'>Invite Others</h3>
                            <p className='text-gray-500 text-sm mb-8'>Share this link with people you want in the meeting</p>
                            
                            <div className='flex flex-col gap-4'>
                                <div className='p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between gap-3'>
                                    <code className='text-xs text-blue-400 truncate flex-1'>{window.location.href}</code>
                                    <button 
                                        onClick={copyUrl}
                                        className={`p-2 rounded-xl transition-all ${copied ? 'bg-green-600 text-white' : 'bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white'}`}
                                    >
                                        {copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setShowInviteModal(false)}
                                    className='w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold text-gray-300 transition-all border border-white/5'
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Camera Filters Modal */}
            <AnimatePresence>
                {showFilters && (
                    <div className='fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl'
                        >
                            <h3 className='text-xl font-bold mb-6 flex items-center gap-3'>
                                <Sparkles className='text-blue-500' />
                                Visual Effects
                            </h3>
                            <div className='grid grid-cols-2 gap-3'>
                                {[
                                    { id: 'none', label: 'None' },
                                    { id: 'grayscale', label: 'B&W' },
                                    { id: 'sepia', label: 'Sepia' },
                                    { id: 'blur-sm', label: 'Soft Blur' },
                                    { id: 'brightness-125', label: 'Bright' },
                                    { id: 'contrast-125', label: 'Contrast' }
                                ].map(filter => (
                                    <button 
                                        key={filter.id}
                                        onClick={() => {
                                            setCurrentFilter(filter.id === 'none' ? '' : filter.id)
                                            setShowFilters(false)
                                        }}
                                        className={`p-4 rounded-2xl border text-xs font-bold transition-all ${
                                            (currentFilter === filter.id || (currentFilter === '' && filter.id === 'none'))
                                            ? 'bg-blue-600 border-blue-600 text-white' 
                                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default withAuth(VideoMeetComponent)
