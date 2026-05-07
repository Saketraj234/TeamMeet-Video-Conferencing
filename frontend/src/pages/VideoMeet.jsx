import React, { useEffect, useRef, useState, useContext } from 'react'
import { io } from 'socket.io-client'
import Peer from 'simple-peer'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
    Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, 
    Users, Share, Hand, Send, X, Copy, Check, Circle, ExternalLink, Shield, Lock, Sparkles,
    Square as WhiteboardIcon, Trash2, Type, Unlock, Pencil
} from 'lucide-react'
import server from '../environment'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../contexts/AuthContext'

import withAuth from '../utils/withAuth'

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
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [showParticipants, setShowParticipants] = useState(false)
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState("")
    const [copied, setCopied] = useState(false)
    const [raiseHand, setRaiseHand] = useState(false)
    const [handsRaised, setHandsRaised] = useState({})
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
    const isInitializingRef = useRef(false)
    const screenStreamRef = useRef()
    const [stream, setStream] = useState(null)
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

    const stopScreenShare = React.useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop())
            
            // Revert back to camera in all peers
            peersRef.current.forEach(p => {
                p.peer.replaceTrack(
                    screenStreamRef.current.getVideoTracks()[0],
                    localStreamRef.current.getVideoTracks()[0],
                    localStreamRef.current
                )
            })

            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
            setScreenShareOn(false)
        }
    }, [])

    const addNotification = (text) => {
        const id = Date.now()
        setNotifications(prev => [...prev, { id, text }])
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }, 3000)
    }

    const createPeer = React.useCallback((userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            if (socketRef.current) socketRef.current.emit("signal", userToSignal, signal)
        })

        return peer
    }, [])

    const addPeer = React.useCallback((incomingSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            if (socketRef.current) socketRef.current.emit("signal", callerID, signal)
        })

        peer.signal(incomingSignal)
        return peer
    }, [])

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

                socketRef.current.on("user-left", id => {
                    const leavingUser = participantsRef.current.find(u => u.id === id)
                    addNotification(`${leavingUser?.name || 'A participant'} has left`)
                    const peerObj = peersRef.current.find(p => p.peerID === id)
                    if (peerObj) {
                        peerObj.peer.destroy()
                    }
                    const updatedPeers = peersRef.current.filter(p => p.peerID !== id)
                    peersRef.current = updatedPeers
                    setPeers(updatedPeers)
                })

                socketRef.current.on("signal", (fromId, signal) => {
                    const peerObj = peersRef.current.find(p => p.peerID === fromId)
                    if (peerObj) {
                        if (peerObj.peer && !peerObj.peer.destroyed) {
                            try {
                                if (signal.renegotiate || signal.transceiverRequest) return;
                                peerObj.peer.signal(signal)
                            } catch (e) {
                                console.warn("Error signaling peer:", e);
                            }
                        }
                    } else {
                        const peer = addPeer(signal, fromId, userStream)
                        const newPeerObj = {
                            peerID: fromId,
                            peer,
                        }
                        peersRef.current.push(newPeerObj)
                        
                        setPeers(prev => {
                            if (prev.find(p => p.peerID === fromId)) return prev;
                            return [...prev, newPeerObj];
                        })
                    }
                })

                socketRef.current.on("chat-message", (data, sender, id) => {
                    setMessages(prev => [...prev, { data, sender, id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
                })

                socketRef.current.on("hand-raised", (id, status) => {
                    setHandsRaised(prev => ({ ...prev, [id]: status }))
                })

                socketRef.current.on("mute-all", () => {
                    if (localStreamRef.current) {
                        localStreamRef.current.getAudioTracks()[0].enabled = false
                        setMicOn(false)
                        addNotification("Host has muted everyone's audio.")
                    }
                })

                socketRef.current.on("feature-toggled", (feature, status) => {
                    if (!isHostRef.current) {
                        setPermissions(prev => ({ ...prev, [feature]: status }))
                        
                        if (feature === 'mic' && !status) {
                            if (localStreamRef.current) localStreamRef.current.getAudioTracks()[0].enabled = false
                            setMicOn(false)
                            addNotification("Host has disabled audio.")
                        }
                        if (feature === 'video' && !status) {
                            if (localStreamRef.current) localStreamRef.current.getVideoTracks()[0].enabled = false
                            setVideoOn(false)
                            addNotification("Host has disabled video.")
                        }
                        if (feature === 'chat' && !status) {
                            setShowChat(false)
                            addNotification("Host has disabled chat.")
                        }
                        if (feature === 'screenShare' && !status) {
                            stopScreenShare()
                            addNotification("Host has disabled screen sharing.")
                        }
                        if (status) {
                            addNotification(`Host has enabled ${feature === 'mic' ? 'audio' : feature}.`)
                        }
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
                    setIsLocked(status)
                    addNotification(`Meeting has been ${status ? 'locked' : 'unlocked'} by host.`)
                })

                socketRef.current.on("waiting-for-admission", () => {
                    setWaitingStatus('waiting')
                })

                socketRef.current.on("admission-request", (id, name) => {
                    setAdmissionRequests(prev => [...prev, { id, name }])
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
                console.error("Error accessing media devices:", err)
                if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    addNotification("Camera/Microphone is already in use by another application.")
                } else {
                    addNotification("Could not access camera/microphone. Please check permissions.")
                }
                // Don't leave user stuck if permissions denied
                isInitializingRef.current = false;
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
    }, [url, navigate, showLobby, stopScreenShare, userData?.name, createPeer, addPeer])

    const toggleScreenShare = async () => {
        if (!isHost && !permissions.screenShare) {
            addNotification("Screen sharing is disabled by host.")
            return
        }
        try {
            if (!screenShareOn) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
                screenStreamRef.current = screenStream
                
                // Replace stream in all peers
                peersRef.current.forEach(p => {
                    p.peer.replaceTrack(
                        stream.getVideoTracks()[0],
                        screenStream.getVideoTracks()[0],
                        stream
                    )
                })

                if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
                
                screenStream.getVideoTracks()[0].onended = () => {
                    stopScreenShare()
                }

                setScreenShareOn(true)
            } else {
                stopScreenShare()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const toggleMic = () => {
        if (!stream) return
        if (!isHost && !permissions.mic) {
            addNotification("Audio is disabled by host.")
            return
        }
        stream.getAudioTracks()[0].enabled = !micOn
        setMicOn(!micOn)
    }

    const toggleVideo = () => {
        if (!stream) return
        if (!isHost && !permissions.video) {
            addNotification("Video is disabled by host.")
            return
        }
        stream.getVideoTracks()[0].enabled = !videoOn
        setVideoOn(!videoOn)
    }

    const sendMessage = (e) => {
        e.preventDefault()
        if (!isHost && !permissions.chat) {
            addNotification("Chat is disabled by host.")
            return
        }
        if (message.trim()) {
            socketRef.current.emit("chat-message", message, "Me")
            setMessage("")
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const toggleHand = () => {
        const newStatus = !raiseHand
        setRaiseHand(newStatus)
        socketRef.current.emit("hand-raised", url, newStatus)
    }

    const startRecording = () => {
        recordedChunksRef.current = []
        const options = { mimeType: 'video/webm;codecs=vp9,opus' }
        const mediaRecorder = new MediaRecorder(stream, options)

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data)
            }
        }

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = `meeting-recording-${new Date().toISOString()}.webm`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
        setIsRecording(true)
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
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
            const text = prompt("Enter text to add to whiteboard:");
            if (text) {
                const ctx = canvas.getContext('2d');
                ctx.font = `${lineWidth * 5}px Arial`;
                ctx.fillStyle = color;
                ctx.fillText(text, x * canvas.width, y * canvas.height);
                
                socketRef.current.emit("whiteboard-draw", url, {
                    type: 'text',
                    x, y, color, lineWidth, text
                });
            }
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

    return (
        <div className='h-screen bg-[#111] flex flex-col text-white overflow-hidden font-sans relative'>
            {/* Host Control Panel Modal */}
            <AnimatePresence>
                {showHostPanel && isHost && (
                    <div className='fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] rounded-[2.5rem] border border-white/10 p-8 max-w-md w-full shadow-2xl relative'
                        >
                            <button onClick={() => setShowHostPanel(false)} className='absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full'>
                                <X className='w-5 h-5 text-gray-400' />
                            </button>
                            
                            <div className='flex items-center gap-4 mb-8'>
                                <div className='p-3 bg-blue-600/20 rounded-2xl'>
                                    <Shield className='w-8 h-8 text-blue-500' />
                                </div>
                                <div>
                                    <h3 className='text-xl font-bold'>Host Control Center</h3>
                                    <p className='text-xs text-gray-500 uppercase tracking-widest mt-1'>Manage participant permissions</p>
                                </div>
                            </div>

                            <div className='space-y-4'>
                                {[
                                    { id: 'mic', icon: Mic, label: 'Allow Microphone' },
                                    { id: 'video', icon: Video, label: 'Allow Video' },
                                    { id: 'chat', icon: MessageSquare, label: 'Allow Chat' },
                                    { id: 'screenShare', icon: Share, label: 'Allow Screen Share' }
                                ].map((item) => (
                                    <div key={item.id} className='flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5'>
                                        <div className='flex items-center gap-3'>
                                            <item.icon className={`w-5 h-5 ${permissions[item.id] ? 'text-blue-500' : 'text-gray-500'}`} />
                                            <span className='font-bold text-sm'>{item.label}</span>
                                        </div>
                                        <button 
                                            onClick={() => toggleFeaturePermission(item.id)}
                                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${permissions[item.id] ? 'bg-blue-600' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${permissions[item.id] ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={muteAllParticipants}
                                className='w-full mt-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2'
                            >
                                <MicOff className='w-5 h-5' />
                                Mute Everyone Now
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lobby / Join Modal */}
            <AnimatePresence>
                {showLobby && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 z-[250] flex items-center justify-center bg-[#050505]/90 backdrop-blur-2xl'
                    >
                        {/* Animated background elements */}
                        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                            <motion.div 
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 90, 0],
                                    opacity: [0.1, 0.2, 0.1]
                                }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className='absolute -top-1/2 -left-1/2 w-full h-full bg-blue-600/20 blur-[120px] rounded-full' 
                            />
                            <motion.div 
                                animate={{ 
                                    scale: [1.2, 1, 1.2],
                                    rotate: [0, -90, 0],
                                    opacity: [0.1, 0.2, 0.1]
                                }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className='absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-600/20 blur-[120px] rounded-full' 
                            />
                        </div>

                        <motion.div 
                            initial={{ scale: 0.8, y: 40, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className='max-w-xl w-full p-10 text-center space-y-10 bg-[#121212]/80 border border-white/10 rounded-[3.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden'
                        >
                            <div className='absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent' />
                            
                            <div className='space-y-6'>
                                <motion.div 
                                    initial={{ rotate: -10, scale: 0.5, opacity: 0 }}
                                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className='w-28 h-28 bg-gradient-to-tr from-blue-600/20 to-blue-400/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-2xl shadow-blue-500/10'
                                >
                                    <Video className='w-14 h-14 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' />
                                </motion.div>
                                
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h1 className='text-5xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent'>
                                        Ready to join?
                                    </h1>
                                    <p className='text-gray-500 font-medium'>Hello <span className='text-blue-400'>{userData?.name}</span>, your meeting is active.</p>
                                </motion.div>

                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className='flex flex-col items-center gap-3 pt-2'
                                >
                                    <span className='text-[10px] font-black uppercase tracking-[0.3em] text-gray-600'>Meeting Identity</span>
                                    <div className='flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-inner group hover:border-blue-500/30 transition-all duration-500'>
                                        <div className='w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]' />
                                        <span className='text-xl font-mono font-black tracking-[0.2em] text-blue-500'>
                                            {url}
                                        </span>
                                    </div>
                                </motion.div>
                            </div>

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
                                                if (socketRef.current) {
                                                    socketRef.current.emit("join-call", url, userData.name)
                                                }
                                            }}
                                            className='w-full sm:w-auto px-16 py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:shadow-[0_25px_50px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:scale-95'
                                        >
                                            Join Meeting
                                        </button>
                                    </>
                                )}
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className='pt-10 flex items-center justify-center gap-8 text-gray-600 border-t border-white/5'
                            >
                                <div className='flex items-center gap-2.5 group cursor-default'>
                                    <Shield className='w-4 h-4 text-green-500/50 group-hover:text-green-500 transition-colors' />
                                    <span className='text-[9px] font-black uppercase tracking-[0.2em]'>Private Room</span>
                                </div>
                                <div className='flex items-center gap-2.5 group cursor-default'>
                                    <Lock className='w-4 h-4 text-blue-500/50 group-hover:text-blue-500 transition-colors' />
                                    <span className='text-[9px] font-black uppercase tracking-[0.2em]'>Encrypted</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* Header */}
            <div className='p-4 flex justify-between items-center bg-[#1a1a1a]/80 backdrop-blur-md border-b border-white/5'>
                <div className='flex items-center gap-3'>
                    <div className='bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20'>
                        <Video className='text-white w-5 h-5' />
                    </div>
                    <div className='hidden sm:block'>
                        <h2 className='font-bold text-sm tracking-tight'>TeamMeet Room</h2>
                        <div className='flex items-center gap-2'>
                            <p className='text-[10px] text-gray-500 font-mono uppercase tracking-widest'>{url}</p>
                            <div className='w-1 h-1 bg-green-500 rounded-full animate-pulse' />
                            <span className='text-[10px] text-green-500 font-bold uppercase'>Live</span>
                        </div>
                    </div>
                </div>
                
                <div className='flex items-center gap-2'>
                    {isHost && (
                        <button 
                            onClick={() => setShowInviteModal(true)}
                            className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 border border-blue-500/20'
                        >
                            <Share className='w-3.5 h-3.5' />
                            <span className='hidden md:inline'>Invite Others</span>
                        </button>
                    )}

                    <div className='h-8 w-[1px] bg-white/10 mx-1' />

                    <div className='flex items-center bg-white/5 rounded-xl p-1 border border-white/5'>
                        <button 
                            onClick={() => {
                                setShowParticipants(!showParticipants)
                                setShowChat(false)
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showParticipants ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Users className='w-3.5 h-3.5' />
                            {peers.length + 1}
                        </button>
                        <button 
                            onClick={() => {
                                setShowChat(!showChat)
                                setShowParticipants(false)
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showChat ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <MessageSquare className='w-3.5 h-3.5' />
                            {messages.length > 0 && (
                                <span className='absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full' />
                            )}
                        </button>
                    </div>

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
                            className='flex items-center gap-2 px-3 py-2 bg-blue-600/10 text-blue-500 rounded-xl text-xs font-bold border border-blue-600/20 hover:bg-blue-600/20 transition-all'
                        >
                            <Shield className='w-3.5 h-3.5' />
                            <span className='hidden lg:inline'>Host Controls</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Admission Requests Popup */}
            <div className='fixed top-24 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-4'>
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
            <div className='fixed top-20 right-4 z-50 flex flex-col gap-2'>
                <AnimatePresence>
                    {notifications.map(n => (
                        <motion.div 
                            key={n.id}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className='bg-blue-600/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 border border-white/20'
                        >
                            <div className='bg-white/20 p-1.5 rounded-full'>
                                <Users className='w-4 h-4' />
                            </div>
                            {n.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] rounded-3xl border border-white/10 p-8 max-w-md w-full shadow-2xl relative overflow-hidden'
                        >
                            <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600' />
                            <button 
                                onClick={() => setShowInviteModal(false)}
                                className='absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors'
                            >
                                <X className='w-5 h-5 text-gray-400' />
                            </button>

                            <div className='text-center space-y-4 mb-8'>
                                <div className='w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20'>
                                    <Share className='w-10 h-10 text-white' />
                                </div>
                                <h3 className='text-3xl font-black tracking-tight'>Invite Participants</h3>
                                <p className='text-gray-400 text-sm max-w-[250px] mx-auto'>Share this unique meeting link with your team to start collaborating.</p>
                            </div>

                            <div className='space-y-6'>
                                <div className='bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4'>
                                    <span className='text-sm font-mono text-gray-300 truncate'>{window.location.href}</span>
                                    <button 
                                        onClick={copyLink}
                                        className={`flex-shrink-0 p-3 rounded-xl transition-all ${copied ? 'bg-green-500/20 text-green-500' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'}`}
                                    >
                                        {copied ? <Check className='w-5 h-5' /> : <Copy className='w-5 h-5' />}
                                    </button>
                                </div>

                                <div className='flex items-center gap-4'>
                                    <button 
                                        onClick={() => {
                                            const text = `Join my TeamMeet meeting: ${window.location.href}`;
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: 'TeamMeet Meeting',
                                                    text: text,
                                                    url: window.location.href,
                                                })
                                            } else {
                                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
                                            }
                                        }}
                                        className='flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-bold transition-all group'
                                    >
                                        <ExternalLink className='w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform' />
                                        Share Invite
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowInviteModal(false)}
                                className='w-full mt-8 text-gray-500 hover:text-white text-sm font-medium transition-colors'
                            >
                                Skip for now
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Grid */}
            <div className='flex-1 flex overflow-hidden relative p-4 gap-4'>
                <div className={`flex-1 grid gap-4 transition-all duration-500 ${
                    peers.length === 0 ? 'grid-cols-1' : 
                    peers.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 
                    peers.length === 2 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 
                    'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                }`}>
                    {/* Local Video */}
                    <motion.div 
                        layout 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className='relative rounded-3xl overflow-hidden bg-[#222] border-2 border-blue-600 shadow-2xl group'
                    >
                        <video 
                            muted 
                            ref={localVideoRef} 
                            autoPlay 
                            playsInline 
                            style={{ filter: currentFilter === 'blur' ? 'blur(10px)' : currentFilter === 'sepia' ? 'sepia(0.8)' : currentFilter === 'grayscale' ? 'grayscale(1)' : 'none' }}
                            className={`w-full h-full object-cover transition-opacity duration-500 ${videoOn ? 'opacity-100' : 'opacity-0'}`} 
                        />
                        {!videoOn && (
                            <div className='absolute inset-0 flex flex-col items-center justify-center bg-[#2a2a2a]'>
                                <div className='w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/10'>
                                    Me
                                </div>
                                <p className='mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest'>Camera is Off</p>
                            </div>
                        )}
                        <div className='absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10'>
                            <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse' />
                            {!micOn && <MicOff className='w-3 h-3 text-red-500' />}
                            <span className='text-[10px] font-bold uppercase tracking-wider text-blue-400'>
                                {isHost ? "Host (You)" : "You"}
                            </span>
                            {raiseHand && (
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className='bg-yellow-500 p-1 rounded-full'
                                >
                                    <Hand className='w-2.5 h-2.5 text-black fill-black' />
                                </motion.div>
                            )}
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

                {/* Sidebar - Chat & Participants */}
                <AnimatePresence>
                    {(showChat || showParticipants) && (
                        <motion.div 
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className='w-80 bg-[#1a1a1a] rounded-3xl border border-white/5 flex flex-col shadow-2xl overflow-hidden'
                        >
                            {showChat ? (
                                <>
                                    <div className='p-6 border-b border-white/5 flex justify-between items-center bg-white/5'>
                                        <h3 className='font-bold flex items-center gap-2'>
                                            <MessageSquare className='w-4 h-4 text-blue-500' />
                                            In-call messages
                                        </h3>
                                        <button onClick={() => setShowChat(false)} className='p-2 hover:bg-white/10 rounded-xl transition-all'>
                                            <X className='w-4 h-4' />
                                        </button>
                                    </div>
                                    <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                                        {messages.length === 0 ? (
                                            <div className='h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40'>
                                                <div className='w-12 h-12 bg-white/10 rounded-full flex items-center justify-center'>
                                                    <MessageSquare className='w-6 h-6' />
                                                </div>
                                                <p className='text-xs font-medium'>No messages yet. Send one to start the conversation!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, idx) => (
                                                <div key={idx} className={`flex flex-col ${msg.sender === "Me" ? 'items-end' : 'items-start'}`}>
                                                    <div className='flex items-center gap-2 mb-1'>
                                                        <span className='text-[10px] font-bold text-gray-500 uppercase tracking-widest'>{msg.sender}</span>
                                                        <span className='text-[10px] text-gray-600'>{msg.time}</span>
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-2xl text-sm max-w-[90%] shadow-sm ${
                                                        msg.sender === "Me" ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-200 rounded-tl-none'
                                                    }`}>
                                                        {msg.data}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <form onSubmit={sendMessage} className='p-4 border-t border-white/5 flex gap-2 bg-white/5'>
                                        <input 
                                            type="text" 
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Send a message..."
                                            className='flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 transition-all'
                                        />
                                        <button type='submit' className='bg-blue-600 p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20'>
                                            <Send className='w-4 h-4' />
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className='p-6 border-b border-white/5 flex justify-between items-center bg-white/5'>
                                        <h3 className='font-bold flex items-center gap-2'>
                                            <Users className='w-4 h-4 text-blue-500' />
                                            Participants ({peers.length + 1})
                                        </h3>
                                        <button onClick={() => setShowParticipants(false)} className='p-2 hover:bg-white/10 rounded-xl transition-all'>
                                            <X className='w-4 h-4' />
                                        </button>
                                    </div>
                                    <div className='flex-1 overflow-y-auto p-4 space-y-2'>
                                        {/* Local User */}
                                        <div className='flex items-center justify-between p-3 bg-blue-600/10 border border-blue-600/20 rounded-2xl'>
                                            <div className='flex items-center gap-3'>
                                                <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold'>Me</div>
                                                <span className='text-sm font-bold text-blue-400'>
                                                    {isHost ? "You (Host)" : "You"}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                {!micOn && <MicOff className='w-3.5 h-3.5 text-red-500' />}
                                                {!videoOn && <VideoOff className='w-3.5 h-3.5 text-red-500' />}
                                            </div>
                                        </div>
                                        {/* Remote Users */}
                                        {peers.map((peerObj) => {
                                            const participant = participants.find(u => u.id === peerObj.peerID)
                                            const pName = participant?.name || 'Participant'
                                            return (
                                                <div key={peerObj.peerID} className='flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group'>
                                                    <div className='flex items-center gap-3'>
                                                        <div className='w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold uppercase'>{pName.charAt(0)}</div>
                                                        <span className='text-sm font-medium text-gray-300 truncate max-w-[100px]'>
                                                            {pName} {participant?.isHost && "(Host)"}
                                                        </span>
                                                    </div>
                                                    {isHost && (
                                                        <button 
                                                            onClick={() => removeParticipant(peerObj.peerID)}
                                                            className='opacity-0 group-hover:opacity-100 p-1.5 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all'
                                                        >
                                                            <X className='w-3.5 h-3.5' />
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className='p-6 flex justify-center items-center gap-4 bg-gradient-to-t from-black to-transparent pb-8'>
                <div className='flex items-center gap-3 bg-[#1a1a1a]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl'>
                    <button 
                        onClick={toggleMic}
                        className={`p-3 rounded-xl transition-all ${micOn ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    >
                        {micOn ? <Mic className='w-5 h-5' /> : <MicOff className='w-5 h-5' />}
                    </button>
                    <button 
                        onClick={toggleVideo}
                        className={`p-3 rounded-xl transition-all ${videoOn ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    >
                        {videoOn ? <Video className='w-5 h-5' /> : <VideoOff className='w-5 h-5' />}
                    </button>
                    <button 
                        onClick={toggleScreenShare}
                        className={`p-3 rounded-xl transition-all ${screenShareOn ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        <Share className='w-5 h-5' />
                    </button>
                    <button 
                        onClick={toggleHand}
                        className={`p-3 rounded-xl transition-all ${raiseHand ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        <Hand className='w-5 h-5' />
                    </button>
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        <Circle className='w-5 h-5 fill-current' />
                    </button>
                    <button 
                        onClick={() => setShowChat(!showChat)}
                        className={`p-3 rounded-xl transition-all ${showChat ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        <MessageSquare className='w-5 h-5' />
                    </button>
                    
                    {isHost && (
                        <button 
                            onClick={toggleWhiteboard}
                            className={`p-3 rounded-xl transition-all ${showWhiteboard ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                            title="Whiteboard"
                        >
                            <WhiteboardIcon className='w-5 h-5' />
                        </button>
                    )}
                    
                    <div className='relative'>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 rounded-xl transition-all ${currentFilter !== 'none' ? 'bg-purple-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                            <Sparkles className='w-5 h-5' />
                        </button>
                        
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div 
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: -100, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className='absolute left-1/2 -translate-x-1/2 flex gap-2 bg-[#1a1a1a] p-3 rounded-2xl border border-white/10 shadow-2xl'
                                >
                                    {[
                                        { id: 'none', label: 'None' },
                                        { id: 'blur', label: 'Blur' },
                                        { id: 'sepia', label: 'Sepia' },
                                        { id: 'grayscale', label: 'Gray' }
                                    ].map(f => (
                                        <button 
                                            key={f.id}
                                            onClick={() => {
                                                setCurrentFilter(f.id)
                                                setShowFilters(false)
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${currentFilter === f.id ? 'bg-purple-600' : 'bg-white/5 hover:bg-white/10'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className='w-[1px] h-8 bg-white/10 mx-1' />
                    <button 
                        onClick={() => navigate("/home")}
                        className='bg-red-600 hover:bg-red-700 p-3 rounded-xl transition-all shadow-lg shadow-red-600/20'
                    >
                        <PhoneOff className='w-5 h-5' />
                    </button>
                </div>
            </div>
        </div>
    )
}

const VideoMeetWithAuth = withAuth(VideoMeetComponent);
export default VideoMeetWithAuth;

const RemoteVideo = ({ peer, id, name, isRemoteHost, handRaised, isHost, onRemove }) => {
    const ref = useRef()
    const [stream, setStream] = useState(null)

    useEffect(() => {
        const handleStream = (remoteStream) => {
            setStream(remoteStream)
            if (ref.current) ref.current.srcObject = remoteStream
        }
        
        peer.on("stream", handleStream)
        
        return () => {
            peer.off("stream", handleStream)
        }
    }, [peer])

    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='relative rounded-3xl overflow-hidden bg-[#222] border border-white/5 shadow-2xl group'
        >
            <video 
                playsInline 
                autoPlay 
                ref={ref} 
                className={`w-full h-full object-cover transition-opacity duration-500 ${stream ? 'opacity-100' : 'opacity-0'}`} 
            />
            
            {!stream && (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-[#2a2a2a] space-y-4'>
                    <div className='w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold animate-pulse uppercase'>
                        {name.charAt(0)}
                    </div>
                    <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest'>Connecting...</p>
                </div>
            )}

            <div className='absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10'>
                <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                <span className='text-[10px] font-bold text-gray-300 uppercase tracking-wider'>
                    {name} {isRemoteHost && "(Host)"}
                </span>
                {handRaised && (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className='bg-yellow-500 p-1 rounded-full'
                    >
                        <Hand className='w-2.5 h-2.5 text-black fill-black' />
                    </motion.div>
                )}
            </div>

            {isHost && (
                <div className='absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0'>
                    <button 
                        onClick={onRemove}
                        className='p-2 bg-red-600 hover:bg-red-700 backdrop-blur-md rounded-xl border border-white/10 text-white shadow-xl transition-all'
                        title="Remove Participant"
                    >
                        <X className='w-4 h-4' />
                    </button>
                </div>
            )}
        </motion.div>
    )
}
