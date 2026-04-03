'use client'
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client';
import { usePeer } from './PeerProvider';


// socket context
export const SocketContext = createContext(null);

// useSocket hooks
export const useSocket = () => useContext(SocketContext);


// provider component
export default function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [remoteUserId, setRemoteUserId] = useState(null);
    const router = useRouter();
    const { createOffer, createAnswer, recievedAnswer, handleAddIceCandidate, candidates  } = usePeer();

    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:5000");

        // connection
        socketInstance.on("connect", () => {
            console.log(socketInstance.id);
            setSocket(socketInstance);
        });

        // joined room
        socketInstance.on("joined-room", ({ roomId }) => {
            router.push(`/room/${roomId}`);
        })


        // create offer on new user joined  
        socketInstance.on("user-joined", async ({ userEmail, userId }) => {
            setRemoteUserId(userId);
            const offer = await createOffer();


            socketInstance.emit("send-offer", { offer, to: userId });
        });




        // recieve offer and send answer
        socketInstance.on("receive-offer", async ({ offer, from }) => {
            console.log("offer received from", from, "with offer", offer);
            const answer = await createAnswer(offer);


            // emit answer to the server
            socketInstance.emit("send-answer", { answer, to: from });
        })



        // recieve answer 
        socketInstance.on("receive-answer", async ({ answer, from }) => {
            console.log("answer received from", from, "with answer", answer);
            await recievedAnswer(answer);
        })


        // recieve ice candidate (from peer)
        socketInstance.on("receive-ice", async ({ candidate, from }) => {
            console.log('received ice candidate from', from, candidate);
            await handleAddIceCandidate(candidate);
        })

        return () => {
            socketInstance.disconnect();
        }

    }, []);


    useEffect(() => {
        if (socket && candidates.length > 0) {
            const latestCandidate = candidates[candidates.length - 1];
            socket.emit('send-ice', { candidate: latestCandidate  , to: remoteUserId});
        }
    }, [candidates, socket , remoteUserId]);


    // join room
    const joinRoom = (roomId, userEmail) => {
        if (socket) {
            socket.emit("join-room", { roomId, userEmail });
        }
    }

    const values = {
        socket,
        joinRoom
    }

    return (
        <SocketContext.Provider value={values}>
            {children}
        </SocketContext.Provider>
    )
}
