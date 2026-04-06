'use client'
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client';
import { usePeer } from './PeerProvider';

export const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [remoteUserId, setRemoteUserId] = useState(null);
    const router = useRouter();
    const { createOffer, createAnswer, recievedAnswer, handleAddIceCandidate, candidates, getMediaStream } = usePeer();

    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:5000");

        socketInstance.on("connect", () => {
            console.log("Socket connected:", socketInstance.id);
            setSocket(socketInstance);
        });

        socketInstance.on("joined-room", ({ roomId }) => {
            console.log("Joined room:", roomId);
            router.push(`/room/${roomId}`);
        });

        // 🔥 একজন ইউজার জয়েন করলে
        socketInstance.on("user-joined", async ({ userEmail, userId }) => {
            console.log("User joined event:", { userEmail, userId });
            setRemoteUserId(userId);

            // মিডিয়া স্ট্রিম নিন
            const stream = await getMediaStream();
            console.log("Media stream obtained:", stream?.id);

            // একটু delay দিন ICE candidates সেটআপের জন্য
            setTimeout(async () => {
                const offer = await createOffer();
                console.log("Offer created, sending to:", userId);
                socketInstance.emit("send-offer", { offer, to: userId });
            }, 1000);
        });

        // 🔥 offer রিসিভ করলে
        socketInstance.on("receive-offer", async ({ offer, from }) => {
            console.log("Offer received from:", from);
            setRemoteUserId(from);

            // মিডিয়া স্ট্রিম নিন
            const stream = await getMediaStream();
            console.log("Media stream obtained for answer:", stream?.id);

            setTimeout(async () => {
                const answer = await createAnswer(offer);
                console.log("Answer created, sending to:", from);
                socketInstance.emit("send-answer", { answer, to: from });
            }, 1000);
        });

        // 🔥 answer রিসিভ করলে
        socketInstance.on("receive-answer", async ({ answer, from }) => {
            console.log("Answer received from:", from);
            await recievedAnswer(answer);
        });

        // 🔥 ICE candidate রিসিভ করলে
        socketInstance.on("receive-ice", async ({ candidate, from }) => {
            console.log('ICE candidate received from:', from);
            await handleAddIceCandidate(candidate);
        });

        // 🔥 ICE candidate error
        socketInstance.on("ice-candidate-error", (error) => {
            console.error("ICE candidate error:", error);
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []); // খালি dependency array

    // 🔥 ICE candidate পাঠানো - remoteUserId চেক করে
    // ICE candidate পাঠানোর জন্য - সব candidate ইমিট করুন
    useEffect(() => {
        if (!socket || !remoteUserId) {
            return;
        }

        // সব candidate ইমিট করুন, শুধু শেষটা না
        if (candidates.length > 0) {
            // সব candidate পাঠান
            candidates.forEach(candidate => {
                console.log("Sending ICE candidate to:", remoteUserId);
                socket.emit("send-ice", {
                    candidate: candidate,
                    to: remoteUserId
                });
            });
        }
    }, [candidates, socket, remoteUserId]);

    const joinRoom = (roomId, userEmail) => {
        if (socket) {
            console.log("Joining room:", roomId);
            socket.emit("join-room", { roomId, userEmail });
        } else {
            console.log("Socket not ready yet");
        }
    };

    const values = {
        socket,
        joinRoom,
        remoteUserId
    };

    return (
        <SocketContext.Provider value={values}>
            {children}
        </SocketContext.Provider>
    );
}