import { useState, useEffect } from "react"
import type { LandingState } from "./App"
import "./css/Landing.css"

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
      {/* flash-type error banner */}
      <div className={`error-banner ${errorVisible ? 'error-visible' : 'error-hidden'}`}>
        {props.payload.error}
      </div>

      {/* rest of your landing page */}
      <div className="landing-section">
        <h1>
          The <span className="title-highlight">Quest</span> Companion App
        </h1>
      </div>

      <div className="controls">
        <div className="name-input-container">
          <div className="name-input-label"> 
            Name:
          </div>
          <input 
            type="text" 
            value={props.payload.name}
            onChange={(e) => props.doPayloadChange({name: e.target.value})}
            className="name-input" 
          />
        </div>
        
        <button
          className={`host-button${props.payload.hostLoading ? ' loading' : ''}`}
          onClick={props.doHostClick}
        >
          {props.payload.hostLoading ? 'Host...' : 'Host'}
        </button>

        <div className="join-container">
          <button
            className={`join-button${props.payload.joinLoading ? ' loading' : ''}`}
            onClick={props.doJoinClick}
          >
            <input
              type="text"
              value={props.payload.code}
              onClick={e => e.stopPropagation()}
              onChange={validateCodeInput}
              className="join-input"
              placeholder="----"
            />
            Join
          </button>
        </div>
      </div>
    </>
  );
}