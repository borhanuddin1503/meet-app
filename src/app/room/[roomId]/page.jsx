'use client'
import { usePeer } from '@/providers/PeerProvider'
import { useParams } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

export default function page() {
    const { localVideoRef, remoteVideoRef , getMediaStream } = usePeer();

    const { roomId } = useParams();
    console.log('romm id from room page', roomId)


    useEffect(() => {
        const init = async() => {
            const stream = await getMediaStream();

            if(localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        }

        init();
    }, [getMediaStream])

    return (
        <div>
            <h1 className='text-3xl font-bold mb-5'>Room: {roomId}</h1>
            {/* video container */}
            <div className='flex flex-col gap-5 md:flex-row'>
                <div>
                    <video ref={localVideoRef} autoPlay playsInline muted></video>
                </div>
                <div>
                    <video ref={remoteVideoRef} autoPlay playsInline></video>
                </div>
            </div>
        </div>
    )
}
