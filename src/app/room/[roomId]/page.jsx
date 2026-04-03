'use client'
import { usePeer } from '@/providers/PeerProvider'
import { useParams } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

export default function page() {
    const { getMediaStream, remoteVideoRef } = usePeer();
    const videoRef = useRef();

    useEffect(() => {
        const init = async () => {
            const stream = await getMediaStream();
            videoRef.current.srcObject = stream;
        };

        init();
    }, []);

    const { roomId } = useParams();
    console.log('romm id from room page', roomId)

    return (
        <div>
            <h1 className='text-3xl font-bold mb-5'>Room: {roomId}</h1>
            {/* video container */}
            <div className='flex flex-col gap-5 md:flex-row'>
                <div>
                    <video ref={videoRef} autoPlay playsInline muted></video>
                </div>
                <div>
                    <video ref={remoteVideoRef} autoPlay playsInline></video>
                </div>
            </div>
        </div>
    )
}
