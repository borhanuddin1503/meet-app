'use client'
import { useSocket } from "@/providers/SocketProvider";
import Image from "next/image";

export default function Home() {
  // socket from usesocket hooks
  const {joinRoom} = useSocket();

  // handle submit form
  const handleSubmitForm = (e) => {
   e.preventDefault();

   console.log(e.target.roomId.value , e.target.email.value);

  //  request to join room with room Id
  joinRoom(e.target.roomId.value , e.target.email.value);
  }




  return (
    <main className="min-h-screen flex flex-col justify-center items-center">
      <div className="p-10 rounded-2xl bg-linear-to-b from-pink-200 to-white max-w-200 mx-auto shadow-lg">
        <h2 className="text-4xl font-montserrat font-semibold mb-10">Video calling app</h2>

        <form className="flex flex-col gap-5" onSubmit={handleSubmitForm}>
          <input placeholder="Your Email" className="p-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400" name="email"></input>
          <input placeholder="Room Id" className="p-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400" name="roomId"></input>

          <button type="submit" className="bg-pink-400 cursor-pointer text-white py-3 rounded-md hover:bg-pink-500 transition-colors duration-300">Join Room</button>
        </form>
      </div>
    </main>

  )
}
