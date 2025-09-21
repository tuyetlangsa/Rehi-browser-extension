import { useState } from "react"

export default function RehiPopup() {
  return (
    <div className="w-[400px] h-[400px] bg-gradient-to-b from-pink-500 via-purple-600 to-indigo-700 flex flex-col items-center justify-center text-white p-4">
      {/* Slogan */}
      <h1 className="text-2xl font-bold mb-4 text-center">
        ✨ Rehi - Browse with Style ✨
      </h1>

      {/* Waifu image */}
      <img
        src="https://preview.redd.it/can-someone-help-me-find-this-kinda-hoodie-chii-is-wearing-v0-yvu8l45ghxtd1.png?width=1080&crop=smart&auto=webp&s=17acac40a0f38085143f68b3a4c4b9865ac465be"
        alt="Rehi Waifu"
        className="rounded-xl shadow-lg max-h-[400px] object-cover"
      />
    </div>
  )
}
