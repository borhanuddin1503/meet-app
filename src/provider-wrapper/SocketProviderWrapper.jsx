'use client'
import SocketProvider from '@/providers/SocketProvider'
import React from 'react'

export default function SocketProviderWrapper({children}) {
  return (
    <SocketProvider>
        {children}
    </SocketProvider>
  )
}
