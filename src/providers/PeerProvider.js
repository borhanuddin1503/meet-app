import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

// create peer context
export const peerContext = createContext();


// usePeer hooks to use peer contexts
export const usePeer = () => useContext(peerContext);

export default function PeerProvider({ children }) {
    // peer ref
    const peerRef = useRef();
    const remoteVideoRef = useRef();
    const localVideoRef = useRef();
    const [candidates, setCandidates] = useState([])

    // create peer connection
    const peerConnection = () => {
        if (!peerRef.current) {
           const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };


            const peer = new RTCPeerConnection(configuration);

            peerRef.current = peer;
        }

        return peerRef.current;
    };

    // create offer
    const createOffer = async () => {
        const peer = peerConnection();

        // create offer
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        return offer;
    }


    // create answer
    const createAnswer = async (offer) => {
        const peer = peerConnection();

        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        return answer;
    }


    // recieved answer
    const recievedAnswer = async (answer) => {
        const peer = peerConnection();
        await peer.setRemoteDescription(answer);
    }



    // handle add ice candidate
    const handleAddIceCandidate = async (candidate) => {
        console.log("handleAddIceCandidate called with candidate:", candidate);

        const peer = peerConnection();
        if (!candidate) {
            console.warn("handleAddIceCandidate called without candidate");
            return;
        }
        try {
            await peer.addIceCandidate(candidate);
        } catch (err) {
            console.error("addIceCandidate failed", err, candidate);
        }
    };


    // get media stream
    const getMediaStream = async () => {
        let stream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            if(localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.log("No camera/mic, using empty stream");
            stream = new MediaStream();
        }
        const peer = peerConnection();

        stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
        });

        return stream;
    };


    const handleTrackEvent = (event) => {
        console.log("🔥 Received remote track", event.streams[0]);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
        }
    }

    useEffect(() => {
        const peer = peerConnection();
        peer.ontrack = (event) => {
            handleTrackEvent(event);
        };


        peer.onicecandidate = (event) => {
            console.log("🔥 ICE Candidate Event:", event);
            if (event.candidate) {
                setCandidates(prev => [...prev, event.candidate]);
            }
        };
    }, [])

    const values = {
        createOffer,
        createAnswer,
        recievedAnswer,
        handleAddIceCandidate,
        getMediaStream,
        remoteVideoRef,
        localVideoRef,
        candidates
    }

    return (
        <peerContext.Provider value={values}>
            {children}
        </peerContext.Provider>
    )
}
