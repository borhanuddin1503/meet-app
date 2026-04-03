'use client'
import PeerProvider from '@/providers/PeerProvider'
import React from 'react'

export default function PeerProviderWrapper({children}) {
  return (
    <PeerProvider>
        {children}
    </PeerProvider>
  )
}
