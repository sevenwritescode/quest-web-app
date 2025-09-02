import { useState, useEffect } from "react"
import type { LandingState } from "./App"

interface LandingProps {
  payload: LandingState,
  doPayloadChange: (patch: Partial<LandingState>) => void,
  doHostClick: () => void,
  doJoinClick: () => void
}

export default function Landing(props: LandingProps) {
  // 1) local flag to drive show/hide of the error banner
  const [errorVisible, setErrorVisible] = useState(false)

  // 2) whenever payload.error changes, (re)start timers
  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout>
    let clearTimer: ReturnType<typeof setTimeout>

    if (props.payload.error) {
      // show immediately
      setErrorVisible(true)
      // after 2s, start fade-out
      fadeTimer = setTimeout(() => setErrorVisible(false), 2000)
      // after 2s + 0.5s (fade duration), clear the error in the parent
      clearTimer = setTimeout(
        () => props.doPayloadChange({ error: undefined }),
        2500
      )
    }
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(clearTimer)
    }
  }, [props.payload.error])

  const validateCodeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    let input = event.target.value.replace(/[^A-Za-z]/g, "").toUpperCase()
    if (input.length > 4) input = input.slice(0, 4)
    props.doPayloadChange({ code: input })
  }

  return (
    <>
      {/* flash‐type error banner */}
      <div
        className={
          "fixed top-4 left-1/2 -translate-x-1/2 " +
          "bg-red-600 text-white px-4 py-2 rounded shadow-lg " +
          "transition-opacity " +
          // show instantly, fade out over 500ms
          (errorVisible
            ? "opacity-100 duration-0"
            : "opacity-0 duration-500")
        }
      >
        {props.payload.error}
      </div>

      {/* rest of your landing page */}
      <div className="flex justify-center text-center align-middle text-shadow-[0px_4px_8px_rgba(0,0,0,0.75)] font-serif text-5xl p-10">
        <h1>
          The{" "}
          <span className="font-[Chomsky] text-6xl text-[rgb(213,4,4)]">
            Quest
          </span>{" "}
          Companion App
        </h1>
      </div>

        <div className="flex justify-center space-x-6 items-center font-[Consolas]">
          <button className={`h-12 w-28  text-white rounded m-1 flex items-center justify-center font-mono text-shadow-lg text-2xl shadow-xl
          ${props.payload.hostLoading ? "bg-[rgb(184,77,0)]" : "bg-[rgb(230,97,2)] hover:bg-[rgb(184,77,0)]"}`}
          
          onClick={props.doHostClick}>
            {props.payload.hostLoading ? "Host..." : "Host"}
          </button>
          <div className="flex items-center space-x-2 m-2">
            <button
              className={`h-12 p-2 text-white rounded  m-1 flex items-center justify-center font-mono text-shadow-lg text-2xl shadow-xl
              ${props.payload.joinLoading ? "bg-green-700" : "bg-green-600 hover:bg-green-700"}`}
              onClick={props.doJoinClick}
            >
              <input
                type="text"
                size={4}
                onClick={(e) => e.stopPropagation()}
                value={props.payload.code}
                onChange={validateCodeInput}
                className="rounded bg-green-800 h-8 px-2 mr-2 text-left placeholder-gray-400 focus:outline-none"
                placeholder="----"
              />
              Join
            </button>
          </div>
        </div>
    </>
  )
}