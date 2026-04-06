'use client'
import { usePeer } from '@/providers/PeerProvider'
import { useSocket } from '@/providers/SocketProvider';
import React, { useEffect, useRef, useState } from 'react'

export default function RoomPage({ params }) {
    const { localVideoRef, remoteVideo } = usePeer();
    const { remoteUserId } = useSocket();
    const remoteVideoRef = useRef(null);
    // const [localReady, setLocalReady] = useState(false);

    // Next.js 15 এর জন্য params unwrap করুন
    const [roomId, setRoomId] = React.useState(null);

    React.useEffect(() => {
        async function getParams() {
            const unwrapped = await params;
            setRoomId(unwrapped.roomId);
        }
        getParams();
    }, [params]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteVideo) {
            console.log("Setting remote video stream");
            remoteVideoRef.current.srcObject = remoteVideo;
        }

    }, [remoteVideo]);

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         if (localVideoRef.current?.srcObject) {
    //             setLocalReady(true);
    //             clearInterval(interval); // একবার ready হলেই interval বন্ধ
    //         }
    //     }, 100); // প্রতি 100ms check

    //     return () => clearInterval(interval);
    // }, [localVideoRef]);

    return (
        <div>
            <h1 className='text-3xl font-bold mb-5'>Room: {roomId || 'Loading...'}</h1>
            <h3>Connected with: {remoteUserId || 'Waiting for peer...'}</h3>

            <div className='flex flex-col gap-5 md:flex-row'>
                <div>
                    <div>
                        <h4>Local Video</h4>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ width: "300px", height: "200px", background: "#000" }}
                        />

                    </div>
                </div>
                <div>
                    <h4>Remote Video</h4>
                    {remoteVideo ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={{ width: "300px", height: "200px", background: "#000" }}
                        />
                    ) : (
                        <div style={{ width: "300px", height: "200px", background: "#000" }} className='flex items-center justify-center'>
                            <p className='text-red-400 '>Video Is not Available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}