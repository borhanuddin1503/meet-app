'use client'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

// create peer context
export const peerContext = createContext();

// usePeer hook
export const usePeer = () => useContext(peerContext);

export default function PeerProvider({ children }) {

    const peerRef = useRef(null);
    const [remoteVideo, setRemoteVideo] = useState(null);
    const localVideoRef = useRef(null);
    const pendingCandidates = useRef([]); // 🔹 buffer for early ICE candidates
    const [candidates, setCandidates] = useState([]);

    // =========================
    // CREATE PEER CONNECTION
    // =========================
    useEffect(() => {
        if (!peerRef.current) {
            const configuration = {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                    { urls: "stun:stun2.l.google.com:19302" },
                    { urls: "stun:global.stun.twilio.com:3478" },
                    {
                        urls: [
                            "turn:openrelay.metered.ca:80",
                            "turn:openrelay.metered.ca:443",
                            "turn:openrelay.metered.ca:443?transport=tcp"
                        ],
                        username: "openrelayproject",
                        credential: "openrelayproject"
                    }
                ],
                iceCandidatePoolSize: 10,
                // iceTransportPolicy: "all" // "relay" ব্যবহার করবেন না
            };

            const peer = new RTCPeerConnection(configuration);

            // 🔹 ICE generated locally
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("🔥 ICE generated:", event.candidate);
                    setCandidates(prev => [...prev, event.candidate]);
                }
            };


            peerRef.current = peer;
        }

        return () => {
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
        };
    }, []);



    useEffect(() => {
        if (!peerRef.current) return;

        const peer = peerRef.current;

        peer.ontrack = (event) => {
            console.log("🎬 Remote track received:", event.streams[0]);
            console.log("Track kind:", event.track.kind);
            console.log("Stream ID:", event.streams[0].id);

            // নতুন স্ট্রিম সেট করুন
            if (event.streams && event.streams[0]) {
                setRemoteVideo(event.streams[0]);
            }
        };

        // ICE connection state মনিটর করুন
        peer.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", peer.iceConnectionState);
            if (peer.iceConnectionState === 'connected') {
                console.log("✅ ICE Connected successfully!");
            } else if (peer.iceConnectionState === 'failed') {
                console.log("❌ ICE Connection failed!");
            }
        };

        // Connection state মনিটর করুন
        peer.onconnectionstatechange = () => {
            console.log("Connection State:", peer.connectionState);
        };
    }, []);


    // =========================
    // GET MEDIA STREAM
    // =========================
    // GET MEDIA STREAM - এটা ঠিক করুন
    const getMediaStream = async () => {

        let stream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            console.log("Got real media stream");
        } catch (err) {
            console.log("⚠️ No camera/mic, using dummy stream:", err);
            const canvas = document.createElement("canvas");
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "red";
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = "white";
            ctx.font = "30px Arial";
            ctx.fillText("No Camera", 200, 240);
            const fakeStream = canvas.captureStream(30);
            stream = fakeStream;
        }

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            console.log("Local video set");
        }

        const peer = peerRef.current;
        if (peer) {
            stream.getTracks().forEach(track => {
                console.log("Adding track:", track.kind);
                peer.addTrack(track, stream);
            });
        }

        return stream;
    };

    // =========================
    // CREATE OFFER
    // =========================
    const createOffer = async () => {
        const peer = peerRef.current;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    };

    // =========================
    // CREATE ANSWER
    // =========================
    const createAnswer = async (offer) => {
        const peer = peerRef.current;

        await peer.setRemoteDescription(offer);
        console.log("🔹 Remote description set");

        // flush pending ICE candidates
        for (const c of pendingCandidates.current) {
            try {
                await peer.addIceCandidate(c);
                console.log("✅ Flushed ICE candidate:", c);
            } catch (err) {
                console.error("❌ Flushed ICE failed", err, c);
            }
        }
        pendingCandidates.current = [];

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
    };

    // =========================
    // RECEIVE ANSWER
    // =========================
    const recievedAnswer = async (answer) => {
        const peer = peerRef.current;

        await peer.setRemoteDescription(answer);
        console.log("🔹 Remote description set (answer)");

        // flush pending ICE candidates
        for (const c of pendingCandidates.current) {
            try {
                await peer.addIceCandidate(c);
                console.log("✅ Flushed ICE candidate:", c);
            } catch (err) {
                console.error("❌ Flushed ICE failed", err, c);
            }
        }
        pendingCandidates.current = [];
    };

    // =========================
    // HANDLE ICE (REMOTE)
    // =========================
    const handleAddIceCandidate = async (candidate) => {
        const peer = peerRef.current;
        if (!peer) return;

        if (!peer.remoteDescription) {
            console.log("⏳ Candidate buffered (remote not ready)", candidate);
            pendingCandidates.current.push(candidate);
            return;
        }

        try {
            await peer.addIceCandidate(candidate);
            console.log("✅ ICE candidate added:", candidate);
        } catch (err) {
            console.error("❌ addIceCandidate failed", err, candidate);
        }
    };

    // =========================
    // EXPORT VALUES
    // =========================
    const values = {
        createOffer,
        createAnswer,
        recievedAnswer,
        handleAddIceCandidate,
        getMediaStream,
        remoteVideo,
        localVideoRef,
        candidates
    };

    return (
        <peerContext.Provider value={values}>
            {children}
        </peerContext.Provider>
    );
}